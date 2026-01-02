import * as Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
  // Store the text object so we can change it later
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super("PreloadScene");
  }

  preload() {
    const { width, height } = this.cameras.main;

    // 1. Setup UI
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add
      .text(width / 2, height / 2 - 50, "Loading...", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // 2. Progress Event
    this.load.on("progress", (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x3498db, 1);
      this.progressBar.fillRect(
        width / 2 - 150,
        height / 2 - 15,
        300 * value,
        30
      );
    });

    // 3. Fake Load for testing (Keep your existing asset loads here)
    for (let i = 0; i < 100; i++) {
      this.load.image(`test_${i}`, "/assets/bg.png"); // Make sure this path exists or remove this loop
    }

    // 4. Load ACTUAL Audio
    // Ensure these paths are correct in your public folder
    this.load.audio("menu-bgm", "/audio/bgm.mp3");
    this.load.audio("click", "/audio/click.mp3");
  }

  create() {
    this.progressBar.destroy();
    this.progressBox.destroy();
    this.loadingText.setText("Click to Start").setInteractive();
    this.input.once("pointerdown", () => {
      this.scene.start("MainMenuScene");
    });
  }
}
