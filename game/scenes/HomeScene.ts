import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import DialogBox from "../ui/DialogBox";
import Button from "../ui/Button"; // Your standardized Button class
import { EventBus } from "@/game/events";
import SkipButton from "../ui/SkipButton";

export default class HomeScene extends GameScene {
  private dialogBox!: DialogBox;
  private nextButton!: Button;
  private skipButton!: SkipButton;

  constructor() {
    super("HomeScene");
  }

  create() {
    // Immediate transition if already completed
    if (this.savedProgress?.gameState?.eventFlags?.hardIntroCompleted) {
      this.scene.start("PlayGroundScene", this.savedProgress);
      return;
    }

    super.create();
    this.initAudio();

    // 1. Setup Background
    this.add.image(0, 0, "hard_home").setDisplaySize(1376, 768).setOrigin(0, 0);

    // 2. Setup UI Components
    this.dialogBox = new DialogBox(this);

    // 3. Setup Next Button (Bottom Right)
    // We create it now but keep it hidden/disabled during dialogue
    this.nextButton = new Button(this, {
      x: 1250,
      y: 700,
      text: "Next >>",
      width: 165,
      height: 55,
      color: 0x4a90e2,
      onClick: () => {
        this.handleSceneComplete();
      },
    });

    this.nextButton.setVisible(false);
    this.nextButton.setAlpha(0);

    this.createSkipButton();

    // 4. Start Story Sequence
    this.time.delayedCall(1000, () => {
      this.startDayIntroduction();
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      console.log(
        `Clicked Position - X: ${Math.round(pointer.x)}, Y: ${Math.round(pointer.y)}`,
      );
    });
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }

  private startFamilyConversation() {
    const motherX = 510;
    const motherY = 430;
    const fatherX = 620;
    const fatherY = 320;
    const boyX = 860;
    const boyY = 380;
    const girlX = 980;
    const girlY = 450;

    this.dialogBox.show(fatherX, fatherY, "Work’s done. I’m finally home. 😌");

    this.time.delayedCall(3000, () => {
      this.dialogBox.show(
        motherX,
        motherY,
        "Welcome home! You look exhausted.",
      );

      this.time.delayedCall(3000, () => {
        this.dialogBox.show(
          fatherX,
          fatherY,
          "Yeah… but today is all about family.",
        );

        this.time.delayedCall(3000, () => {
          this.dialogBox.show(
            boyX,
            boyY,
            "Does that mean we’re going out today?",
          );

          this.time.delayedCall(3000, () => {
            this.dialogBox.show(
              fatherX,
              fatherY,
              "Exactly. How about the amusement park?",
            );

            this.time.delayedCall(3500, () => {
              this.dialogBox.show(
                girlX,
                girlY,
                "Yay! I want to ride the roller coaster! 🎢",
              );

              this.time.delayedCall(2500, () => {
                this.dialogBox.show(
                  boyX,
                  boyY,
                  "And I want to play all the games!",
                );

                this.time.delayedCall(1000, () => {
                  this.revealNextButton();
                });
              });
            });
          });
        });
      });
    });
  }

  private startDayIntroduction() {
    const bg = this.add.rectangle(
      this.scale.width / 2,
      60,
      this.scale.width,
      150,
      0x000000,
      0.35, // transparency
    );

    const introText = this.add
      .text(
        this.scale.width / 2,
        60,
        "A new day begins...\nAfter a long day of work, it’s finally time to relax.",
        {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#f0f0f0",
          align: "center",
          lineSpacing: 6,
          wordWrap: { width: this.scale.width - 100 },
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: introText,
      alpha: 1,
      duration: 800,
      ease: "Sine.easeOut",
    });

    this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets: introText,
        alpha: 0,
        duration: 400,
        ease: "Sine.easeIn",
        onComplete: () => {
          introText.setText(
            "Today is special.\nIt’s time to spend the day together at the amusement park! 🎡",
          );

          // Fade in new text
          this.tweens.add({
            targets: introText,
            alpha: 1,
            duration: 500,
            ease: "Sine.easeOut",
          });
        },
      });
    });

    this.time.delayedCall(7000, () => {
      this.tweens.add({
        targets: [introText, bg],
        alpha: 0,
        duration: 600,
        ease: "Sine.easeIn",
        onComplete: () => {
          introText.destroy();
          bg.destroy();
          this.startFamilyConversation();
        },
      });
    });
  }

  private revealNextButton() {
    this.nextButton.setVisible(true);
    this.tweens.add({
      targets: this.nextButton,
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });
  }

  private createSkipButton() {
    this.skipButton = new SkipButton(this, {
      onClick: () => {
        if (this.skipButton) this.skipButton.setEnabled(false);
        this.time.removeAllEvents();
        this.dialogBox.hide();
        this.handleSceneComplete();
      },
    });
  }

  private async handleSceneComplete() {
    // Prevent double-clicking
    this.nextButton.setEnabled(false);

    this.dialogBox.hide();
    await this.emitHomeCompleted();

    // Transition effect
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("PlayGroundScene", this.savedProgress);
    });
  }

  private async emitHomeCompleted() {
    if (!this.savedProgress) return;

    const progress = this.savedProgress;

    EventBus.emit("progress-updated", {
      ...progress,
      gameState: {
        currentScene: "HomeScene",
        eventFlags: {
          ...progress.gameState.eventFlags,
          hardIntroCompleted: true,
        },
        currentTask: {
          taskType: "none",
          taskId: undefined,
          status: "none",
          attempts: 0,
          timer: 0,
          currentActiveIndex: 0,
          highestHintLevelUsed: "none",
          hintUsages: [],
        },
      },
      bugCounts: [],
    });
  }
}
