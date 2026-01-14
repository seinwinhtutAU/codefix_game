import * as Phaser from "phaser";
import { IGameProgress } from "@/lib/types";
import { EventBus } from "../events";

export default class PreloadScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  // --- TEACHER'S ADDITION: Store the progress data ---
  private savedProgress!: IGameProgress;

  constructor() {
    super("PreloadScene");
  }

  preload() {
    EventBus.on("start-scene-progress", (data: IGameProgress) => {
      this.savedProgress = data;
    });

    const { width, height } = this.cameras.main;

    // UI Setup
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add
      .text(width / 2, height / 2 - 50, "Loading Assets...", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Progress Event
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

    this.load.image("house-bg", "/intro/house-bg.png");
    this.load.image("wife", "/player/idle/img.png");
    this.load.image("car", "/intro/car_1.png");
    this.load.image("police_car", "/intro/police1.png");
    this.load.image("office-bg", "/intro/office_work.png");

    // City backgrounds in CarDriveScene
    for (let i = 1; i <= 5; i++) {
      this.load.image(`city_${i}`, `/intro/city_${i}.png`);
    }

    // Player
    this.load.image("player", "/player/idle/img.png");
    for (let i = 0; i < 8; i++) {
      this.load.image(`player_walk_${i}`, `/player/walk/img${i}.png`);
    }

    // Audio
    this.load.audio("bgm", "/audio/bgm.mp3");
    this.load.audio("menu-bgm", "/audio/bgm.mp3");
    this.load.audio("drive-bgm", "/audio/bgm.mp3");
    this.load.audio("siren", "/audio/siren.mp3");
    this.load.audio("click", "/audio/click.mp3");
    this.load.audio("speech-blip", "/audio/blip.mp3");

    this.load.image("easy-map", "/easy/map.png");
    this.load.image("easy-circle", "/easy/circle.png");
    this.load.image("easy-circle-current", "/easy/circle_current.png");
    this.load.image("easy-lock", "/easy/lock.png");
    this.load.image("easy-unlock", "/easy/unlock.png");
  }

  create() {
    // 3. CLEAN UP AND PREPARE FOR START
    this.progressBar.destroy();
    this.progressBox.destroy();

    this.loadingText.setText("READY - CLICK TO START");

    this.input.once("pointerdown", () => {
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
        if (this.sound.context.state === "suspended") {
          this.sound.context.resume();
        }
      }

      console.log(
        "PreloadScene: ",
        JSON.stringify(this.savedProgress, null, 2)
      );

      this.scene.start("MainMenuScene", this.savedProgress);
    });

    this.events.on("shutdown", () => {
      EventBus.off("start-scene-progress");
    });
  }
}
