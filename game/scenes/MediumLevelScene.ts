import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import { checkExistingSolveRecord } from "@/services/problem";
import { EventBus } from "@/game/events";
import { IGameProgress } from "@/lib/types";

export interface SolvedPointStatus {
  attempts: number;
  isSolved: boolean;
}

interface PathPoint {
  x: number;
  y: number;
  path?: { x: number; y: number }[];
}

export default class MediumLevelScene extends GameScene {
  private problemIds: string[] = [
    "697401975f4942a9208dc6a6",
    "697401ad5f4942a9208dc6bc",
    "697401dc5f4942a9208dc707",
    // "69582fb37538b18589a46564",
    // "69582fb37538b18589a46564",
    // "69582fb37538b18589a46564",
    // "69582fb37538b18589a46564",
    // "695c13b389e02a7e13dbe5ca",
    // "695c13b389e02a7e13dbe5ca",
    // "695c13b389e02a7e13dbe5ca",
  ];

  private roadPoints = [
    { x: 154, y: 353 },
    { x: 415, y: 172 },
    { x: 650, y: 172 },
    // { x: 865, y: 172 },
    // { x: 1032, y: 334 },
    // { x: 835, y: 334 },
    // { x: 482, y: 385 },
    // { x: 482, y: 570 },
    // { x: 700, y: 625 },
    // { x: 980, y: 625 },
  ];

  private pathPoints: PathPoint[] = [
    { x: 154, y: 353 },
    {
      x: 415,
      y: 172,
      path: [
        { x: 295, y: 354 },
        { x: 300, y: 172 },
      ],
    },
    { x: 650, y: 172 },
    {
      x: 865,
      y: 172,
    },
    {
      x: 1032,
      y: 334,
      path: [{ x: 1032, y: 172 }],
    },
    {
      x: 835,
      y: 334,
    },
    { x: 482, y: 385, path: [{ x: 480, y: 334 }] },
    {
      x: 482,
      y: 570,
    },
    { x: 700, y: 625, path: [{ x: 484, y: 627 }] },
    {
      x: 980,
      y: 625,
    },
    {
      x: 1376,
      y: 481,
      path: [
        { x: 1121, y: 621 },
        { x: 1121, y: 482 },
      ],
    },
  ];

  private currentPointIndex = 0;
  private mapPoints: Phaser.GameObjects.Image[] = [];
  private solvedPoints: SolvedPointStatus[] = [];
  private maxAttempt = 5;
  private mediumLevelCompleted = false;
  private startHereSign!: Phaser.GameObjects.Image;
  private startHereTween?: Phaser.Tweens.Tween;
  private roadProgressGraphics!: Phaser.GameObjects.Graphics;
  private tooltipContainer!: Phaser.GameObjects.Container;
  private tooltipText!: Phaser.GameObjects.Text;

  constructor() {
    super("MediumLevelScene");
  }

  async create() {
    if (this.savedProgress?.gameState?.eventFlags?.mediumLevelCompleted) {
      this.scene.start("BossLevelScene", this.savedProgress);
      return;
    }
    super.create();

    this.initAudio();
    this.createParticle();
    this.initSolvedPoints();
    this.drawMapAndPoints();
    this.drawStartHere();
    this.addTooltip();
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

  private addTooltip() {
    // Create the background box
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(0, 0, 180, 100, 10);
    bg.strokeRoundedRect(0, 0, 180, 100, 10);

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

  private createParticle() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("glow-dot", 16, 16);
    graphics.destroy();
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

  private drawCustomPath(
    graphics: Phaser.GameObjects.Graphics,
    points: PathPoint[],
  ) {
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const curr = points[i];

      // If the user provided manual turn points, follow them
      if (curr.path && curr.path.length > 0) {
        curr.path.forEach((turn) => {
          graphics.lineTo(turn.x, turn.y);
        });
      }

      // Always end at the actual target coordinate
      graphics.lineTo(curr.x, curr.y);
    }
    graphics.strokePath();
  }

  private drawRoadProgress() {
    if (!this.roadProgressGraphics) {
      this.roadProgressGraphics = this.add.graphics();
      this.roadProgressGraphics.setDepth(1); // Above map, below points
    }
    this.roadProgressGraphics.clear();

    if (this.currentPointIndex === 0) return;

    const activePoints = this.pathPoints.slice(0, this.currentPointIndex + 1);

    this.roadProgressGraphics.lineStyle(15, 0xffcc00, 0.3);
    this.drawCustomPath(this.roadProgressGraphics, activePoints);

    // Inner core (thinner, higher alpha)
    this.roadProgressGraphics.lineStyle(7, 0xffff00, 0.8);
    this.drawCustomPath(this.roadProgressGraphics, activePoints);
  }

  private handleProgressResume = async (progress: IGameProgress) => {
    const { currentTask } = progress.gameState;

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

    if (!this.mediumLevelCompleted && this.checkLevelCompleted()) {
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

    this.add.image(0, 0, "medium-map").setOrigin(0, 0);

    this.roadPoints.forEach((value, index) => {
      const point = this.add
        .image(value.x, value.y, "easy-point-lock")
        .setDisplaySize(100, 100)
        .setDepth(2);

      point.on("pointerdown", () => {
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
        const solvedData = this.solvedPoints[index];

        // Prepare information strings
        const statusText = state.toUpperCase();
        const pointsEarned = solvedData ? "100" : "0"; // Example logic
        const totalTime = "02:45"; // You would pull this from your solved record data

        this.tooltipText.setText(
          `Challenge: #${index + 1}\n` +
            `STATE: ${statusText}\n` +
            `EARNED: ${pointsEarned}\n` +
            `TIME: ${totalTime}`,
        );

        // Position above the point
        this.tooltipContainer.setPosition(value.x - 90, value.y - 120);
        this.tooltipContainer.setVisible(true);

        // Simple hover effect on the point itself
        this.tweens.add({ targets: point, scale: 1.1, duration: 100 });
      });

      point.on("pointerout", () => {
        this.tooltipContainer.setVisible(false);
        this.tweens.add({ targets: point, scale: 1.0, duration: 100 });
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
      point.disableInteractive();

      switch (state) {
        case "solved":
          point.setTexture(`easy-point-${index + 1}`);
          this.animateSolvedPoint(point);
          break;
        case "skipped":
          point.setTexture(`easy-point-skip`);
          break;
        case "current":
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
        currentScene: "BossLevelScene",
        eventFlags: {
          ...progress.gameState.eventFlags,
          mediumLevelCompleted: true,
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
    if (this.mediumLevelCompleted) return;
    this.mediumLevelCompleted = true;

    EventBus.emit("show-notification", {
      type: "LEVEL_UP",
      title: "Level Up!",
      message: "New challenges unlocked.",
      confirmLabel: "NEXT",
      onConfirm: () => {
        EventBus.emit("hide-notification");
        // Use the helper to ensure progress is saved before switching
        this.emitLevelCompleted(this.savedProgress);
        this.scene.start("MediumTransitionScene", this.savedProgress);
      },
    });
  }

  private checkLevelCompleted(): boolean {
    let countOfSolved = 0;
    this.solvedPoints.forEach((status) => {
      if (status.isSolved) countOfSolved++;
    });

    if (countOfSolved === this.solvedPoints.length) {
      return true;
    }

    return false;
  }
}
