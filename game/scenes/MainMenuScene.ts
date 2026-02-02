import AudioManager from "../AudioManager";
import { EventBus } from "../events";
import GameScene from "./GameScene";
import Button from "../ui/Button";

export default class MainMenuScene extends GameScene {
  constructor() {
    super("MainMenuScene");
  }

  create() {
    super.create();

    console.log(
      "Main Menu Scene Progress: ",
      JSON.stringify(this.savedProgress, null, 2),
    );

    // Smooth entry
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    const { width, height } = this.cameras.main;

    // Background Layer
    this.add.image(width / 2, height / 2, "menu-bg");

    // Audio Setup
    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("bgm", { loop: true, volume: 0.15 });

    // // --- GAME TITLE ---
    // const title = this.add
    //   .text(width / 2, height / 2 - 140, "GO GOAL", {
    //     fontFamily: "Gluten",
    //     fontSize: "84px",
    //     color: "#FF85A1",
    //   })
    //   .setOrigin(0.5)
    //   .setStroke("#FFF", 12);

    // // Subtle floating animation
    // this.tweens.add({
    //   targets: title,
    //   y: height / 2 - 160,
    //   duration: 2000,
    //   ease: "Sine.easeInOut",
    //   yoyo: true,
    //   repeat: -1,
    // });

    // --- PROGRESS LOGIC ---
    const isIntroDone =
      this.savedProgress?.gameState?.eventFlags?.introCompleted;
    const buttonLabel = isIntroDone ? "CONTINUE" : "START";

    // --- MAIN ACTION BUTTON ---
    const start = new Button(this, {
      x: width / 2,
      y: height / 2 + 30,
      width: 240,
      height: 60,
      text: buttonLabel,
      color: 0x4a90e2,
      textStyle: {
        fontFamily: "Gluten",
        fontSize: "24px",
        color: "#ffffff",
      },
      onClick: () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.handleGameStart(isIntroDone);
        });
      },
    });

    // --- NEW: LEVEL SELECT BUTTON ---
    // Positioned below the main button
    const level = new Button(this, {
      x: width / 2,
      y: height / 2 + 110,
      width: 240,
      height: 60,
      text: "LEVELS",
      color: 0x4a90e2, // Softer pink for secondary action
      textStyle: {
        fontFamily: "Gluten",
        fontSize: "24px",
        color: "#ffffff",
      },
      onClick: () => {
        AudioManager.getInstance().playSound("click");
        this.scene.start("LevelScene", this.savedProgress);
      },
    });

    // --- DATA MANAGEMENT ---
    if (isIntroDone) {
      const resetText = this.add
        .text(width / 2, height - 60, "Reset Progress", {
          fontFamily: "Gluten",
          fontSize: "16px",
          color: "#8B5E66",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.6);

      resetText.on("pointerdown", () => this.handleResetData());
      resetText.on("pointerover", () =>
        resetText.setAlpha(1).setColor("#ff0000"),
      );
      resetText.on("pointerout", () =>
        resetText.setAlpha(0.6).setColor("#8B5E66"),
      );
    }
  }

  private handleGameStart(isIntroDone: boolean) {
    AudioManager.getInstance().stopMusic();

    if (!isIntroDone) {
      this.scene.start("IntroScene", this.savedProgress ?? undefined);
      return;
    }

    const flags = this.savedProgress?.gameState?.eventFlags;

    if (flags?.bossLevelCompleted)
      this.scene.start("BossLevelScene", this.savedProgress);
    else if (flags?.warningCompleted)
      this.scene.start("BossLevelScene", this.savedProgress);
    else if (flags?.mediumLevelCompleted)
      this.scene.start("WarningScene", this.savedProgress);
    else if (flags?.playgroundCompleted)
      this.scene.start("MediumLevelScene", this.savedProgress);
    else if (flags?.mediumIntroCompleted)
      this.scene.start("PlayGroundScene", this.savedProgress);
    else if (flags?.easyLevelCompleted)
      this.scene.start("HomeScene", this.savedProgress);
    else if (flags?.officeCompleted)
      this.scene.start("EasyLevelScene", this.savedProgress);
    else if (flags?.arrivedAtOffice)
      this.scene.start("OfficeScene", this.savedProgress);
    else this.scene.start("CarDriveScene", this.savedProgress);
  }

  private async handleResetData() {
    if (
      window.confirm(
        "Warning: This will permanently delete your story progress and code solutions!",
      )
    ) {
      EventBus.emit("ui-reset-start");
      try {
        const uid = this.savedProgress.userId;
        await Promise.all([
          fetch(`/api/game-progress?userId=${uid}`, { method: "DELETE" }),
          fetch(`/api/code/${uid}`, { method: "DELETE" }),
          fetch(`/api/solve-record?userId=${uid}`, { method: "DELETE" }),
        ]);
        window.location.reload();
      } catch (e) {
        console.error("Failed to reset game data:", e);
      }
    }
  }
}
