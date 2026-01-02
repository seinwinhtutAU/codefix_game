import * as Phaser from "phaser";
import AudioManager from "../AudioManager";
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload() {}

  create() {
    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("menu-bgm", {
      loop: true,
      volume: 0.15,
    });

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    const { width, height } = this.cameras.main;

    // Title
    this.add
      .text(width / 2, height / 2 - 100, "MY AWESOME GAME", {
        fontSize: "48px",
      })
      .setOrigin(0.5);

    // Start Button
    const startButton = this.add
      .text(width / 2, height / 2 + 50, "START GAME", {
        fontSize: "32px",
        color: "#00ff00",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => {
      console.log("Starting the game...");

      // 5. Add a click sound for feedback
      AudioManager.getInstance().playSound("click");

      this.scene.start("IntroScene");
    });

    // Hover Effects
    startButton.on("pointerover", () => startButton.setScale(1.2));
    startButton.on("pointerout", () => startButton.setScale(1));
  }
}
