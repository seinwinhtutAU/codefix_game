import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import { checkExistingSolveRecord } from "@/services/problem";

export default class EasyLevelScene extends GameScene {
  private problemIds: string[] = [
    "69582fb37538b18589a46564",
    "69582fb37538b18589a46564",
    "69582fb37538b18589a46564",
    "69582fb37538b18589a46564",
    "69582fb37538b18589a46564",
    "69582fb37538b18589a46564",
    "69582fb37538b18589a46564",
    "695c13b389e02a7e13dbe5ca",
    "695c13b389e02a7e13dbe5ca",
    "695c13b389e02a7e13dbe5ca",
  ];

  private roadPoints = [
    { x: 230, y: 640 },
    { x: 130, y: 550 },
    { x: 140, y: 380 },
    { x: 250, y: 300 },
    { x: 450, y: 400 },
    { x: 680, y: 450 },
    { x: 920, y: 400 },
    { x: 1100, y: 300 },
    { x: 1230, y: 450 },
    { x: 1150, y: 640 },
  ];

  constructor() {
    super("EasyLevelScene");
  }

  preload() {
    this.load.image("easy-map", "/easy/map.png");
    this.load.image("easy-circle", "/easy/circle.png");
    this.load.image("easy-circle-current", "/easy/circle_current.png");
    this.load.image("easy-lock", "/easy/lock.png");
    this.load.image("easy-unlock", "/easy/unlock.png");
  }

  async create() {
    super.create();
    const { width, height } = this.scale;

    const loadingText = this.add
      .text(width / 2, height / 2, "Loading...", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("menu-bgm", {
      loop: true,
      volume: 0.15,
    });

    const userId = this.savedProgress.userId;
    const solveStatuses = await this.getBatchSolveStatus(userId);

    loadingText.destroy();
    this.add
      .image(0, 0, "easy-map")
      .setOrigin(0, 0)
      .setDisplaySize(width, height);

    const solvedCount = solveStatuses.filter((solved) => solved).length;
    const isLevelComplete = solvedCount >= 10;

    this.roadPoints.forEach((point, index) => {
      const objectId = this.problemIds[index];
      const isSolved = solveStatuses[index];
      const isCurrent = index === solvedCount;
      const isLocked = index > solvedCount;

      const circleKey = isCurrent ? "easy-circle-current" : "easy-circle";
      const circle = this.add
        .image(point.x, point.y, circleKey)
        .setDisplaySize(100, 70);

      if (isCurrent && !isLevelComplete) {
        this.tweens.add({
          targets: circle,
          scale: 1.05,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
      }

      // Updated Logic: Only 'isSolved' gets the unlock icon
      const iconKey = isSolved ? "easy-unlock" : "easy-lock";
      this.add.image(point.x - 5, point.y - 5, iconKey).setDisplaySize(30, 40);

      if (isCurrent && !isLevelComplete) {
        circle.setInteractive({ useHandCursor: true });
        circle.on("pointerdown", () => {
          AudioManager.getInstance().playSound("click");
          window.location.href = `/problem/${objectId}`;
        });
      }
    });

    if (isLevelComplete) {
      this.showSuccessUI();
    }
  }

  private async getBatchSolveStatus(userId: string): Promise<boolean[]> {
    const checkPromises = this.problemIds.map((id) => {
      return checkExistingSolveRecord(userId, id);
    });

    const results = await Promise.all(checkPromises);
    return results.map((record) => record?.data !== null);
  }

  private showSuccessUI() {
    const { width, height } = this.scale;
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7).fillRect(0, 0, width, height);

    this.add
      .text(width / 2, height / 2 - 120, "SECTOR CLEAR!", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "40px",
        color: "#00ff00",
      })
      .setOrigin(0.5);

    const menuBtn = this.add
      .text(width / 2, height / 2 + 20, "MAIN MENU", {
        fontSize: "20px",
        fontFamily: '"Press Start 2P", monospace',
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on("pointerdown", () => {
      AudioManager.getInstance().playSound("click");
      this.scene.start("MainMenuScene");
    });

    const nextBtn = this.add
      .text(width / 2, height / 2 + 100, "NEXT LEVEL >", {
        fontSize: "20px",
        fontFamily: '"Press Start 2P", monospace',
        backgroundColor: "#00ff00",
        color: "#000000",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    nextBtn.on("pointerdown", () => {
      AudioManager.getInstance().playSound("click");
      this.scene.start("MediumIntroPage");
    });
  }
}
