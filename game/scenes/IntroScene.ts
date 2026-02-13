import Phaser from "phaser";
import Player from "../objects/Player";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox";
import GameScene from "./GameScene";
import Button from "../ui/Button"; // Standardized Button component
import { EventBus } from "../events";
import { IGameProgress } from "@/lib/types";

type WASDKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export default class IntroScene extends GameScene {
  // --- OBJECTS ---
  private player!: Player;
  private wife!: Phaser.GameObjects.Image;
  private car!: Phaser.GameObjects.Image;
  private nextButton!: Button; // Changed from Text to Button

  // --- SHADOWS ---
  private wifeShadow!: Phaser.GameObjects.Graphics;
  private carShadow!: Phaser.GameObjects.Graphics;

  // --- CONTROLS ---
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: WASDKeys;
  private canMove: boolean = false;
  private dialogBox!: DialogBox;

  constructor() {
    super("IntroScene");
  }

  preload() {}

  create() {
    // 1. Initialize GameScene
    super.create();

    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("bgm", { loop: true, volume: 0.15 });

    // 2. CHECK IF ALREADY COMPLETED
    if (this.savedProgress?.gameState?.eventFlags?.introCompleted) {
      this.scene.start("CarDriveScene");
      return;
    }

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys("W,A,S,D") as WASDKeys;
    }

    // --- WORLD SETUP ---
    this.add.image(0, 0, "house-bg").setOrigin(0, 0);

    this.carShadow = this.add.graphics();
    this.carShadow.fillStyle(0x000000, 0.3);
    this.carShadow.fillEllipse(0, 0, 220, 40);
    this.car = this.add.image(400, 630, "car");
    this.car.setDisplaySize(260, 130);
    this.carShadow.setPosition(this.car.x, this.car.y + 55);

    this.wifeShadow = this.add.graphics();
    this.wifeShadow.fillStyle(0x000000, 0.3);
    this.wifeShadow.fillEllipse(0, 0, 70, 20);
    this.wife = this.add.image(950, 615, "wife");
    this.wife.setDisplaySize(116, 160).setFlipX(true);
    this.wifeShadow.setPosition(this.wife.x, this.wife.y + 70);

    this.carShadow.setDepth(1);
    this.wifeShadow.setDepth(1);
    this.car.setDepth(2);
    this.wife.setDepth(2);

    this.player = new Player(this, 750, 630);
    this.dialogBox = new DialogBox(this);

    // --- BUTTON SETUP (MATCHING HOME SCENE STYLE) ---
    const { width, height } = this.scale;

    this.nextButton = new Button(this, {
      x: width - 150,
      y: height - 100,
      text: "NEXT >",
      width: 165,
      height: 55,
      color: 0x4a90e2,
      onClick: () => {
        this.handleGoodbyeSequence();
      },
    });

    this.nextButton.setVisible(false);
    this.nextButton.setAlpha(0);

    // --- START SEQUENCE ---
    this.time.delayedCall(800, () => {
      this.showMorningIntroText(() => {
        this.runIntroSequence();
      });
    });
  }

  update(time: number, delta: number) {
    if (this.canMove) {
      this.player.move(this.cursors, this.wasd, delta);
      this.checkCarProximity();
    }
  }

  private checkCarProximity() {
    const dist = Math.abs(this.player.x - this.car.x);
    const isNear = dist < 80;

    // Smooth reveal like HomeScene
    if (isNear && this.nextButton.alpha === 0) {
      this.nextButton.setVisible(true);
      this.tweens.add({
        targets: this.nextButton,
        alpha: 1,
        duration: 300,
      });
    } else if (!isNear && this.nextButton.alpha === 1) {
      this.tweens.add({
        targets: this.nextButton,
        alpha: 0,
        duration: 300,
        onComplete: () => this.nextButton.setVisible(false),
      });
    }
  }

  private runIntroSequence() {
    this.dialogBox.show(
      this.wife.x,
      this.wife.y - 120,
      "You're running late. Don't forget your access code!",
    );

    this.time.delayedCall(3000, () => {
      this.dialogBox.show(
        this.player.x,
        this.player.y - 120,
        "I know! I'll be quick.",
      );

      this.time.delayedCall(2000, () => {
        this.dialogBox.hide();
        this.canMove = true;
      });
    });
  }

  private async handleGoodbyeSequence() {
    // Prevent double clicking and movement
    this.canMove = false;
    this.nextButton.setEnabled(false);

    this.tweens.add({
      targets: this.nextButton,
      alpha: 0,
      duration: 200,
      onComplete: () => this.nextButton.setVisible(false),
    });

    this.dialogBox.show(
      this.player.x,
      this.player.y - 120,
      "I’m going to the office now!",
    );

    this.time.delayedCall(2000, () => {
      this.dialogBox.show(
        this.wife.x,
        this.wife.y - 120,
        "Take care. See you later.",
      );

      this.time.delayedCall(2000, () => {
        this.dialogBox.hide();
        this.completeIntro();
      });
    });
  }

  private async completeIntro() {
    if (!this.savedProgress) return;

    await this.emitCarScene(this.savedProgress);

    // Transition Logic
    AudioManager.getInstance().stopMusic();
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start("CarDriveScene", this.savedProgress);
      },
    );
  }

  private async emitCarScene(progress: IGameProgress) {
    const updatedProgress: IGameProgress = {
      ...progress,
      lastLocation: "/game",
      gameState: {
        ...progress.gameState,
        currentScene: "CarDriveScene",
        eventFlags: {
          ...progress.gameState.eventFlags,
          introCompleted: true,
        },
        currentTask: {
          taskType: "none",
          status: "none",
          taskId: undefined,
          attempts: 0,
          timer: 0,
          currentActiveIndex: 0,
          highestHintLevelUsed: "none",
          hintUsages: [],
        },
      },
      bugCounts: [],
    };

    EventBus.emit("progress-updated", updatedProgress);
    this.savedProgress = updatedProgress;
  }

  private showMorningIntroText(onComplete?: () => void) {
    const bg = this.add
      .rectangle(
        this.scale.width / 2,
        60,
        this.scale.width,
        180,
        0x000000,
        0.35,
      )
      .setAlpha(0);

    const text = this.add
      .text(
        this.scale.width / 2,
        60,
        "Morning comes quietly.\nYou're already running late.\nAnother day of work begins.",
        {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#e8e8e8",
          align: "center",
          lineSpacing: 6,
          wordWrap: { width: this.scale.width - 120 },
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [bg],
      alpha: 1,
      duration: 800,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: text,
      y: 70,
      alpha: 1,
      duration: 800,
      ease: "Sine.easeOut",
    });

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [bg, text],
        alpha: 0,
        duration: 600,
        onComplete: () => {
          bg.destroy();
          text.destroy();
          onComplete?.();
        },
      });
    });
  }
}
