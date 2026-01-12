import AudioManager from "../AudioManager";
import { EventBus } from "../events";
import GameScene from "./GameScene";

export default class MainMenuScene extends GameScene {
  constructor() {
    super("MainMenuScene");
  }

  create() {
    super.create();

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    const { width, height } = this.cameras.main;

    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("bgm", { loop: true, volume: 0.15 });

    // Title
    this.add
      .text(width / 2, height / 2 - 100, "MY AWESOME GAME", {
        fontFamily: '"Press Start 2P", monospace', // Optional: Retro font
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    console.log("MainMenuScene: ", JSON.stringify(this.savedProgress, null, 2));

    // 2. LOGIC: Determine button text based on event flags
    const isIntroDone =
      this.savedProgress?.gameState?.eventFlags?.introCompleted;
    const buttonText = isIntroDone ? "CONTINUE GAME" : "START NEW GAME";

    // Start / Continue Button
    const startButton = this.add
      .text(width / 2, height / 2 + 50, buttonText, {
        fontSize: "32px",
        color: "#00ff00",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => {
      AudioManager.getInstance().playSound("click", { volume: 0.5 });
      AudioManager.getInstance().stopMusic();

      // 3. LOGIC: Redirect based on progress
      if (!isIntroDone) {
        // Brand new player or intro not finished
        this.scene.start("IntroScene", this.savedProgress ?? undefined);
      } else {
        if (this.savedProgress?.gameState?.eventFlags?.officeCompleted) {
          this.scene.start("EasyLevelScene", this.savedProgress);
        } else if (this.savedProgress?.gameState?.eventFlags?.arrivedAtOffice) {
          this.scene.start("OfficeScene", this.savedProgress);
        } else if (
          this.savedProgress?.gameState?.eventFlags?.policeStoppedPlayer ||
          isIntroDone
        ) {
          this.scene.start("CarDriveScene", this.savedProgress ?? undefined);
        }
      }
    });

    // Hover Effects
    startButton.on("pointerover", () => startButton.setScale(1.1));
    startButton.on("pointerout", () => startButton.setScale(1));

    // Inside create() method of MainMenuScene
    if (isIntroDone) {
      const resetText = this.add
        .text(width / 2, height - 50, "RESET DATA", {
          fontSize: "16px",
          color: "#ff0000",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      resetText.on("pointerdown", async () => {
        // 1. Confirm with the user
        const confirmReset = window.confirm(
          "Are you sure? This will delete all progress!"
        );

        if (confirmReset) {
          try {
            // 2. Call the DELETE method we added to the API
            const progressResponse = await fetch(
              `/api/game-progress?userId=${this.savedProgress.userId}`,
              {
                method: "DELETE",
              }
            );

            const userCodeResponse = await fetch(
              `/api/code/${this.savedProgress.userId}`,
              {
                method: "DELETE",
              }
            );

            const recordResponse = await fetch(
              `/api/solve-record?userId=${this.savedProgress.userId}`,
              {
                method: "DELETE",
              }
            );

            if (
              progressResponse.ok &&
              userCodeResponse.ok &&
              recordResponse.ok
            ) {
              EventBus.emit("ui-reset-start");

              // 3. Reset local memory and restart the engine
              // We redirect to IntroScene as if it's a brand new game
              AudioManager.getInstance().stopMusic();

              setTimeout(() => {
                window.location.reload();
              }, 100);
            }
          } catch (error) {
            console.error("Failed to delete progress:", error);
          }
        }
      });

      // Simple hover effect for the reset text
      resetText.on("pointerover", () => resetText.setColor("#ffffff"));
      resetText.on("pointerout", () => resetText.setColor("#ff0000"));
    }
  }
}
