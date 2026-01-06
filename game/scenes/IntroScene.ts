import Phaser from "phaser";
import Player from "../objects/Player";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox";
import GameScene from "./GameScene";
import { EventBus } from "../events";

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

    // 2. CHECK IF ALREADY COMPLETED
    if (this.savedProgress?.gameState?.eventFlags?.introCompleted) {
      this.scene.start("CarDriveScene", this.savedProgress);
      return;
    }

    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("bgm", { loop: true, volume: 0.15 });

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys("W,A,S,D") as WASDKeys;
    }

    this.add.image(0, 0, "house-bg").setOrigin(0, 0);

    this.car = this.add.image(400, 670, "car");
    this.car.setDisplaySize(260, 130);

    this.player = new Player(this, 750, 670).setFlipX(true);

    this.wife = this.add.image(1000, 660, "wife");
    this.wife.setDisplaySize(256, 256);

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
      this.wife.y - 180,
      "Don't forget your code!"
    );

    this.time.delayedCall(3000, () => {
      this.dialogBox.show(
        this.player.x,
        this.player.y - 180,
        "I won't, honey!"
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

    this.dialogBox.show(this.player.x, this.player.y - 180, "Bye bye!");

    this.time.delayedCall(2000, () => {
      this.dialogBox.show(this.wife.x, this.wife.y - 180, "Good luck!");

      this.time.delayedCall(2000, () => {
        this.dialogBox.hide();
        this.completeIntro();
      });
    });
  }

  private async completeIntro() {
    if (!this.savedProgress) return;

    const updatedPayload = {
      userId: this.savedProgress.userId,
      lastLocation: "/game",
      gameState: {
        currentScene: "CarDriveScene",
        eventFlags: {
          ...this.savedProgress.gameState?.eventFlags,
          introCompleted: true,
        },
        currentTask: { taskType: "none", status: "none" },
      },
    };

    try {
      const response = await fetch("/api/game-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });

      const newProgress = await response.json();
      this.savedProgress = newProgress;
    } catch (e) {
      console.error("Failed to save intro progress:", e);
    }

    // Transition Logic
    AudioManager.getInstance().stopMusic();
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start("CarDriveScene", this.savedProgress);
      }
    );
  }
}
