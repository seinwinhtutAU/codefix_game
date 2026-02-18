import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import Button from "../ui/Button";
import { fetchProblem } from "@/services/problem";
import { IGameProgress, ProblemSolveRecord } from "@/lib/types";
import { EventBus } from "../events";

interface LevelStats {
  points: number;
  time: number;
  solveCount: number; // Now mandatory for tracking
}

interface LevelData {
  sceneKey: string;
  label: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "BOSS";
  imageKey: string;
}

export default class LevelScene extends GameScene {
  private totalPointsText!: Phaser.GameObjects.Text;
  private totalTimeText!: Phaser.GameObjects.Text;
  private levelCards: Phaser.GameObjects.Container[] = [];

  private cardStatsTexts: Map<
    string,
    {
      pts: Phaser.GameObjects.Text;
      time: Phaser.GameObjects.Text;
      count: Phaser.GameObjects.Text;
    }
  > = new Map();

  private globalSpinner!: Phaser.GameObjects.Container;

  private stats: Record<string, LevelStats> = {
    easy: { points: 0, time: 0, solveCount: 0 },
    medium: { points: 0, time: 0, solveCount: 0 },
    hard: { points: 0, time: 0, solveCount: 0 },
    boss: { points: 0, time: 0, solveCount: 0 },
  };

  constructor() {
    super("LevelScene");
  }

  create() {
    super.create();
    const { width, height } = this.cameras.main;

    this.add.image(width / 2, height / 2, "level-bg").setTint(0xf8fafc);
    this.createTitle(width / 2, 50);

    this.createTotalSummary(width / 2, 110);
    this.renderLevelContent(width, height);
    this.createBackButton(width / 2, height - 50);

    this.createGlobalSpinner(width / 2, height / 2);

    this.initiateBackgroundLoading();
    this.cameras.main.fadeIn(300);
  }

  private createGlobalSpinner(x: number, y: number) {
    this.globalSpinner = this.add.container(x, y).setDepth(1000);
    const spinnerGfx = this.add.graphics();
    spinnerGfx.lineStyle(6, 0x4a90e2, 1);
    spinnerGfx.beginPath();
    spinnerGfx.arc(
      0,
      0,
      40,
      Phaser.Math.DegToRad(0),
      Phaser.Math.DegToRad(90),
      false,
    );
    spinnerGfx.strokePath();
    this.globalSpinner.add(spinnerGfx);

    this.tweens.add({
      targets: spinnerGfx,
      angle: 360,
      duration: 800,
      repeat: -1,
    });
  }

  private async initiateBackgroundLoading() {
    try {
      await this.loadAndAggregateStats();
      if (!this.scene.isActive(this.scene.key)) return;
      this.updateUIWithLoadedData();
    } catch (error) {
      console.error("Failed to load background stats:", error);
    }
  }

  private updateUIWithLoadedData() {
    if (this.globalSpinner) {
      this.tweens.add({
        targets: this.globalSpinner,
        alpha: 0,
        scale: 0.5,
        duration: 200,
        onComplete: () => this.globalSpinner.destroy(),
      });
    }

    this.updateSummaryUI();

    this.cardStatsTexts.forEach((texts, difficulty) => {
      const lowerDiff = difficulty.toLowerCase();
      const currentStat = this.stats[lowerDiff];
      if (currentStat) {
        texts.pts.setText(`${currentStat.points} pts`).setAlpha(1);
        texts.time.setText(this.formatTime(currentStat.time)).setAlpha(1);
        texts.count.setText(`${currentStat.solveCount} SOLVED`).setAlpha(1);
      }
    });

    this.levelCards.forEach((card) => {
      if (card && card.scene) {
        this.tweens.add({ targets: card, alpha: 1, duration: 400 });
        card.setInteractive();
      }
    });
  }

  private async loadAndAggregateStats() {
    // Reset stats to ensure fresh calculation
    this.stats = {
      easy: { points: 0, time: 0, solveCount: 0 },
      medium: { points: 0, time: 0, solveCount: 0 },
      hard: { points: 0, time: 0, solveCount: 0 },
      boss: { points: 0, time: 0, solveCount: 0 },
    };

    // Static points logic
    if (this.savedProgress?.gameState?.eventFlags?.easyQuizCompleted) {
      this.stats.easy.points += 500;
    }

    const rawRecords = await this.getAllSolvedRecord();
    if (!rawRecords.length) return;

    // Filter unique records (highest score per problem)
    const uniqueRecords = new Map<string, ProblemSolveRecord>();
    rawRecords.forEach((rec) => {
      const prev = uniqueRecords.get(rec.problemId);
      if (!prev || rec.pointsEarned > prev.pointsEarned) {
        uniqueRecords.set(rec.problemId, rec);
      }
    });

    // Aggregate by Difficulty
    await Promise.all(
      Array.from(uniqueRecords.values()).map(async (record) => {
        try {
          const data = await fetchProblem(record.problemId);
          const diff = data?.problem?.difficulty?.toLowerCase();
          if (diff && this.stats[diff]) {
            this.stats[diff].points += record.pointsEarned;
            this.stats[diff].time += record.timeSpent;
            this.stats[diff].solveCount += 1; // Increment per-level count
          }
        } catch (e) {
          console.warn(`Problem metadata missing: ${record.problemId}`);
        }
      }),
    );
  }

  private async getAllSolvedRecord(): Promise<ProblemSolveRecord[]> {
    const userId = this.savedProgress?.userId;
    if (!userId) return [];
    try {
      const res = await fetch(`/api/solve-record?userId=${userId}`);
      const result = await res.json();
      return Array.isArray(result.data)
        ? result.data
        : result.data
          ? [result.data]
          : [];
    } catch (e) {
      return [];
    }
  }

  private createTitle(x: number, y: number) {
    this.add
      .text(x, y, "GAME LOG", {
        fontFamily: "Gluten",
        fontSize: "42px",
        color: "#4a90e2",
      })
      .setOrigin(0.5)
      .setStroke("#FFF", 6);
  }

  private createTotalSummary(x: number, y: number) {
    const container = this.add.container(x, y);
    const bg = this.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-180, -22, 360, 44, 22)
      .lineStyle(1, 0xcbd5e1, 1)
      .strokeRoundedRect(-180, -22, 360, 44, 22);

    this.totalPointsText = this.add
      .text(-90, 8, "0", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#4A90E2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.totalTimeText = this.add
      .text(90, 8, "0m 0s", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#4A90E2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([
      bg,
      this.add
        .text(-90, -8, "TOTAL POINTS", {
          fontFamily: "Arial",
          fontSize: "9px",
          color: "#4A90E2",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.totalPointsText,
      this.add
        .text(90, -8, "TOTAL TIME", {
          fontFamily: "Arial",
          fontSize: "9px",
          color: "#4A90E2",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.totalTimeText,
      this.add.graphics().lineStyle(1, 0xe2e8f0).lineBetween(0, -15, 0, 15),
    ]);
  }

  private updateSummaryUI() {
    const totalPoints = Object.values(this.stats).reduce(
      (acc, s) => acc + s.points,
      0,
    );
    const totalTime = Object.values(this.stats).reduce(
      (acc, s) => acc + s.time,
      0,
    );
    this.totalPointsText.setText(totalPoints.toString());
    this.totalTimeText.setText(this.formatTime(totalTime));
  }

  private renderLevelContent(width: number, height: number) {
    const levels: LevelData[] = [
      {
        sceneKey: "CarDriveScene",
        label: "TRAFFIC STOP",
        difficulty: "EASY",
        imageKey: "level-police-red-light",
      },
      {
        sceneKey: "MediumLevelScene",
        label: "THE OFFICE",
        difficulty: "MEDIUM",
        imageKey: "level-office-home",
      },
      {
        sceneKey: "HardLevelScene",
        label: "THE PARK",
        difficulty: "HARD",
        imageKey: "level-park",
      },
      {
        sceneKey: "BossLevelScene",
        label: "SYSTEM CORE",
        difficulty: "BOSS",
        imageKey: "level-core",
      },
    ];

    const coords = [
      { x: width / 2 - 200, y: height / 2 - 110 },
      { x: width / 2 + 200, y: height / 2 - 110 },
      { x: width / 2 - 200, y: height / 2 + 170 },
      { x: width / 2 + 200, y: height / 2 + 170 },
    ];

    levels.forEach((lvl, i) =>
      this.createLevelCard(coords[i].x, coords[i].y, lvl),
    );
  }

  private createLevelCard(x: number, y: number, level: LevelData) {
    const cardContainer = this.add.container(x, y).setAlpha(0.3);
    const cardW = 240,
      cardH = 180;

    const cardBg = this.add
      .graphics()
      .fillStyle(0xffffff)
      .fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16)
      .lineStyle(2, 0x4a90e2)
      .strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);

    cardContainer.add([
      cardBg,
      this.add.image(0, -35, level.imageKey),
      this.add
        .text(0, 45, level.label, {
          fontFamily: "Arial",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#334155",
        })
        .setOrigin(0.5),
    ]);

    this.addStatsPill(cardContainer, level.difficulty);
    cardContainer.setSize(cardW, cardH);

    cardContainer
      .on("pointerdown", () =>
        this.handleLevelSelect(level.sceneKey, level.difficulty),
      )
      .on("pointerover", () =>
        this.tweens.add({ targets: cardContainer, scale: 1.05, duration: 200 }),
      )
      .on("pointerout", () =>
        this.tweens.add({ targets: cardContainer, scale: 1, duration: 200 }),
      );

    this.levelCards.push(cardContainer);
  }

  private addStatsPill(
    container: Phaser.GameObjects.Container,
    difficulty: string,
  ) {
    const pill = this.add.container(0, 115);
    const bg = this.add
      .graphics()
      .fillStyle(0xf1f5f9)
      .fillRoundedRect(-100, -15, 200, 45, 8);

    const ptsText = this.add
      .text(-50, 5, "---", {
        fontSize: "12px",
        color: "#64748b",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);
    const timeText = this.add
      .text(50, 5, "---", {
        fontSize: "12px",
        color: "#64748b",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);
    const countText = this.add
      .text(0, -35, "0 SOLVED", {
        fontSize: "11px",
        color: "#4CAF50",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.cardStatsTexts.set(difficulty, {
      pts: ptsText,
      time: timeText,
      count: countText,
    });
    pill.add([
      bg,
      ptsText,
      timeText,
      countText,
      this.add.graphics().lineStyle(1, 0xe2e8f0).lineBetween(0, -5, 0, 15),
    ]);
    container.add(pill);
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }

  private createBackButton(x: number, y: number) {
    new Button(this, {
      x,
      y,
      width: 160,
      height: 40,
      text: "BACK",
      color: 0x4a90e2,
      onClick: () => {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once("camerafadeoutcomplete", () =>
          this.scene.start("MainMenuScene"),
        );
      },
    });
  }

  private handleLevelSelect(sceneKey: string, difficulty: string) {
    let eventFlags = {};
    switch (sceneKey) {
      case "CarDriveScene":
        eventFlags = { introCompleted: true, policeStoppedPlayer: true };
        break;
      case "MediumLevelScene":
        eventFlags = {
          introCompleted: true,
          policeStoppedPlayer: true,
          arrivedAtOffice: true,
          officeCompleted: true,
        };
        break;
      case "HardLevelScene":
        eventFlags = {
          introCompleted: true,
          policeStoppedPlayer: true,
          arrivedAtOffice: true,
          officeCompleted: true,
          mediumLevelCompleted: true,
          hardIntroCompleted: true,
          playgroundCompleted: true,
        };
        break;
      case "BossLevelScene":
        eventFlags = {
          introCompleted: true,
          policeStoppedPlayer: true,
          arrivedAtOffice: true,
          officeCompleted: true,
          mediumLevelCompleted: true,
          hardIntroCompleted: true,
          playgroundCompleted: true,
          hardLevelCompleted: true,
          warningCompleted: true,
        };
        break;
    }

    // Use the per-difficulty solve count to determine which problem index to load
    const specificSolveCount =
      this.stats[difficulty.toLowerCase()]?.solveCount || 0;

    const updatedProgress: IGameProgress = {
      ...this.savedProgress,
      gameState: {
        ...this.savedProgress?.gameState,
        currentScene: sceneKey,
        eventFlags: eventFlags,
        currentTask: {
          taskType: "none",
          status: "none",
          attempts: 0,
          timer: 0,
          currentActiveIndex: specificSolveCount,
        },
      },
    };

    AudioManager.getInstance().playSound("click");
    this.savedProgress = updatedProgress;
    EventBus.emit("progress-updated", this.savedProgress);

    this.cameras.main.fadeOut(500);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start(sceneKey, this.savedProgress),
    );
  }
}
