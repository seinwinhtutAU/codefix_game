import Phaser from "phaser";
import Player from "../objects/Player";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox";
import GameScene from "./GameScene";
import { EventBus } from "../events";
import { IGameProgress } from "@/lib/types";
import { progress } from "framer-motion";

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
  private nextButton!: Phaser.GameObjects.Text;

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
    // 1. Initialize GameScene (Sets up EventBus listeners for mute/pause/audio)
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

    this.add.image(0, 0, "house-bg").setOrigin(0, 0);

    this.carShadow = this.add.graphics();
    this.carShadow.fillStyle(0x000000, 0.3);
    this.carShadow.fillEllipse(0, 0, 220, 40);
    this.car = this.add.image(400, 630, "car");
    this.car.setDisplaySize(260, 130);
    this.carShadow.setPosition(this.car.x, this.car.y + 55);

    this.player = new Player(this, 750, 630);

    this.wifeShadow = this.add.graphics();
    this.wifeShadow.fillStyle(0x000000, 0.3);
    this.wifeShadow.fillEllipse(0, 0, 70, 20);
    this.wife = this.add.image(950, 615, "wife");
    this.wife.setDisplaySize(116, 160).setFlipX(true);
    this.wifeShadow.setPosition(this.wife.x, this.wife.y + 80);

    this.carShadow.setDepth(1);
    this.wifeShadow.setDepth(1);
    this.car.setDepth(2);
    this.wife.setDepth(2);
    // this.player.setDepth(2);

    this.dialogBox = new DialogBox(this);

    const { width, height } = this.scale;

    // Setup Next Button
    this.nextButton = this.add
      .text(width - 150, height - 100, "NEXT >", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5) // Origin to center for better scaling effects
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    // Button PointerDown logic
    this.nextButton.on("pointerdown", () => {
      // PLAY UI SOUND via EventBus
      AudioManager.getInstance().playSound("click", { volume: 0.5 });

      // Visual feedback tween
      this.tweens.add({
        targets: this.nextButton,
        scale: 0.9,
        duration: 80,
        yoyo: true,
        ease: "Cubic.easeOut",
      });

      this.handleGoodbyeSequence();
    });

    this.time.delayedCall(1000, () => this.runIntroSequence());
  }

  update(time: number, delta: number) {
    if (this.canMove) {
      this.player.move(this.cursors, this.wasd, delta);
      this.checkCarProximity();
    }
  }

  private checkCarProximity() {
    const dist = Math.abs(this.player.x - this.car.x);
    // Button only appears when player is near the car
    this.nextButton.setVisible(dist < 80);
  }

  private runIntroSequence() {
    this.dialogBox.show(
      this.wife.x,
      this.wife.y - 120,
      "Don't forget your code!",
    );

    this.time.delayedCall(3000, () => {
      this.dialogBox.show(
        this.player.x,
        this.player.y - 120,
        "I won't, honey!",
      );

      this.time.delayedCall(2000, () => {
        this.dialogBox.hide();
        this.canMove = true;
      });
    });
  }

  private async handleGoodbyeSequence() {
    this.canMove = false;
    this.nextButton.setVisible(false);

    this.dialogBox.show(this.player.x, this.player.y - 120, "Bye bye!");

    this.time.delayedCall(2000, () => {
      this.dialogBox.show(this.wife.x, this.wife.y - 120, "Good luck!");

      this.time.delayedCall(2000, () => {
        this.dialogBox.hide();
        this.completeIntro();
      });
    });
  }

  private async completeIntro() {
    if (!this.savedProgress) return;

    this.emitCarScene(this.savedProgress);

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

  private emitCarScene(progress: IGameProgress) {
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
          ...progress.gameState.currentTask,
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
}
