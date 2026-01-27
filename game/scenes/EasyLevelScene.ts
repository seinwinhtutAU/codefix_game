import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import { checkExistingSolveRecord } from "@/services/problem";
import { EventBus } from "@/game/events";
import { IGameProgress, ProblemSolveRecord } from "@/lib/types";

export interface SolvedPointStatus {
  attempts: number;
  isSolved: boolean;
}

export default class EasyLevelScene extends GameScene {
  private problemIds: string[] = [
    "697401975f4942a9208dc6a6",
    "697401ad5f4942a9208dc6bc",
    "697401dc5f4942a9208dc707",
    "69740e795f4942a9208dc8c4",
    "6976a8965f4942a9208dea8f",
    "697908e24b714f4ebc73b1f9",
    "697908e34b714f4ebc73b1fe",
    "697908e44b714f4ebc73b203",
    "697909f24b714f4ebc73b209",
    "697909f34b714f4ebc73b20e",
  ];

  private roadPoints = [
    { x: 225, y: 300 },
    { x: 255, y: 400 },
    { x: 255, y: 550 },
    { x: 366, y: 640 },
    { x: 550, y: 640 },
    { x: 740, y: 640 },
    { x: 885, y: 550 },
    { x: 885, y: 400 },
    { x: 980, y: 315 },
    { x: 1100, y: 315 },
  ];

  private currentPointIndex = 0;
  private mapPoints: Phaser.GameObjects.Image[] = [];
  private solvedPoints: SolvedPointStatus[] = [];
  private maxAttempt = 5;
  private easyLevelCompleted = false;
  private startHereSign!: Phaser.GameObjects.Image;
  private startHereTween?: Phaser.Tweens.Tween;
  private roadProgressGraphics!: Phaser.GameObjects.Graphics;
  private tooltipContainer!: Phaser.GameObjects.Container;
  private tooltipText!: Phaser.GameObjects.Text;
  private solvedRecords: ProblemSolveRecord[] = [];

  constructor() {
    super("EasyLevelScene");
  }
  async create() {
    if (this.savedProgress?.gameState?.eventFlags?.easyLevelCompleted) {
      this.scene.start("HomeScene", this.savedProgress);
      return;
    }
    super.create();

    this.initAudio();
    this.createParticle();
    this.initSolvedPoints();
    this.drawMapAndPoints();
    this.solvedRecords = await this.getAllSolvedRecord();
    this.drawStartHere();
    this.addTooltip();
    this.startHereSign = this.add
      .image(0, 0, "start-here")
      .setDisplaySize(59, 100)
      .setDepth(10)
      .setVisible(false);
    await this.updateAllSolvePoint();

    if (this.checkLevelCompleted()) {
      this.handleLevelTransition();
    }

    this.setUpListener();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      console.log(
        `{ x: ${Math.round(pointer.x)}, y: ${Math.round(pointer.y)} },`,
      );
    });
  }

  update() {}

  private createParticle() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("glow-dot", 16, 16);
    graphics.destroy();
  }

  private addTooltip() {
    // Create the background box
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(0, 0, 180, 120, 10);
    bg.strokeRoundedRect(0, 0, 180, 120, 10);

    // Create the text object
    this.tooltipText = this.add.text(10, 10, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      lineSpacing: 4,
    });

    // Wrap them in a container and hide it
    this.tooltipContainer = this.add.container(0, 0, [bg, this.tooltipText]);
    this.tooltipContainer.setDepth(100).setVisible(false);
  }

  private triggerSolveParticle(x: number, y: number) {
    // Create the emitter using the texture we just generated
    const emitter = this.add.particles(x, y, "glow-dot", {
      speed: { min: 50, max: 200 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      gravityY: 150, // Particles fall down like confetti
      frequency: -1, // Do not emit continuously
      blendMode: "ADD",
      tint: [0xffff00, 0xff8800, 0xffffff], // Randomly picks Gold, Orange, or White
    });

    emitter.setDepth(20); // Ensure it's above the road and points

    // Burst 20 particles at once
    emitter.explode(20);

    // Automatically clean up the emitter after 1.2 seconds
    this.time.delayedCall(1200, () => {
      emitter.destroy();
    });
  }

  private drawRoadProgress() {
    // 1. Initialize or clear the graphics object
    if (!this.roadProgressGraphics) {
      this.roadProgressGraphics = this.add.graphics();
      this.roadProgressGraphics.setDepth(1); // Above map, below points
    }
    this.roadProgressGraphics.clear();

    // 2. We only draw if we have at least one solved point
    if (this.currentPointIndex === 0) return;

    // 3. Set the style for the "Glow"
    // Outer glow (thicker, lower alpha)
    this.roadProgressGraphics.lineStyle(15, 0xffcc00, 0.3);
    this.drawPathSegments();

    // Inner core (thinner, higher alpha)
    this.roadProgressGraphics.lineStyle(7, 0xffff00, 0.8);
    this.drawPathSegments();
  }

  private drawPathSegments() {
    this.roadProgressGraphics.beginPath();

    this.roadProgressGraphics.moveTo(
      this.roadPoints[0].x,
      this.roadPoints[0].y,
    );

    for (let i = 1; i <= this.currentPointIndex; i++) {
      if (i < this.roadPoints.length) {
        this.roadProgressGraphics.lineTo(
          this.roadPoints[i].x,
          this.roadPoints[i].y,
        );
      }
    }

    this.roadProgressGraphics.strokePath();
  }

  private handleProgressResume = async (progress: IGameProgress) => {
    const { currentTask } = progress.gameState;

    this.solvedRecords = await this.getAllSolvedRecord();
    const index = currentTask.currentActiveIndex ?? 0;
    const completedIndex = index - 1;
    const userId = progress.userId;

    const solveRecord = await this.checkPointSolved(
      userId,
      this.problemIds[completedIndex],
    );

    const attempts = solveRecord?.attempt ?? 0;
    const isSolved = solveRecord ? true : false;

    this.updateSolvedPoint(completedIndex, attempts, isSolved);

    const currentUpdated = this.updateCurrentPointIndex(completedIndex);
    if (currentUpdated && this.currentPointIndex < this.mapPoints.length) {
      this.emitTaskStarted(progress);
    }

    if (!this.easyLevelCompleted && this.checkLevelCompleted()) {
      this.handleLevelTransition();
    }

    this.updatePointUI();
  };

  private async checkPointSolved(userId: string, problemId: string) {
    const response = await checkExistingSolveRecord(userId, problemId);
    return response?.data;
  }

  private setUpListener() {
    EventBus.on("resume-after-solve", this.handleProgressResume);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off("resume-after-solve", this.handleProgressResume);
    });
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Using padStart ensures we see "5:05" instead of "5:5"
    const minutesString = minutes.toString().padStart(2, "0");
    const secondsString = remainingSeconds.toString().padStart(2, "0");

    return `${minutesString}:${secondsString}`;
  }

  private drawMapAndPoints() {
    // Clear existing points if they exist
    if (this.mapPoints.length > 0) {
      this.mapPoints.forEach((point) => {
        if (point) {
          point.destroy();
        }
      });
      this.mapPoints = [];
    }

    this.add.image(0, 0, "easy-map").setOrigin(0, 0);

    this.roadPoints.forEach((value, index) => {
      const point = this.add
        .image(value.x, value.y, "easy-point-lock")
        .setDisplaySize(100, 100)
        .setDepth(2);

      point.on("pointerdown", () => {
        AudioManager.getInstance().playSound("click", { volume: 0.5 });
        if (index === this.currentPointIndex) {
          EventBus.emit("ui-open-problem", {
            problemId: this.problemIds[index],
            difficulty: "easy",
          });
        } else if (index > this.currentPointIndex) {
          // Shakes the point to show it's locked
          this.tweens.add({
            targets: point,
            x: value.x + 5,
            duration: 50,
            yoyo: true,
            repeat: 2,
          });
        }
      });

      point.on("pointerover", () => {
        const state = this.getPointState(index);

        // Prepare information strings
        const statusText = state.toUpperCase();
        const pointsEarned = this.solvedRecords[index]?.pointsEarned || 0;
        const totalTime = this.formatTime(
          this.solvedRecords[index]?.timeSpent || 0,
        );
        const attempt = this.solvedRecords[index]?.attempt || 0;
        this.tooltipText.setText(
          `Challenge: #${index + 1}\n` +
            `STATE: ${statusText}\n` +
            `POINTS: ${pointsEarned}\n` +
            `TIME: ${totalTime}(m:s)\n` +
            `ATTEMPT: ${attempt}`,
        );

        // Position above the point
        this.tooltipContainer.setPosition(value.x - 90, value.y - 120);
        this.tooltipContainer.setVisible(true);

        if (index !== this.currentPointIndex)
          this.tweens.add({ targets: point, scale: 1, duration: 100 });
      });

      point.on("pointerout", () => {
        this.tooltipContainer.setVisible(false);
        if (index !== this.currentPointIndex)
          this.tweens.add({ targets: point, scale: 0.78, duration: 100 });
      });

      this.mapPoints.push(point);
    });
  }

  private drawStartHere() {
    this.startHereSign = this.add
      .image(0, 0, "start-here")
      .setDisplaySize(43, 70)
      .setDepth(100)
      .setVisible(false);

    const currentPos = this.roadPoints[this.currentPointIndex];
    const targetX = currentPos.x - 3;
    const targetY = currentPos.y - 32;
    this.animateStartHere(targetX, targetY);
  }

  private animateStartHere(targetX: number, targetY: number) {
    this.startHereTween?.stop();

    this.startHereTween = this.tweens.add({
      targets: this.startHereSign,
      x: targetX,
      y: targetY,
      duration: 1000,
      ease: "Power2.out",
      onComplete: () => {
        this.tweens.add({
          targets: this.startHereSign,
          y: targetY - 10,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });
  }

  private animateCurrentPoint(point: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: point,
      scale: 0.85,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private animateSolvedPoint(point: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: point,
      scale: { from: 0.6, to: 0.8 },
      angle: { from: -20, to: 0 },
      duration: 600,
      ease: "Back.easeOut",
      onStart: () => {
        this.triggerSolveParticle(point.x, point.y);
      },
    });
  }

  private initSolvedPoints() {
    for (let i = 0; i < this.roadPoints.length; i++) {
      this.solvedPoints.push({ attempts: 0, isSolved: false });
    }
  }

  private updatePointUI() {
    this.mapPoints.forEach((point, index) => {
      if (!point || !point.setTint || !point.disableInteractive) {
        console.warn(`Point at index ${index} is not properly initialized`);
        return;
      }

      const state = this.getPointState(index);
      this.tweens.killTweensOf(point);
      // point.setScale(1);
      point.setAlpha(1);
      point.clearTint();
      point.setInteractive({ useHandCursor: true });

      switch (state) {
        case "solved":
          point.setTexture(`easy-point-${index + 1}`);
          this.animateSolvedPoint(point);
          break;
        case "skipped":
          point.setTexture(`easy-point-skip`);
          break;
        case "current":
          // point.setTint(0xffff00);
          point.setTexture(`easy-point-current`);
          point.setInteractive({ useHandCursor: true });
          this.animateCurrentPoint(point);
          break;
        default:
          point.setTexture(`easy-point-lock`);
          point.setInteractive({ useHandCursor: true });
          point.setTint(0xdddddd);
      }
    });

    this.drawRoadProgress();

    const currentPos = this.roadPoints[this.currentPointIndex];
    if (currentPos && this.startHereSign) {
      const targetX = currentPos.x - 3;
      const targetY = currentPos.y - 32;
      this.startHereSign.setPosition(targetX, targetY);
      this.startHereSign.setDisplaySize(43, 70);
      this.startHereSign.setVisible(true);

      this.animateStartHere(targetX, targetY);
    } else {
      this.startHereSign?.setVisible(false);
    }
  }

  private getPointState(index: number) {
    if (index < 0 || index >= this.mapPoints.length) return "locked";

    const { attempts, isSolved } = this.solvedPoints[index];
    if (attempts >= this.maxAttempt) return "skipped";

    if (isSolved) return "solved";
    if (index === this.currentPointIndex) return "current";
    if (index > this.currentPointIndex) return "locked";
    return "locked";
  }

  private updateCurrentPointIndex(index: number): boolean {
    const state = this.getPointState(index);

    console.log("index: ", index);
    console.log("state: ", state);
    console.log("solved point: ", this.solvedPoints[index]);

    if (state === "skipped" || state === "solved") {
      this.currentPointIndex = index + 1;

      return true;
    }

    return false;
  }

  private emitTaskStarted(progress: IGameProgress) {
    EventBus.emit("progress-updated", {
      ...progress,
      gameState: {
        ...progress.gameState,
        currentTask: {
          ...progress.gameState.currentTask,
          taskType: "code_problem",
          status: "in_progress",
          attempts: 0,
          highestHintLevelUsed: "none",
          hintUsages: [],
        },
      },
      bugCounts: [],
    });
  }

  private emitLevelCompleted(progress: IGameProgress) {
    EventBus.emit("progress-updated", {
      ...progress,
      gameState: {
        currentScene: "HomeScene",
        eventFlags: {
          ...progress.gameState.eventFlags,
          easyLevelCompleted: true,
        },
        currentTask: {
          taskType: "none",
          taskId: undefined,
          status: "none",
          attempts: 0,
          timer: 0,
          currentActiveIndex: 0,
          highestHintLevelUsed: "none",
          hintUsages: [],
        },
      },
      bugCounts: [],
    });
  }

  private updateSolvedPoint(
    index: number,
    attempts: number,
    isSolved: boolean,
  ) {
    if (index < 0 || index >= this.mapPoints.length) return;

    this.solvedPoints[index] = {
      attempts,
      isSolved,
    };
  }

  private async updateAllSolvePoint() {
    const userId = this.savedProgress.userId;

    // 1. Map all IDs to a list of promises
    const promises = this.problemIds.map(async (id, index) => {
      const solveRecord = await this.checkPointSolved(userId, id);
      const attempts = solveRecord?.attempt ?? 0;
      const isSolved = !!solveRecord;

      this.solvedPoints[index] = { attempts, isSolved };
    });

    await Promise.all(promises);

    this.calculateCurrentIndex();

    this.updatePointUI();
  }

  private calculateCurrentIndex() {
    const nextIncomplete = this.solvedPoints.findIndex((p) => !p.isSolved);

    this.currentPointIndex =
      nextIncomplete === -1 ? this.roadPoints.length : nextIncomplete;
  }

  private handleLevelTransition() {
    if (this.easyLevelCompleted) return;
    this.easyLevelCompleted = true;

    // 1. Play a victory sound
    AudioManager.getInstance().playSound("level-up", { volume: 0.7 });

    // 2. Calculate position for bottom right
    const { width, height } = this.scale;
    const btnX = width - 150;
    const btnY = height - 80;

    // 3. Create a custom Large Yellow Button
    // Note: Using your existing Button class if it exists,
    // or creating a quick graphics-based one here:
    const nextBtnContainer = this.add.container(btnX, btnY).setDepth(1000);

    const bg = this.add.graphics();
    bg.fillStyle(0xffcc00, 1); // Bright Yellow
    bg.lineStyle(4, 0xffffff, 1);
    bg.fillRoundedRect(-100, -35, 200, 70, 15);
    bg.strokeRoundedRect(-100, -35, 200, 70, 15);

    const txt = this.add
      .text(0, 0, "NEXT LEVEL ➔", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    nextBtnContainer.add([bg, txt]);

    // 4. Interaction
    bg.setInteractive(
      new Phaser.Geom.Rectangle(-100, -35, 200, 70),
      Phaser.Geom.Rectangle.Contains,
    );

    bg.on("pointerover", () => {
      bg.setAlpha(0.8);
      nextBtnContainer.setScale(1.05);
    });

    bg.on("pointerout", () => {
      bg.setAlpha(1);
      nextBtnContainer.setScale(1);
    });

    bg.on("pointerdown", () => {
      AudioManager.getInstance().playSound("click", { volume: 0.5 });

      if (this.savedProgress && this.savedProgress.gameState) {
        this.savedProgress.gameState.eventFlags.easyLevelCompleted = true;
        this.savedProgress.gameState.currentScene = "HomeScene";
      }

      this.emitLevelCompleted(this.savedProgress);
      this.scene.start("EasyToHomeTransitionScene", this.savedProgress);
    });

    // 5. Entrance Animation (Slide in from the right)
    nextBtnContainer.setX(width + 200);
    this.tweens.add({
      targets: nextBtnContainer,
      x: btnX,
      duration: 800,
      ease: "Back.easeOut",
    });

    // 6. Subtle Pulse to attract attention
    this.tweens.add({
      targets: nextBtnContainer,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private checkLevelCompleted(): boolean {
    let counts = 0;
    this.solvedRecords.forEach((record) => {
      if (!!record) {
        counts += 1;
      }
    });

    if (counts === this.roadPoints.length) {
      return true;
    }

    return false;
  }

  private async getAllSolvedRecord(): Promise<ProblemSolveRecord[]> {
    const problemIds = this.problemIds;
    const userId = this.savedProgress.userId;

    const solveRecords = await Promise.all(
      problemIds.map(async (id) => {
        const record = await checkExistingSolveRecord(userId, id);
        return record?.data;
      }),
    );

    return solveRecords.filter(
      (record): record is ProblemSolveRecord => record !== undefined,
    );
  }
}
