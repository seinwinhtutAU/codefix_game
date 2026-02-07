import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import Button from "../ui/Button";
import { fetchProblem } from "@/services/problem";
import { ProblemSolveRecord } from "@/lib/types";

interface LevelStats {
  points: number;
  time: number;
}

interface LevelData {
  id: string;
  label: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "BOSS";
  imageKey: string;
  unlocked: boolean;
  completed: boolean;
  points: number;
  time: number;
}

export default class LevelScene extends GameScene {
  // UI References
  private totalPointsText!: Phaser.GameObjects.Text;
  private totalTimeText!: Phaser.GameObjects.Text;
  private levelCards: Phaser.GameObjects.Container[] = [];

  // Data State
  private stats: Record<string, LevelStats> = {
    easy: { points: 0, time: 0 },
    medium: { points: 0, time: 0 },
    hard: { points: 0, time: 0 },
    boss: { points: 0, time: 0 },
  };

  constructor() {
    super("LevelScene");
  }

  async create() {
    super.create();
    const { width, height } = this.cameras.main;

    // 1. Static Visuals
    this.add.image(width / 2, height / 2, "level-bg").setTint(0xf8fafc);
    this.createTitle(width / 2, 50);

    // 2. Initial UI Shell (Shows 0 initially)
    this.createTotalSummary(width / 2, 110);

    // 3. Fetch Data & Refresh
    await this.loadAndAggregateStats();
    this.renderLevelContent(width, height);
    this.updateSummaryUI();

    // 4. Navigation
    this.createBackButton(width / 2, height - 50);
  }

  /**
   * DATA LOGIC
   */

  private async loadAndAggregateStats() {
    // Add static bonus for easy completion
    if (this.savedProgress?.gameState?.eventFlags?.easyQuizCompleted) {
      this.stats.easy.points += 500;
    }

    const rawRecords = await this.getAllSolvedRecord();
    console.log("rawRecords: ", JSON.stringify(rawRecords, null, 2));
    if (!rawRecords.length) return;

    // Group by problemId to get highest score per problem
    const uniqueRecords = new Map<string, ProblemSolveRecord>();
    rawRecords.forEach((rec) => {
      const prev = uniqueRecords.get(rec.problemId);
      if (!prev || rec.pointsEarned > prev.pointsEarned) {
        uniqueRecords.set(rec.problemId, rec);
      }
    });

    // Fetch problem metadata to determine difficulty category
    await Promise.all(
      Array.from(uniqueRecords.values()).map(async (record) => {
        try {
          const data = await fetchProblem(record.problemId);
          const diff = data?.problem?.difficulty?.toLowerCase();
          if (diff && this.stats[diff]) {
            this.stats[diff].points += record.pointsEarned;
            this.stats[diff].time += record.timeSpent;
          }
        } catch (e) {
          console.warn(`Metadata missing for problem: ${record.problemId}`);
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
      // Ensure we always return an array
      if (Array.isArray(result.data)) return result.data;
      if (result.data) return [result.data];
      return [];
    } catch (e) {
      console.error("Fetch failed", e);
      return [];
    }
  }

  /**
   * UI RENDERING
   */

  private createTitle(x: number, y: number) {
    this.add
      .text(x, y, "GAME LOG", {
        fontFamily: "Gluten",
        fontSize: "42px",
        color: "#4a90e2",
      })
      .setOrigin(0.5)
      .setStroke("#FFF", 6)
      .setShadow(2, 2, "rgba(0,0,0,0.1)", 2);
  }

  private createTotalSummary(x: number, y: number) {
    const container = this.add.container(x, y);
    const bg = this.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-180, -22, 360, 44, 22);
    bg.lineStyle(1, 0xcbd5e1, 1).strokeRoundedRect(-180, -22, 360, 44, 22);

    const style = {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#4A90E2",
      fontStyle: "bold",
    };
    const labelStyle = { ...style, fontSize: "9px" };

    this.totalPointsText = this.add.text(-90, 8, "0", style).setOrigin(0.5);
    this.totalTimeText = this.add.text(90, 8, "0m 0s", style).setOrigin(0.5);

    container.add([
      bg,
      this.add.text(-90, -8, "TOTAL POINTS", labelStyle).setOrigin(0.5),
      this.totalPointsText,
      this.add.text(90, -8, "TOTAL TIME", labelStyle).setOrigin(0.5),
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
    const flags = this.savedProgress?.gameState?.eventFlags;
    const levels: LevelData[] = [
      {
        id: "Easy",
        label: "TRAFFIC STOP",
        difficulty: "EASY",
        imageKey: "level-police-red-light",
        unlocked: true,
        completed: !!flags?.easyQuizCompleted,
        points: this.stats.easy.points,
        time: this.stats.easy.time,
      },
      {
        id: "Medium",
        label: "THE OFFICE",
        difficulty: "MEDIUM",
        imageKey: "level-office-home",
        unlocked: !!flags?.easyQuizCompleted,
        completed: !!flags?.mediumLevelCompleted,
        points: this.stats.medium.points,
        time: this.stats.medium.time,
      },
      {
        id: "Hard",
        label: "THE PARK",
        difficulty: "HARD",
        imageKey: "level-park",
        unlocked: !!flags?.mediumLevelCompleted,
        completed: !!flags?.hardLevelCompleted,
        points: this.stats.hard.points,
        time: this.stats.hard.time,
      },
      {
        id: "Boss",
        label: "SYSTEM CORE",
        difficulty: "BOSS",
        imageKey: "level-core",
        unlocked: !!flags?.hardLevelCompleted,
        completed: !!flags?.bossLevelCompleted,
        points: this.stats.boss.points,
        time: this.stats.boss.time,
      },
    ];

    const coords = [
      { x: width / 2 - 200, y: height / 2 - 110 },
      { x: width / 2 + 200, y: height / 2 - 110 },
      { x: width / 2 - 200, y: height / 2 + 170 },
      { x: width / 2 + 200, y: height / 2 + 170 },
    ];

    this.drawPath(coords);
    levels.forEach((lvl, i) =>
      this.createLevelCard(coords[i].x, coords[i].y, lvl),
    );
  }

  private createLevelCard(x: number, y: number, level: LevelData) {
    const isLocked = !level.unlocked;
    const isCompleted = level.completed;
    const isCurrent = level.unlocked && !level.completed;

    const container = this.add.container(x, y);
    const cardW = 240,
      cardH = 180;

    // Card Colors
    const theme = isLocked
      ? { bg: 0xf1f5f9, border: 0xcbd5e1 }
      : isCompleted
        ? { bg: 0xf0fdf4, border: 0x86efac }
        : { bg: 0xffffff, border: 0x4a90e2 };

    // Graphics
    const card = this.add.graphics();
    card
      .fillStyle(0x000000, 0.05)
      .fillRoundedRect(-cardW / 2 + 4, -cardH / 2 + 4, cardW, cardH, 16);
    card
      .fillStyle(theme.bg)
      .fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    card
      .lineStyle(isCurrent ? 4 : 2, theme.border)
      .strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    container.add(card);

    // Image
    const img = this.add.image(0, -35, level.imageKey);
    if (isLocked) img.setTint(0x000000).setAlpha(0.2);
    container.add(img);
    if (isLocked)
      container.add(
        this.add.text(0, -35, "🔒", { fontSize: "40px" }).setOrigin(0.5),
      );

    // Texts
    container.add(
      this.add
        .text(0, 50, level.label, {
          fontFamily: "Arial",
          fontSize: "16px",
          fontStyle: "bold",
          color: isLocked ? "#94a3b8" : "#334155",
        })
        .setOrigin(0.5),
    );

    // Stats Pill
    if (!isLocked) {
      this.addStatsPill(container, level.points, level.time);
    }

    // Interactions
    if (isCurrent) {
      container
        .setSize(cardW, cardH)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.handleGameStart());
      this.tweens.add({
        targets: container,
        scale: 1.02,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    }

    this.levelCards.push(container);

    // 1. Define colors for difficulty labels
    const difficultyColors: Record<string, string> = {
      EASY: "#22c55e", // Green
      MEDIUM: "#eab308", // Yellow
      HARD: "#ef4444", // Red
      BOSS: "#7c3aed", // Purple
    };

    // 2. Create the Difficulty Label Text
    const diffLabel = this.add
      .text(-80, 65, level.difficulty, {
        fontFamily: "Arial",
        fontSize: "13px",
        fontStyle: "bold",
        color: isLocked ? "#94a3b8" : difficultyColors[level.difficulty],
        backgroundColor: isLocked ? "#f1f5f9" : "transparent",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5);

    container.add(diffLabel);
  }

  private addStatsPill(
    container: Phaser.GameObjects.Container,
    pts: number,
    time: number,
  ) {
    const pill = this.add.container(0, 120);
    const bg = this.add
      .graphics()
      .fillStyle(0xffffff)
      .fillRoundedRect(-95, -12, 190, 40, 8);
    bg.lineStyle(1, 0xe2e8f0).strokeRoundedRect(-95, -12, 190, 40, 8);

    const txtStyle = { fontSize: "14px", color: "#334155", fontStyle: "bold" };
    pill.add([
      bg,
      this.add.text(-45, 8, `${pts} pts`, txtStyle).setOrigin(0.5),
      this.add.text(45, 8, this.formatTime(time), txtStyle).setOrigin(0.5),
      this.add.graphics().lineStyle(1, 0xe2e8f0).lineBetween(0, -8, 0, 8),
    ]);
    container.add(pill);
  }

  /**
   * HELPERS
   */

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

  private drawPath(coords: { x: number; y: number }[]) {
    const g = this.add.graphics().lineStyle(4, 0xcbd5e1, 0.3);
    for (let i = 0; i < coords.length - 1; i++) {
      g.lineBetween(coords[i].x, coords[i].y, coords[i + 1].x, coords[i + 1].y);
    }
  }

  private handleGameStart() {
    AudioManager.getInstance().playSound("click");
    this.cameras.main.fadeOut(500);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      const flags = this.savedProgress?.gameState?.eventFlags;
      if (flags?.bossLevelCompleted)
        this.scene.start("BossLevelScene", this.savedProgress);
      else if (flags?.warningCompleted)
        this.scene.start("BossLevelScene", this.savedProgress);
      else if (flags?.hardLevelCompleted)
        this.scene.start("WarningScene", this.savedProgress);
      else if (flags?.playgroundCompleted)
        this.scene.start("MediumLevelScene", this.savedProgress);
      else if (flags?.hardIntroCompleted)
        this.scene.start("PlayGroundScene", this.savedProgress);
      else if (flags?.mediumLevelCompleted)
        this.scene.start("HomeScene", this.savedProgress);
      else if (flags?.officeCompleted)
        this.scene.start("MediumLevelScene", this.savedProgress);
      else if (flags?.arrivedAtOffice)
        this.scene.start("OfficeScene", this.savedProgress);
      else if (flags?.introCompleted)
        this.scene.start("CarDriveScene", this.savedProgress);
      else this.scene.start("IntroScene", this.savedProgress ?? undefined);
    });
  }
}
