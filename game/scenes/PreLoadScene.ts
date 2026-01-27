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
    this.cameras.main.setBackgroundColor("#E8FCE8");

    /* 🌈 SOFT GRADIENT LAYER */
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xe8fce8, 0xe8fce8, 0xb8efcb, 0xb8efcb, 1);
    bg.fillRect(0, 0, width, height);
    bg.setDepth(-10);

    /* 📦 PROGRESS BOX (container) */
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0xffffff, 0.9);
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
        color: "#4A7C59",
      })
      .setOrigin(0.5);

    /* 📊 PROGRESS BAR */
    this.load.on("progress", (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x6bcf9d, 1);
      this.progressBar.fillRoundedRect(
        width / 2 - 195, // small inset from box
        height / 2 - 17,
        390 * value, // fills smoothly
        18,
        10,
      );
    });

    /* 🔽 ASSETS */

    this.load.image("house-bg", "/intro/house-bg.png");
    this.load.image("wife", "/player/idle/wife1.png");
    this.load.image("car", "/intro/car_1.png");
    this.load.image("police_car", "/intro/police1.png");
    this.load.image("office-bg", "/intro/office_bg.png");

    this.load.image("sun", "/intro/bg/sun1.png");

    this.load.image("building1", "/intro/building/building1.png");
    this.load.image("building2", "/intro/building/building2.png");
    this.load.image("building3", "/intro/building/building3.png");
    this.load.image("building4", "/intro/building/building4.png");
    this.load.image("building5", "/intro/building/building5.png");
    this.load.image("car_building", "/intro/bg/building2.png");
    this.load.image("red_light", "/intro/building/red_light.png");

    this.load.image("car_bg_1", "/intro/bg/bg1_1.png");
    this.load.image("car_bg_2", "/intro/bg/bg1_2.png");
    this.load.image("car_bg_3", "/intro/bg/bg1_1.png");
    this.load.image("car_bg_4", "/intro/bg/bg1_1.png");
    this.load.image("car_cloud", "/intro/bg/cloud.png");

    this.load.image("player_idle", "/player/idle/stand2.png");
    for (let i = 1; i <= 3; i++) {
      this.load.image(`player_walk_${i}`, `/player/walk/walk_${i}.png`);
    }

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

    this.load.image("menu-bg", "/intro/menu-bg.png");

    this.load.spritesheet("player_walk", "player/walk/walk_spritesheet1.png", {
      frameWidth: 438,
      frameHeight: 505,
    });

    this.load.image("dialog-box", "player/dialog.png");

    this.load.image("easy-map", "/easy/level_map/easy_map.png");
    this.load.image("easy-point-current", "/easy/level_map/point_current.png");
    this.load.image("easy-point-lock", "/easy/level_map/point_lock.png");
    this.load.image("easy-point-skip", "/easy/level_map/point_skip.png");
    this.load.image("start-here", "/easy/level_map/start_here1.png");

    for (let i = 1; i <= 10; i++) {
      this.load.image(`easy-point-${i}`, `easy/level_map/point_${i}.png`);
    }

    this.load.image("medium-map", "/medium/level_map/map.png");
    this.load.image("medium_home", "/medium/home1.png");

    this.load.image("boss-bg", "/boss/boss_bg.png");
    this.load.image("warning-bg", "/boss/warning_bg1.png");
    this.load.image("boss-warning", "/boss/warning1.png");

    this.load.image("level-police-red-light", "/police_red_light.png");
    this.load.image("level-office-home", "/office_home.png");
    this.load.image("level-park", "/park.png");
    this.load.image("level-core", "/system_core.png");
  }

  create() {
    console.log(
      "Preload Scene Progress: ",
      JSON.stringify(this.savedProgress, null, 2),
    );

    this.progressBar.destroy();
    this.progressBox.destroy();

    this.loadingText.setText("READY 🌟 CLICK TO START").setColor("#3A7D44");

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
