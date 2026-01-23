import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import DialogBox from "../ui/DialogBox";
import { EventBus } from "@/game/events";
import { IGameProgress } from "@/lib/types";

export default class HomeScene extends GameScene {
  private dialogBox!: DialogBox;

  constructor() {
    super("HomeScene");
  }

  preload() {
    this.load.image("medium_home", "/medium/home.png");
  }

  create() {
    if (this.savedProgress?.gameState?.eventFlags?.mediumIntroCompleted) {
      this.scene.start("PlayGroundScene", this.savedProgress);
      return;
    }

    super.create();
    this.initAudio();

    // 1. Setup Background
    this.add.image(0, 0, "medium_home").setOrigin(0, 0);

    // 2. Setup UI
    this.dialogBox = new DialogBox(this);

    // 3. Start Story
    this.time.delayedCall(1000, () => {
      this.startFamilyConversation();
    });
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }

  private startFamilyConversation() {
    // Approximate positions based on your image
    const motherX = 350; // Left (Pink hat)
    const motherY = 550;

    const fatherX = 520; // Center-Left (Black hat)
    const fatherY = 350;

    const boyX = 1000; // Center-Right (Blue cap)
    const boyY = 450;

    const girlX = 1100; // Right (Pink bow)
    const girlY = 580;

    // --- DIALOGUE SEQUENCE ---

    // 1. Father (Announcing arrival)
    this.dialogBox.show(
      fatherX,
      fatherY,
      "I'm back! The city code is finally stable.",
    );

    this.time.delayedCall(3000, () => {
      // 2. Mother (Greeting)
      this.dialogBox.show(
        motherX,
        motherY,
        "Welcome home, dear! We missed you.",
      );

      this.time.delayedCall(3000, () => {
        // 3. Boy (Curious)
        this.dialogBox.show(boyX, boyY, "Dad! Did you fix the big bug?");

        this.time.delayedCall(3000, () => {
          // 4. Father (Reassuring)
          this.dialogBox.show(
            fatherX,
            fatherY,
            "Yes I did. And now, I'm all yours.",
          );

          this.time.delayedCall(3000, () => {
            // 5. Father (The Plan) - CHANGED TO AMUSEMENT PARK
            this.dialogBox.show(
              fatherX,
              fatherY,
              "It's a beautiful day. Let's go to the Amusement Park!",
            );

            this.time.delayedCall(3500, () => {
              // 6. Girl (Excitement) - CHANGED TO ROLLER COASTER
              this.dialogBox.show(
                girlX,
                girlY,
                "Yay! I want to ride the roller coaster!",
              );

              this.time.delayedCall(2500, () => {
                // 7. Boy (Ready)
                this.dialogBox.show(boyX, boyY, "Let's go right now!");

                this.time.delayedCall(2000, () => {
                  this.handleSceneComplete();
                });
              });
            });
          });
        });
      });
    });
  }

  private async handleSceneComplete() {
    this.dialogBox.hide();
    await this.emitHomeCompleted();

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
          mediumIntroCompleted: true,
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
