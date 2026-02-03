import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import Button from "../ui/Button";
import { checkExistingSolveRecord, fetchProblem } from "@/services/problem";
import { ProblemSolveRecord } from "@/lib/types";

interface LevelData {
  id: string;
  label: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "BOSS"; // Added difficulty field
  imageKey: string;
  unlocked: boolean;
  completed: boolean;
  points: number;
  time: number;
}

interface LevelStats {
  points: number;
  time: number;
}

export default class LevelScene extends GameScene {
  constructor() {
    super("LevelScene");
  }

  async create() {
    super.create();

    const { width, height } = this.cameras.main;

    // 1. Background
    this.add.image(width / 2, height / 2, "level-bg").setTint(0xf8fafc);

    // 2. Title
    this.add
      .text(width / 2, 50, "GAME LOG", {
        fontFamily: "Gluten",
        fontSize: "42px",
        color: "#4a90e2",
      })
      .setOrigin(0.5)
      .setStroke("#FFF", 6)
      .setShadow(2, 2, "rgba(0,0,0,0.1)", 2, true, true);

    // --- FETCH STATS ---
    const stats = await this.calculateLevelStats();
    const flags = this.savedProgress?.gameState?.eventFlags;

    const totalPoints =
      stats.easy.points +
      stats.medium.points +
      stats.hard.points +
      stats.boss.points;
    const totalTime =
      stats.easy.time + stats.medium.time + stats.hard.time + stats.boss.time;

    // 3. Draw Total Stats Header
    this.createTotalSummary(width / 2, 110, totalPoints, totalTime);

    // 4. Level Data
    const levels: LevelData[] = [
      {
        id: "Easy",
        label: "TRAFFIC STOP",
        difficulty: "EASY",
        imageKey: "level-police-red-light",
        unlocked: true,
        completed: !!flags?.easyQuizCompleted,
        points: stats.easy.points,
        time: stats.easy.time,
      },
      {
        id: "Medium",
        label: "THE OFFICE",
        difficulty: "MEDIUM",
        imageKey: "level-office-home",
        unlocked: !!flags?.easyQuizCompleted,
        completed: !!flags?.mediumLevelCompleted,
        points: stats.medium.points,
        time: stats.medium.time,
      },
      {
        id: "Hard",
        label: "THE PARK",
        difficulty: "HARD",
        imageKey: "level-park",
        unlocked: !!flags?.mediumLevelCompleted,
        completed: !!flags?.hardLevelCompleted,
        points: stats.hard.points,
        time: stats.hard.time,
      },
      {
        id: "Boss",
        label: "SYSTEM CORE",
        difficulty: "BOSS",
        imageKey: "level-core",
        unlocked: !!flags?.hardLevelCompleted,
        completed: !!flags?.bossLevelCompleted,
        points: stats.boss.points,
        time: stats.boss.time,
      },
    ];

    // 5. Layout
    const coords = [
      { x: width / 2 - 200, y: height / 2 - 110 },
      { x: width / 2 + 200, y: height / 2 - 110 },
      { x: width / 2 - 200, y: height / 2 + 170 },
      { x: width / 2 + 200, y: height / 2 + 170 },
    ];

    // 6. Path
    this.drawPath(coords);

    // 7. Create Cards
    levels.forEach((level, index) => {
      this.createLevelCard(coords[index].x, coords[index].y, level);
    });

    // 8. Back Button
    new Button(this, {
      x: width / 2,
      y: height - 50,
      width: 160,
      height: 40,
      text: "BACK",
      color: 0x4a90e2,
      textStyle: { fontFamily: "Arial", fontSize: "14px", fontStyle: "bold" },
      onClick: () => {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("MainMenuScene");
        });
      },
    });
  }

  // --- LOGIC ---
  private async calculateLevelStats() {
    const stats: Record<string, LevelStats> = {
      easy: { points: 0, time: 0 },
      medium: { points: 0, time: 0 },
      hard: { points: 0, time: 0 },
      boss: { points: 0, time: 0 },
    };

    const records = await this.getAllSolvedRecord();

    await Promise.all(
      records.map(async (record) => {
        if (!record) return;

        try {
          const problemData = await fetchProblem(record.problemId);
          const problem = problemData.problem;
          const difficulty =
            problem?.difficulty || problem?.difficulty || "easy";

          let levelKey = "easy";
          if (difficulty === "medium") levelKey = "medium";
          if (difficulty === "hard") levelKey = "hard";

          if (stats[levelKey]) {
            stats[levelKey].points += record.pointsEarned;
            stats[levelKey].time += record.timeSpent;
          }
        } catch (e) {
          console.warn(
            `Failed to fetch problem ${record?.problemId || "unknown"}`,
            e,
          );
        }
      }),
    );

    if (this.savedProgress?.gameState?.eventFlags?.easyQuizCompleted) {
      stats.easy.points += 100;
    }

    return {
      easy: { points: stats.easy.points, time: stats.easy.time },
      medium: {
        points: stats.medium.points,
        time: stats.medium.time,
      },
      hard: { points: stats.hard.points, time: stats.hard.time },
      boss: { points: stats.boss.points, time: stats.boss.time },
    };
  }

  private async getAllSolvedRecord(): Promise<ProblemSolveRecord[]> {
    const allProblemIds = [
      "697401975f4942a9208dc6a6",
      "697401ad5f4942a9208dc6bc",
      "697401dc5f4942a9208dc707",
    ];
    const userId = this.savedProgress.userId;
    const solveRecords = await Promise.all(
      allProblemIds.map(async (id) => {
        const record = await checkExistingSolveRecord(userId, id);
        return record?.data;
      }),
    );

    return solveRecords.filter(
      (record): record is ProblemSolveRecord => record != null,
    );
  }

  // --- UI HELPERS ---

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }

  private createTotalSummary(
    x: number,
    y: number,
    totalPoints: number,
    totalTime: number,
  ) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-180, -22, 360, 44, 22);
    bg.lineStyle(1, 0xcbd5e1, 1);
    bg.strokeRoundedRect(-180, -22, 360, 44, 22);
    container.add(bg);

    const sep = this.add.graphics();
    sep.lineStyle(1, 0xe2e8f0, 1);
    sep.lineBetween(0, -15, 0, 15);
    container.add(sep);

    const scoreLabel = this.add
      .text(-90, -8, "TOTAL POINTS", {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#4A90E2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const scoreVal = this.add
      .text(-90, 8, `${totalPoints}`, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#4A90E2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const timeLabel = this.add
      .text(90, -8, "TOTAL TIME", {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#4A90E2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const timeVal = this.add
      .text(90, 8, this.formatTime(totalTime), {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#4A90E2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([scoreLabel, scoreVal, timeLabel, timeVal]);
  }

  private drawPath(coords: { x: number; y: number }[]) {
    const path = this.add.graphics();
    path.lineStyle(4, 0xcbd5e1, 0.5);

    const drawDashedLine = (x1: number, y1: number, x2: number, y2: number) => {
      const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const dashLen = 10;
      const gapLen = 10;
      const steps = dist / (dashLen + gapLen);

      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 0.5) / steps;
        path.lineBetween(
          Phaser.Math.Linear(x1, x2, t1),
          Phaser.Math.Linear(y1, y2, t1),
          Phaser.Math.Linear(x1, x2, t2),
          Phaser.Math.Linear(y1, y2, t2),
        );
      }
    };

    drawDashedLine(coords[0].x, coords[0].y, coords[1].x, coords[1].y);
    drawDashedLine(coords[1].x, coords[1].y, coords[2].x, coords[2].y);
    drawDashedLine(coords[2].x, coords[2].y, coords[3].x, coords[3].y);
  }

  private createLevelCard(x: number, y: number, level: LevelData): void {
    const isLocked = !level.unlocked;
    const isCompleted = level.completed;
    const isCurrent = level.unlocked && !level.completed;

    const container = this.add.container(x, y);

    const colors = {
      locked: { bg: 0xf1f5f9, border: 0xcbd5e1, text: 0x94a3b8 },
      completed: { bg: 0xf0fdf4, border: 0x86efac, text: 0x166534 },
      current: { bg: 0xffffff, border: 0x4a90e2, text: 0x334155 },
    };

    const theme = isLocked
      ? colors.locked
      : isCompleted
        ? colors.completed
        : colors.current;

    // 1. Card Body
    const cardW = 240;
    const cardH = 180;

    const card = this.add.graphics();
    // Shadow
    card.fillStyle(0x000000, 0.05);
    card.fillRoundedRect(-(cardW / 2) + 4, -(cardH / 2) + 4, cardW, cardH, 16);
    // Main
    card.fillStyle(theme.bg, 1);
    card.fillRoundedRect(-(cardW / 2), -(cardH / 2), cardW, cardH, 16);
    // Border
    card.lineStyle(isCurrent ? 4 : 2, theme.border, 1);
    card.strokeRoundedRect(-(cardW / 2), -(cardH / 2), cardW, cardH, 16);
    container.add(card);

    // 2. IMAGE RENDERING
    const imageContainer = this.add.container(0, -35);
    const levelImg = this.add.image(0, 0, level.imageKey);

    if (isLocked) {
      levelImg.setTint(0x000000);
      levelImg.setAlpha(0.2);
      const lockIcon = this.add
        .text(0, 0, "🔒", { fontSize: "50px" })
        .setOrigin(0.5);
      imageContainer.add([levelImg, lockIcon]);
    } else {
      imageContainer.add(levelImg);
    }
    container.add(imageContainer);

    // 3. Status Tag (Bottom Left)
    let statusStr = "LOCKED";
    let statusColor = "#94a3b8";
    if (isCompleted) {
      statusStr = "COMPLETED";
      statusColor = "#16a34a";
    }
    if (isCurrent) {
      statusStr = "ACTIVE";
      statusColor = "#4A90E2";
    }

    const statusText = this.add.text(-(cardW / 2) + 20, 60, statusStr, {
      fontFamily: "Arial",
      fontSize: "12px",
      fontStyle: "bold",
      color: statusColor,
    });
    container.add(statusText);

    // 4. Level Label (Center)
    const label = this.add
      .text(0, 50, level.label, {
        fontFamily: "Arial",
        fontSize: "16px",
        fontStyle: "bold",
        color: isLocked ? "#94a3b8" : "#334155",
        letterSpacing: 1,
      })
      .setOrigin(0.5);
    container.add(label);

    // 5. DIFFICULTY TAG (Top Left - New!)
    // Only show color if unlocked, otherwise gray
    const diffColors = {
      EASY: 0x22c55e, // Green
      MEDIUM: 0xf59e0b, // Orange
      HARD: 0xef4444, // Red
      BOSS: 0x8b5cf6, // Purple
    };

    const diffColor = isLocked ? 0x94a3b8 : diffColors[level.difficulty];

    const diffBadge = this.add.container(-(cardW / 2) + 38, -(cardH / 2) + 20);

    const diffBg = this.add.graphics();
    diffBg.fillStyle(diffColor, 0.15); // Transparent background
    diffBg.fillRoundedRect(-30, -10, 60, 20, 4);
    diffBg.lineStyle(1, diffColor, 0.8);
    diffBg.strokeRoundedRect(-30, -10, 60, 20, 4);
    diffBadge.add(diffBg);

    const diffText = this.add
      .text(0, 0, level.difficulty, {
        fontFamily: "Arial",
        fontSize: "10px",
        fontStyle: "bold",
        color: isLocked ? "#94a3b8" : this.colorToHex(diffColor),
      })
      .setOrigin(0.5);
    diffBadge.add(diffText);

    container.add(diffBadge);

    // 6. STATS PILL
    if (!isLocked) {
      const pillY = 120;
      const stats = this.add.container(0, pillY);

      const pillBg = this.add.graphics();
      pillBg.fillStyle(0xffffff, 1);
      pillBg.fillRoundedRect(-95, -12, 180, 40, 8);
      pillBg.lineStyle(1, 0xe2e8f0, 1);
      pillBg.strokeRoundedRect(-95, -12, 180, 40, 8);
      stats.add(pillBg);

      const div = this.add.graphics();
      div.lineStyle(1, 0xe2e8f0, 1);
      div.lineBetween(0, -8, 0, 8);
      stats.add(div);

      const ptsVal = this.add
        .text(-40, 5, `${level.points} pts`, {
          fontSize: "15px",
          color: "#334155",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      const timeVal = this.add
        .text(40, 5, this.formatTime(level.time), {
          fontSize: "15px",
          color: "#334155",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      stats.add([ptsVal, timeVal]);
      container.add(stats);
    }

    // 7. Interaction
    if (isCurrent) {
      container.setSize(cardW, cardH);
      container.setInteractive({ useHandCursor: true });

      this.tweens.add({
        targets: container,
        scale: 1.03,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });

      container.on("pointerover", () => {
        this.tweens.add({
          targets: container,
          y: y - 5,
          duration: 200,
          ease: "Back.out",
        });
      });
      container.on("pointerout", () => {
        this.tweens.add({
          targets: container,
          y: y,
          duration: 200,
          ease: "Sine.out",
        });
      });
      container.on("pointerdown", () => {
        AudioManager.getInstance().playSound("click");
        this.cameras.main.fadeOut(500);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.handleGameStart();
        });
      });
    } else if (isCompleted) {
      const check = this.add
        .text(cardW / 2 - 30, -(cardH / 2) + 25, "✓", {
          fontSize: "24px",
          color: "#22c55e",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      container.add(check);
    }
  }

  // Helper to convert hex number to CSS string
  private colorToHex(color: number): string {
    return "#" + color.toString(16).padStart(6, "0");
  }

  private handleGameStart() {
    const flags = this.savedProgress?.gameState?.eventFlags;
    if (flags?.bossLevelCompleted)
      this.scene.start("EndingScene", this.savedProgress);
    else if (flags?.warningCompleted)
      this.scene.start("BossLevelScene", this.savedProgress);
    else if (flags?.hardLevelCompleted)
      this.scene.start("WarningScene", this.savedProgress);
    else if (flags?.playgroundCompleted)
      this.scene.start("HardLevelScene", this.savedProgress);
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
    else this.scene.start("IntroScene", this.savedProgress);
  }
}
