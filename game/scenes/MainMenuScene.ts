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

    // --- LEVEL SELECT BUTTON ---
    const level = new Button(this, {
      x: width / 2,
      y: height / 2 + 110,
      width: 240,
      height: 60,
      text: "LEVELS",
      color: 0x4a90e2,
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
    else if (flags?.hardLevelCompleted)
      this.scene.start("WarningScene", this.savedProgress);
    else if (flags?.playgroundCompleted)
      this.scene.start("MediumLevelScene", this.savedProgress);
    else if (flags?.hardIntroCompleted)
      this.scene.start("PlayGroundScene", this.savedProgress);
    else if (flags?.mediumLevelCompleted)
      this.scene.start("HomeScene", this.savedProgress);
    else if (flags?.officeCompleted)
      this.scene.start("MediumLevelScene", this.savedProgress);
    else if (flags?.arrivedAtOffice)
      this.scene.start("OfficeScene", this.savedProgress);
    else this.scene.start("CarDriveScene", this.savedProgress);
  }
}
