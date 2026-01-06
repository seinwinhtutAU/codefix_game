import Phaser from "phaser";
import GameScene from "./GameScene";
import DialogBox from "../ui/DialogBox";
import AudioManager from "../AudioManager";

export default class OfficeScene extends GameScene {
  private dialogBox!: DialogBox;
  private nextButton!: Phaser.GameObjects.Text;
  private bg!: Phaser.GameObjects.Image;

  constructor() {
    super("OfficeScene");
  }

  preload() {}

  create() {
    super.create();

    // Check if level is already completed if you want to skip
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

    this.nextButton = this.add
      .text(width - 200, height - 100, "Next >", {
        // Changed text to be more thematic
        fontSize: "24px",
        fontFamily: '"Press Start 2P", monospace',
        color: "#ffffffff",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 },
      })
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .on("pointerdown", () => {
        this.completeOffice(); // Call the save logic here
      });

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.time.delayedCall(1000, () => {
      this.runOfficeSequence();
    });
  }

  private runOfficeSequence() {
    const { width, height } = this.scale;

    this.dialogBox.show(
      width / 2,
      height / 2 - 150,
      "Ugh, another bug in the production branch..."
    );

    this.time.delayedCall(3500, () => {
      this.dialogBox.show(
        width / 2,
        height / 2 - 150,
        "Wait... these logic errors look like they were planted here on purpose."
      );

      this.time.delayedCall(4000, () => {
        this.dialogBox.show(
          width / 2,
          height / 2 - 150,
          "Time to dive into the source code and clean this mess up."
        );

        this.time.delayedCall(3000, () => {
          this.dialogBox.hide();
          this.nextButton.setVisible(true);
          this.tweens.add({
            targets: this.nextButton,
            scale: { from: 0.8, to: 1 },
            duration: 200,
            ease: "Back.out",
          });
        });
      });
    });
  }

  // --- SAVE PROGRESS TO DATABASE ---
  private async completeOffice() {
    this.nextButton.disableInteractive();
    AudioManager.getInstance().playSound("click", { volume: 0.5 });

    if (!this.savedProgress) {
      // Fallback if no progress object exists
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

    console.log(
      "OfficeScene saving payload: ",
      JSON.stringify(updatedPayload, null, 2)
    );

    try {
      const response = await fetch("/api/game-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });

      const newProgress = await response.json();
      this.savedProgress = newProgress; // Update local memory
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
        // Pass the updated progress to the next scene
        this.scene.start("EasyLevelScene", this.savedProgress ?? undefined);
      }
    );
  }
}
