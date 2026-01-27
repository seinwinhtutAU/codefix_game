import { checkExistingSolveRecord } from "@/services";
import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import { IGameProgress, ProblemSolveRecord } from "@/lib/types";
import { GameObjects } from "phaser";
import Button from "../ui/Button";
import { EventBus } from "../events";

export interface BugCount {
  problemId: string;
  bugCount: number;
}

export default class BossLevelScene extends GameScene {
  private problemIds: string[] = [
    "697401975f4942a9208dc6a6",
    "697401ad5f4942a9208dc6bc",
    "697401dc5f4942a9208dc707",
    "697401975f4942a9208dc6a6",
    "697401975f4942a9208dc6a6",
  ];

  private selectionButtons: Button[] = [];
  private selectionContainer!: Phaser.GameObjects.Container;

  private pointsPos = [
    { x: 490, y: 100 },
    { x: 590, y: 100 },
    { x: 690, y: 100 },
    { x: 790, y: 100 },
    { x: 890, y: 100 },
  ];

  private solvedRecords: ProblemSolveRecord[] = [];
  private points: GameObjects.Shape[] = [];
  private bossLevelCompleted: boolean = false;
  private currentPointIndex: number = 0;
  private bugCounts: BugCount[] = [];

  private maxAttempt: number = 5;
  private currentBugCount: number = 0;
  private notificationText!: Phaser.GameObjects.Text;
  private infoPanelContainer!: Phaser.GameObjects.Container;
  private minBugs: number = 10;
  private maxBugs: number = 20;
  private basePoints: number = 100;
  private baseTimer: number = 60;
  private timerIncrementPerBug: number = 120;
  private pointIncrementPerBug: number = 10;
  private progressGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super("BossLevelScene");
  }

  async create() {
    // if (this.savedProgress?.gameState?.eventFlags?.bossLevelCompleted) {
    //   this.scene.start("MainMenuScene", this.savedProgress);
    //   return;
    // }

    super.create();

    this.initAudio();
    this.add.image(0, 0, "boss-bg").setOrigin(0, 0);
    this.createNotificationText();
    this.drawPoints();
    this.solvedRecords = await this.getAllSolvedRecord();
    this.updateCurrentPointIndex(this.savedProgress);
    this.getAllBugCounts();

    if (this.currentBugCount === 0) {
      this.createBugCountInput();
    } else {
      this.showChallengeInfo(this.currentBugCount, this.currentPointIndex);
    }

    console.log("BossLevelScene bug counts: ", this.bugCounts);
    console.log("BossLevelScene Current Point Index: ", this.currentPointIndex);
    console.log("BossLevelScene currentBugCount: ", this.currentBugCount);
    this.updatePointsUI();
    this.setUpListeners();
    if (this.checkLevelCompleted()) {
      this.handleLevelTransition();
    }
  }

  // --- Mock functions to be implemented later ---
  private getProblemId(): string[] {
    return this.problemIds;
  }

  private createBugCountInput() {
    this.createSelectionMenu();
    this.createNotificationText();
  }

  private createSelectionMenu() {
    const xCenter = 1376 / 2;
    const yCenter = 768 / 2 + 50; // Shifted down to avoid overlapping the nodes

    const options = [
      { bugs: 15, bonus: 0, color: 0x7df9ff, label: "STABLE_CORE" }, // Mint Blue
      { bugs: 20, bonus: 20, color: 0xffff00, label: "CRITICAL_GLITCH" }, // Electric Yellow
      { bugs: 25, bonus: 30, color: 0xff71ce, label: "SYSTEM_BREACH" }, // Neon Pink
    ];

    this.selectionContainer = this.add.container(0, 0).setDepth(150);

    // 1. Terminal Box for the Selection
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f2e, 0.9); // Deep Purple
    bg.lineStyle(3, 0x7df9ff, 1); // Mint border
    bg.fillRoundedRect(xCenter - 300, yCenter - 150, 600, 300, 20);
    bg.strokeRoundedRect(xCenter - 300, yCenter - 150, 600, 300, 20);
    this.selectionContainer.add(bg);

    // 2. Header Text
    const header = this.add
      .text(xCenter, yCenter - 110, "> CHOOSE_CHALLENGE", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#7df9ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.selectionContainer.add(header);

    // Pick higher bugs for more points.
    const recommendation = this.add
      .text(
        xCenter,
        yCenter - 70,
        "> Recommend to pick higher bugs for more points",
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#ff71ce",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);
    this.selectionContainer.add(recommendation);

    options.forEach((opt, index) => {
      const xPos = xCenter + (index - 1) * 180;

      // 3. Selection Button
      const btn = new Button(this, {
        x: xPos,
        y: yCenter + 20,
        width: 150,
        height: 50,
        text: `${opt.bugs} BUGS`,
        color: opt.color,
        textStyle: {
          color: "#000000", // Set to black for high contrast on bright buttons
        },
        onClick: () => this.confirmBugCount(opt.bugs),
      });

      // 4. Difficulty Label (Top of button)
      const diffLabel = this.add
        .text(xPos, yCenter - 25, opt.label, {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // 5. Bonus Text (Bottom of button)
      const bonusText = opt.bonus > 0 ? `+${opt.bonus} POINTS` : "BASE POINTS";
      const desc = this.add
        .text(xPos, yCenter + 65, bonusText, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: opt.bonus > 0 ? "#ffff00" : "#7df9ff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.selectionButtons.push(btn);
      this.selectionContainer.add([btn, diffLabel, desc]);
    });
  }

  private handleProgressResume = async (progress: IGameProgress) => {
    this.savedProgress = progress;
    this.solvedRecords = await this.getAllSolvedRecord();
    this.updateCurrentPointIndex(progress);
    this.getAllBugCounts();
    this.updatePointsUI();
    this.createBugCountInput();

    if (this.infoPanelContainer) this.infoPanelContainer.destroy();

    console.log("solvedRecords in handleProgressResume: ", this.solvedRecords);
    this.currentBugCount = 0;
    if (this.selectionContainer) {
      this.selectionContainer.setVisible(true);
    } else {
      this.createBugCountInput();
    }
    this.infoPanelContainer.destroy();
    this.emitTaskStarted(progress);
    if (this.checkLevelCompleted()) {
      this.handleLevelTransition();
    }
  };

  private updateCurrentPointIndex(progress: IGameProgress) {
    this.currentPointIndex =
      progress.gameState.currentTask.currentActiveIndex || 0;
  }

  private setUpListeners() {
    EventBus.on("resume-after-solve", async (progress: IGameProgress) => {
      this.handleProgressResume(progress);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off("resume-after-solve", this.handleProgressResume);
    });
  }

  private createNotificationText() {
    // Futuristic terminal prompt style
    this.notificationText = this.add
      .text(688, 150, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#00ff00", // Classic Terminal Green
        backgroundColor: "#001100aa",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(100);
  }

  private confirmBugCount(bugCount: number): void {
    this.currentBugCount = bugCount;
    this.updateBugCount(bugCount);
    this.emitBugCountSubmitted(this.savedProgress);

    this.notificationText.setVisible(false);
    if (this.selectionContainer) {
      this.selectionContainer.setVisible(false);
    }

    this.showChallengeInfo(bugCount, this.currentPointIndex);
  }

  private updateBugCount(updateBugCount: number) {
    const problemId = this.problemIds[this.currentPointIndex];
    const existing = this.bugCounts.find(
      (item) => item.problemId === problemId,
    );

    if (existing) {
      this.bugCounts = this.bugCounts.map((item) =>
        item.problemId === problemId
          ? { ...item, bugCount: updateBugCount }
          : item,
      );
    } else {
      this.bugCounts.push({
        problemId: problemId,
        bugCount: updateBugCount,
      });
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Using padStart ensures we see "5:05" instead of "5:5"
    const minutesString = minutes.toString().padStart(2, "0");
    const secondsString = remainingSeconds.toString().padStart(2, "0");

    return `${minutesString}:${secondsString}`;
  }

  private showChallengeInfo(bugCount: number, index: number) {
    const estPoints =
      (bugCount - this.minBugs) * this.pointIncrementPerBug + this.basePoints;
    const timeLimit =
      (bugCount - this.minBugs) * this.timerIncrementPerBug + this.baseTimer;
    const timeLimitFormatted = this.formatTime(timeLimit);
    const solveTimeFormatted = this.formatTime(
      this.solvedRecords[index]?.timeSpent || 0,
    );

    this.infoPanelContainer = this.add.container(688, 450).setDepth(200);

    const status = this.getPointState(index);
    let lineColor = 0x7df9ff;
    let lineColorString = "#7df9ff";

    switch (status) {
      case "solved":
        lineColor = 0x28a745;
        lineColorString = "#28a745";
        break;
      case "skipped":
        lineColor = 0xff4d4d;
        lineColorString = "#ff4d4d";
        break;
      default:
        lineColor = 0x7df9ff;
        lineColorString = "#7df9ff";
        break;
    }

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f2e, 0.95);
    bg.lineStyle(4, lineColor, 1);

    // Reduced size: from 520x620 down to 440x520
    const pW = 440;
    const pH = 520;
    bg.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, 30);
    bg.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, 30);

    // Adjusted Ears (slightly smaller and positioned on the new width)
    bg.fillStyle(lineColor, 1);
    bg.fillCircle(-pW / 2 + 60, -pH / 2, 12);
    bg.fillCircle(pW / 2 - 60, -pH / 2, 12);

    // Scanlines adjusted for smaller height
    for (let i = -pH / 2 + 10; i < pH / 2 - 10; i += 6) {
      bg.lineStyle(2, 0xff71ce, 0.1);
      bg.lineBetween(-pW / 2 + 20, i, pW / 2 - 20, i);
    }

    const title = this.add
      .text(0, -pH / 2 + 50, "(=^･ω･^=) MISSION", {
        fontFamily: "monospace",
        fontSize: "18px", // Slightly smaller font
        color: lineColorString,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const content =
      `--------------------------\n` + // Shortened lines
      ` > NODE_ID: CHIP_0${index + 1}\n` +
      ` > BUGS_FOUND: ${bugCount}\n` +
      ` > POINTS: ${estPoints} XP\n` +
      ` > TIMER: ${timeLimitFormatted}(m:s)\n` +
      `--------------------------\n` +
      ` ATTEMPTS: ${this.solvedRecords[index]?.attempt || 0} ATTEMPTS\n` +
      ` STATUS: ${this.getPointState(index).toUpperCase()}\n` +
      ` EARNED_POINTS: ${this.solvedRecords[index]?.pointsEarned || 0}\n` +
      ` SOLVE_TIME: ${solveTimeFormatted}(m:s)\n` +
      `--------------------------\n` +
      ` READY TO DE-BUG?`;

    const details = this.add
      .text(0, -10, content, {
        // Shifted up slightly
        fontFamily: "monospace",
        fontSize: "15px", // Smaller font for smaller container
        color: "#fff",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    const goNextProblem =
      index === this.currentPointIndex &&
      (this.getPointState(index) === "solved" ||
        this.getPointState(index) === "skipped");

    const seeInfo =
      index < this.currentPointIndex &&
      (this.getPointState(index) === "solved" ||
        this.getPointState(index) === "skipped");

    const startBtn = new Button(this, {
      x: 0,
      y: pH / 2 - 70,
      width: 180,
      text: `${goNextProblem ? "NEXT_MISSION()" : "START_DEBUG()"}`,
      color: 0xff71ce,
      onClick: () => this.openProblemOverlay(bugCount, timeLimit),
    });

    if (seeInfo) {
      startBtn.setVisible(false);
    }

    this.infoPanelContainer.add([bg, title, details, startBtn]);

    this.infoPanelContainer.setScale(0);
    this.tweens.add({
      targets: this.infoPanelContainer,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });
  }

  private openProblemOverlay(bugs: number, time: number) {
    console.log(`Battle Started! Bugs: ${bugs}, Time: ${time}s`);
    EventBus.emit("ui-open-problem", {
      problemId: this.problemIds[this.currentPointIndex],
      difficulty: "boss",
    });
  }

  private showMessage(message: string) {
    // Stop any existing timer events to prevent overlapping text
    this.time.removeAllEvents();

    this.notificationText
      .setVisible(true)
      .setText("( >_<) ERROR: ") // Initial prefix
      .setColor("#ff71ce")
      .setBackgroundColor("#1a0f2eaa");

    let i = 0;
    const fullMsg = message.toUpperCase();

    // Typing effect
    this.time.addEvent({
      delay: 40,
      callback: () => {
        if (fullMsg[i]) {
          this.notificationText.text += fullMsg[i];
          i++;
        }
      },
      repeat: fullMsg.length - 1,
    });

    // Pop animation
    this.tweens.add({
      targets: this.notificationText,
      y: this.notificationText.y + 10,
      duration: 100,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    // Auto-hide after 5 seconds
    this.time.delayedCall(5000, () => {
      if (this.notificationText) this.notificationText.setVisible(false);
    });
  }

  private drawPoints() {
    const lines = this.add.graphics();
    lines.lineStyle(3, 0xff71ce, 0.3);
    lines.setDepth(0); // Ensure background lines are at the very bottom

    for (let i = 0; i < this.pointsPos.length - 1; i++) {
      lines.lineBetween(
        this.pointsPos[i].x,
        this.pointsPos[i].y,
        this.pointsPos[i + 1].x,
        this.pointsPos[i + 1].y,
      );
    }

    this.pointsPos.forEach((pos, index) => {
      // SET DEPTH HERE ON THE CONTAINER
      const container = this.add.container(pos.x, pos.y).setDepth(10);

      const base = this.add.rectangle(0, 0, 36, 36, 0x1a0f2e);
      base.setStrokeStyle(3, 0x7df9ff, 1);

      const core = this.add.rectangle(0, 0, 18, 18, 0x7df9ff);

      const label = this.add
        .text(0, 30, `v0.${index + 1}`, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#7df9ff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      container.add([base, core, label]);
      core.setInteractive({ useHandCursor: true });
      core.on("pointerdown", () => {
        AudioManager.getInstance().playSound("click", { volume: 0.5 });
        this.handlePointClick(index);
      });
      this.points.push(core);
    });
  }

  private drawRoadProgress() {
    // 1. Initialize or clear the graphics object
    if (!this.progressGraphics) {
      this.progressGraphics = this.add.graphics();
      this.progressGraphics.setDepth(5); // Above map, below points
    }
    this.progressGraphics.clear();

    // 2. We only draw if we have at least one solved point
    if (this.currentPointIndex === 0) return;

    // 3. Set the style for the "Glow"
    // Outer glow (thicker, lower alpha)
    this.progressGraphics.lineStyle(15, 0x00d2ff, 0.3);
    this.drawPathSegments();

    // Inner core (thinner, higher alpha)
    this.progressGraphics.lineStyle(7, 0x7df9ff, 0.9);
    this.drawPathSegments();
  }

  private drawPathSegments() {
    this.progressGraphics.beginPath();

    this.progressGraphics.moveTo(this.pointsPos[0].x, this.pointsPos[0].y);

    for (let i = 1; i <= this.currentPointIndex; i++) {
      if (i < this.pointsPos.length) {
        this.progressGraphics.lineTo(this.pointsPos[i].x, this.pointsPos[i].y);
      }
    }

    this.progressGraphics.strokePath();
  }

  private handlePointClick(index: number) {
    const state = this.getPointState(index);
    if (state === "locked") {
      this.showMessage("This module is currently locked!");
      return;
    }

    if (this.infoPanelContainer) {
      this.infoPanelContainer.destroy();
    }

    if (this.selectionContainer) {
      this.selectionContainer.setVisible(false);
    }

    const bugCount = this.bugCounts[index]?.bugCount;

    if (this.currentBugCount === 0 && state == "current") {
      if (this.selectionContainer) this.selectionContainer.setVisible(true);
      this.showMessage("Select bug numbers for this challenge!");
      return;
    }

    this.showChallengeInfo(bugCount, index);
  }

  private updatePointsUI() {
    if (!this.solvedRecords) return;

    this.points.forEach((core, index) => {
      const state = this.getPointState(index);

      // Reset any existing animations
      this.tweens.killTweensOf(core);
      core.setScale(1);

      switch (state) {
        case "solved":
          core.setFillStyle(0x28a745); // Emerald Green
          // Add a static glow or subtle scale up
          core.setScale(1.1);
          break;

        case "current":
          core.setFillStyle(0xffff00); // Electric Yellow
          // Pulse Animation
          this.tweens.add({
            targets: core,
            scale: 1.4,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
          break;

        case "locked":
          core.setFillStyle(0x444444); // Dark Gray
          core.setAlpha(0.5);
          break;

        case "skipped":
          core.setFillStyle(0xd9534f); // Danger Red
          break;
      }
    });

    this.drawRoadProgress();
  }

  private getPointState(index: number) {
    if (index < 0 || index >= this.pointsPos.length) return "locked";

    const isSolved = !!this.solvedRecords[index];
    const attempts = this.solvedRecords[index]?.attempt || 0;
    console.log(
      `Getting state for point ${index}: isSolved=${isSolved}, attempts=${attempts}`,
    );
    if (attempts >= this.maxAttempt) return "skipped";
    if (isSolved) return "solved";
    if (index === this.currentPointIndex) return "current";
    if (index > this.currentPointIndex) return "locked";
    return "locked";
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
    });
  }

  private emitBugCountSubmitted(progress: IGameProgress) {
    EventBus.emit("progress-updated", {
      ...progress,
      bugCounts: this.bugCounts,
    });
  }

  private emitLevelCompleted(progress: IGameProgress) {
    EventBus.emit("progress-updated", {
      ...progress,
      gameState: {
        currentScene: "HomeScene",
        eventFlags: {
          ...progress.gameState.eventFlags,
          bossLevelCompleted: true,
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
    });
  }

  private handleLevelTransition() {
    if (this.bossLevelCompleted) return;
    this.bossLevelCompleted = true;

    EventBus.emit("show-notification", {
      type: "VICTORY",
      title: "Victory!",
      message:
        "You’ve completed every level and mastered the challenge. Well done!",
      confirmLabel: "BACK TO MENU",
      onConfirm: () => {
        EventBus.emit("hide-notification");

        if (this.savedProgress && this.savedProgress.gameState) {
          this.savedProgress.gameState.eventFlags.bossLevelCompleted = true;
          this.savedProgress.gameState.currentScene = "BossLevelScene";
        }

        this.emitLevelCompleted(this.savedProgress);
        this.scene.start("MainMenuScene", this.savedProgress);
      },
    });
  }

  private checkLevelCompleted(): boolean {
    let countOfSolved = 0;
    this.solvedRecords.forEach((record) => {
      const isSolved = !!record;
      if (isSolved) countOfSolved++;
    });

    if (countOfSolved === this.solvedRecords.length) {
      return true;
    }

    return false;
  }

  private async getAllSolvedRecord(): Promise<ProblemSolveRecord[]> {
    const problemIds = this.getProblemId();
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

  private getAllBugCounts() {
    const savedBugCounts = this.savedProgress.bugCounts || [];
    this.bugCounts = this.problemIds.map((problemId) => {
      const savedCount = savedBugCounts.find(
        (bc) => bc.problemId === problemId,
      );
      return {
        problemId,
        bugCount: savedCount ? savedCount.bugCount : 0,
      };
    });

    this.currentBugCount =
      this.bugCounts[this.currentPointIndex]?.bugCount || 0;
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }
}
