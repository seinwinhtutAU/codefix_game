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
        30,
      );
    });

    this.load.image("house-bg", "/intro/house-bg.png");
    this.load.image("wife", "/player/idle/wife.png");
    this.load.image("car", "/intro/car_1.png");
    this.load.image("police_car", "/intro/police1.png");
    this.load.image("office-bg", "/intro/office_work.png");

    // Sun in CarDriveScene
    this.load.image("sun", "/intro/bg/sun1.png");

    // Building in CarDriveScene
    this.load.image("building1", "/intro/building/building1.png");
    this.load.image("building2", "/intro/building/building2.png");
    this.load.image("building3", "/intro/building/building3.png");
    this.load.image("building4", "/intro/building/building4.png");
    this.load.image("building5", "/intro/building/building5.png");
    this.load.image("car_building", "/intro/bg/building2.png");
    this.load.image("red_light", "/intro/building/red_light.png");

    // Road and background in CarDriveScene
    this.load.image("car_bg_1", "/intro/bg/bg1_1.png");
    this.load.image("car_bg_2", "/intro/bg/bg1_2.png");
    this.load.image("car_bg_3", "/intro/bg/bg1_1.png");
    this.load.image("car_bg_4", "/intro/bg/bg1_1.png");
    this.load.image("car_cloud", "/intro/bg/cloud.png");

    // Player
    this.load.image("player", "/player/idle/stand1.png");
    for (let i = 1; i <= 3; i++) {
      this.load.image(`player_walk_${i}`, `/player/walk/walk_${i}.png`);
    }

    // Audio
    this.load.audio("bgm", "/audio/bgm.mp3");
    this.load.audio("menu-bgm", "/audio/bgm.mp3");
    this.load.audio("drive-bgm", "/audio/bgm.mp3");
    this.load.audio("siren", "/audio/siren.mp3");
    this.load.audio("click", "/audio/click.mp3");
    this.load.audio("speech-blip", "/audio/blip.mp3");
    this.load.audio("pop", "/audio/pop.mp3");

    // 431 * 521
    this.load.spritesheet("player_walk", "player/walk/walk_spritesheet.png", {
      frameWidth: 431,
      frameHeight: 521,
    });

    this.load.image("dialog-box", "player/dialog.png");

    // easylevel
    this.load.image("easy-map", "/easy/level_map/map1.png");
    this.load.image("easy-point-current", "/easy/level_map/point_current.png");
    this.load.image("easy-point-lock", "/easy/level_map/point_lock.png");
    this.load.image("easy-point-skip", "/easy/level_map/point_skip.png");
    this.load.image("start-here", "/easy/level_map/start_here1.png");
    for (let i = 1; i <= 10; i++) {
      this.load.image(`easy-point-${i}`, `easy/level_map/point_${i}.png`);
    }

    // mediumlevel
    this.load.image("medium-map", "/medium/level_map/map.png");
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
        JSON.stringify(this.savedProgress, null, 2),
      );

      // this.scene.start("MainMenuScene", this.savedProgress);
      this.scene.start("BossLevelScene", this.savedProgress);
    });

    this.events.on("shutdown", () => {
      EventBus.off("start-scene-progress");
    });
  }
}
