import Phaser from "phaser";
import GameScene from "./GameScene";
import DialogBox from "../ui/DialogBox";
import Button from "../ui/Button"; // Import your custom Button class
import AudioManager from "../AudioManager";

export default class OfficeScene extends GameScene {
  private dialogBox!: DialogBox;
  private nextButton!: Button; // Changed type to Button
  private bg!: Phaser.GameObjects.Image;

  constructor() {
    super("OfficeScene");
  }

  create() {
    super.create();

    if (this.savedProgress?.gameState?.eventFlags?.officeCompleted) {
      this.scene.start("EasyLevelScene", this.savedProgress);
      return;
    }

    const { width, height } = this.scale;
    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("menu-bgm", {
      loop: true,
      volume: 0.15,
    });

    this.bg = this.add.image(width / 2, height / 2, "office-bg");
    this.bg.setDisplaySize(width, height);

    this.dialogBox = new DialogBox(this);

    // --- Standardized Button Implementation ---
    this.nextButton = new Button(this, {
      x: width - 150,
      y: height - 100,
      text: "NEXT >",
      color: 0x2ecc71, // Consistent green theme
      onClick: () => {
        this.completeOffice();
      },
    });

    this.nextButton.setVisible(false).setAlpha(0);

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.time.delayedCall(1000, () => {
      this.runOfficeSequence();
    });
  }

  private runOfficeSequence() {
    const { width, height } = this.scale;

    const dialogWidth = width / 2 + 250;
    const dialogHeight = height / 2 - 200;

    this.dialogBox.show(
      dialogWidth,
      dialogHeight,
      "Almost done... Just a few more lines and I can finally head home to the kids.",
    );

    this.time.delayedCall(3500, () => {
      this.dialogBox.show(
        dialogWidth,
        dialogHeight,
        "Wait... what happened? The bug report just exploded. These aren't just simple errors...",
      );

      this.time.delayedCall(4000, () => {
        this.dialogBox.show(
          dialogWidth,
          dialogHeight,
          "This is bad😥. There are too many tasks to fix here. I might be late unless I solve them fast...",
        );

        // Show and animate the button after the final dialogue
        this.nextButton.setVisible(true);
        this.tweens.add({
          targets: this.nextButton,
          alpha: 1,
          duration: 500,
          onComplete: () => {
            // Pulse effect to urge the player to click
            this.tweens.add({
              targets: this.nextButton,
              scale: 1.05,
              duration: 800,
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            });
          },
        });
      });
    });
  }

  private async completeOffice() {
    // Standardized way to disable click through the Button class
    this.nextButton.setEnabled(false);

    AudioManager.getInstance().playSound("click", { volume: 0.5 });

    if (!this.savedProgress) {
      this.handleTransition();
      return;
    }

    const updatedPayload = {
      userId: this.savedProgress.userId,
      lastLocation: "/game",
      gameState: {
        currentScene: "EasyLevelScene",
        eventFlags: {
          ...this.savedProgress.gameState?.eventFlags,
          officeCompleted: true,
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
      console.error("Failed to save office progress:", e);
    }

    this.handleTransition();
  }

  private handleTransition() {
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        AudioManager.getInstance().stopMusic();
        this.scene.start("EasyLevelScene", this.savedProgress ?? undefined);
      },
    );
  }
}
