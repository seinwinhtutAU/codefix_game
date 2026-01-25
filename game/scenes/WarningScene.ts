import Button from "../ui/Button";
import DialogBox from "../ui/DialogBox";
import GameScene from "./GameScene";
import AudioManager from "../AudioManager";
import { IGameProgress } from "@/lib/types";
import { EventBus } from "../events";

export default class WarningScene extends GameScene {
  private dialogBox!: DialogBox;
  private warningImg!: Phaser.GameObjects.Image;
  private statusText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Rectangle;

  private readonly storyMessages: string[] = [
    "Wait—something’s wrong! The system is breaking!!",
    "Security has failed. Bugs are spreading everywhere!",
    "I need to reach 5 unstable nodes and fix them one by one.",
    "It’s dangerous, but restoring the system is the only way forward.",
    "No more waiting. I have to fix this now. Let’s go!",
  ];

  constructor() {
    super("WarningScene");
  }

  create() {
    super.create();

    // --- Background (NO alpha here) ---
    this.add.image(0, 0, "warning-bg").setOrigin(0, 0);

    // --- Dark overlay (safe for characters) ---
    this.overlay = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x000000,
        0.45,
      )
      .setDepth(5);

    // Subtle pulse for tension
    this.tweens.add({
      targets: this.overlay,
      alpha: { from: 0.35, to: 0.55 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // --- Dialog box ---
    this.dialogBox = new DialogBox(this);

    // --- Audio ---
    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playSound("warning", {
      volume: 0.3,
      loop: false,
    });

    // --- Warning Icon ---
    this.warningImg = this.add
      .image(this.scale.width / 2, this.scale.height / 2 - 120, "boss-warning")
      .setOrigin(0.5)
      .setScale(0)
      .setDepth(10);

    // --- Status Text ---
    this.statusText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 + 100,
        "SYSTEM_CORRUPTION: 87%",
        {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "20px",
          color: "#ffff00",
        },
      )
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);

    // --- Entrance animation ---
    this.tweens.add({
      targets: this.warningImg,
      scale: 1.2,
      duration: 600,
      ease: "Back.easeOut",
      onComplete: () => {
        // Pulse icon + status
        this.tweens.add({
          targets: [this.warningImg, this.statusText],
          alpha: { from: 1, to: 0.4 },
          duration: 500,
          yoyo: true,
          repeat: -1,
        });

        this.statusText.setAlpha(1);
        this.runWarningSequence();
      },
    });
  }

  private runWarningSequence() {
    const x = 175;
    const y = 480;

    this.dialogBox.show(x, y, this.storyMessages[0]);
    this.cameras.main.shake(300, 0.005);
    this.statusText.setText("ANALYZING_BREACH...");

    this.time.delayedCall(3500, () => {
      this.dialogBox.show(x, y, this.storyMessages[1]);
      this.cameras.main.shake(300, 0.005);
      this.statusText.setText("CRITICAL_FAILURE: SECTOR_7");

      this.time.delayedCall(3500, () => {
        this.dialogBox.show(x, y, this.storyMessages[2]);
        this.statusText.setText("NODES_OFFLINE: 5/5");

        this.time.delayedCall(3500, () => {
          this.dialogBox.show(x, y, this.storyMessages[3]);
          this.statusText.setText("RECOVERY_PROTOCOL_READY");

          this.time.delayedCall(3500, () => {
            this.dialogBox.show(x, y, this.storyMessages[4]);
            this.statusText.setText("MANUAL_OVERRIDE_REQUIRED");

            this.time.delayedCall(2500, () => {
              this.showRepairButton();
            });
          });
        });
      });
    });
  }

  private showRepairButton() {
    const btn = new Button(this, {
      x: this.scale.width / 2,
      y: 600,
      width: 320,
      text: "REPAIR",
      color: 0xff0000,
      textStyle: {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "18px",
        color: "#ffffff",
      },
      onClick: () => {
        AudioManager.getInstance().playSound("click", { volume: 0.5 });
        this.handleExit();
      },
    });

    btn.setDepth(10);
    btn.setAlpha(0);

    this.tweens.add({
      targets: btn,
      alpha: 1,
      duration: 300,
    });
  }

  private handleExit() {
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        AudioManager.getInstance().stopMusic();
        this.emitWarningCompleted(this.savedProgress);
        this.scene.start("BossLevelScene", this.savedProgress);
      },
    );
  }

  private emitWarningCompleted(progress: IGameProgress) {
    if (!progress) return;

    EventBus.emit("progress-updated", {
      ...progress,
      gameState: {
        ...progress.gameState,
        currentScene: "BossLevelScene",
        eventFlags: {
          ...progress.gameState.eventFlags,
          warningCompleted: true,
        },
      },
    });
  }
}
