import * as Phaser from "phaser";
import { IGameProgress } from "@/lib/types";
import { EventBus } from "../events";

export default class PreloadScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private savedProgress!: IGameProgress;

  constructor() {
    super("PreloadScene");
  }

  preload() {
    EventBus.on("start-scene-progress", (data: IGameProgress) => {
      this.savedProgress = data;
    });

    const { width, height } = this.cameras.main;

    /* 🌱 CUTE GREEN BACKGROUND */
    this.cameras.main.setBackgroundColor("#93D4FF");

    /* 🌈 SOFT GRADIENT LAYER */
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xeaf4ff, 0xeaf4ff, 0xb5d9ff, 0xb5d9ff, 1);

    bg.fillRect(0, 0, width, height);
    bg.setDepth(-10);

    /* 📦 PROGRESS BOX (container) */
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x7fbfff, 0.9);
    this.progressBox.fillRoundedRect(
      width / 2 - 200, // centered
      height / 2 - 20, // vertically centered
      400, // wider, calmer
      24, // slimmer
      12,
    );

    this.progressBar = this.add.graphics();

    /* 📝 LOADING TEXT */
    this.loadingText = this.add
      .text(width / 2, height / 2 - 60, "LOADING ASSETS...", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#2C5D9E",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4a90e2, 1);
      this.progressBar.fillRoundedRect(
        width / 2 - 195, // small inset from box
        height / 2 - 17,
        390 * value, // fills smoothly
        18,
        10,
      );
    });

    // Character
    this.load.image("wife", "/player/idle/wife.png");
    this.load.image("player_idle", "/player/idle/player.png");
    this.load.spritesheet("player_walk", "player/walk/walk_spritesheet1.png", {
      frameWidth: 438,
      frameHeight: 505,
    });

    // Easy Level
    this.load.image("house-bg", "/easy/house-bg.png");
    this.load.image("car", "/easy/car.png");
    this.load.image("police_car", "/easy/police_car.png");
    this.load.image("office-bg", "/easy/office_bg.png");
    this.load.image("sun", "/easy/bg/sun.png");
    this.load.image("car_building", "/easy/bg/building.png");
    this.load.image("red_light", "/easy/bg/red_light.png");
    this.load.image("car_bg_1", "/easy/bg/bg1.png");
    this.load.image("car_bg_2", "/easy/bg/bg2.png");
    this.load.image("car_bg_3", "/easy/bg/bg1.png");
    this.load.image("car_bg_4", "/easy/bg/bg1.png");
    this.load.image("car_cloud", "/easy/bg/cloud.png");

    // Audio
    this.load.audio("bgm", "/audio/bgm.mp3");
    this.load.audio("menu-bgm", "/audio/bgm.mp3");
    this.load.audio("drive-bgm", "/audio/bgm.mp3");
    this.load.audio("siren", "/audio/siren.mp3");
    this.load.audio("click", "/audio/click.mp3");
    this.load.audio("speech-blip", "/audio/blip.mp3");
    this.load.audio("pop", "/audio/pop.mp3");
    this.load.audio("warning", "/audio/warning.mp3");
    this.load.audio("success", "/audio/success.mp3");
    this.load.audio("level-up", "/audio/level-up1.mp3");
    this.load.audio("victory", "/audio/victory.mp3");
    this.load.audio("gameover", "/audio/gameover.mp3");

    // Medium level
    this.load.image("medium-map", "/medium/map.png");
    this.load.image("point-current", "/medium/point_current.png");
    this.load.image("point-lock", "/medium/point_lock.png");
    this.load.image("point-skip", "/medium/point_skip.png");
    this.load.image("start-here", "/medium/start_here.png");
    for (let i = 1; i <= 10; i++) {
      this.load.image(`point-${i}`, `/medium/point_${i}.png`);
    }

    // Hard level
    this.load.image("hard-map", "/hard/map.png");
    this.load.image("hard_home", "/hard/home.png");
    this.load.image("play_ground_bg1", "/easy/bg/bg1.png");
    this.load.image("play_ground_bg2", "/easy/bg/bg2.png");
    this.load.image("park_building", "/hard/building.png");

    // Boss Level
    this.load.image("boss-bg", "/boss/boss_bg.png");
    this.load.image("warning-bg", "/boss/warning_bg.png");
    this.load.image("boss-warning", "/boss/warning.png");

    // Menu, level
    this.load.image("level-police-red-light", "/police_red_light.png");
    this.load.image("level-office-home", "/office_home.png");
    this.load.image("level-park", "/park.png");
    this.load.image("level-core", "/system_core.png");
    this.load.image("menu-bg", "/menu-bg.png");
    this.load.image("level-bg", "/level-bg.png");
  }

  create() {
    console.log(
      "Preload Scene Progress: ",
      JSON.stringify(this.savedProgress, null, 2),
    );

    this.progressBar.destroy();
    this.progressBox.destroy();

    this.loadingText.setText("READY 🌟 CLICK TO START").setColor("#1E4FA3");

    this.input.once("pointerdown", () => {
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
        if (this.sound.context.state === "suspended") {
          this.sound.context.resume();
        }
      }

      this.scene.start("MainMenuScene", this.savedProgress);
    });

    this.events.on("shutdown", () => {
      EventBus.off("start-scene-progress");
    });
  }
}
