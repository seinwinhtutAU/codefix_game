import Phaser from "phaser";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox";
import { IGameProgress } from "@/lib/types";
import GameScene from "./GameScene";

export default class CarDriveScene extends GameScene {
  // --- ASSETS ---
  private car!: Phaser.GameObjects.Sprite;
  private worldContainer!: Phaser.GameObjects.Container;
  private policeCar!: Phaser.GameObjects.Sprite;

  // --- UI ---
  private dialogBox!: DialogBox;
  private solveButtonContainer!: Phaser.GameObjects.Container;

  // --- INPUTS ---
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyD!: Phaser.Input.Keyboard.Key;

  // --- CONFIG ---
  private readonly SCREEN_WIDTH = 1376;
  private readonly SCREEN_HEIGHT = 768;
  private scrollSpeed: number = 10;
  private readonly OFFICE_X_TARGET = -6500; // Middle of City 4

  // --- GAME STATE ---
  private isDriving: boolean = true;
  private eventTriggered: boolean = false;
  private hasReachedOffice: boolean = false;
  private sirenSound!: Phaser.Sound.BaseSound;

  constructor() {
    super("CarDriveScene");
  }

  preload() {}

  create() {
    super.create();
    AudioManager.getInstance().init(this.game);
    this.sirenSound = this.sound.add("siren", { volume: 0.3, loop: true });

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    this.setupWorld();
    this.setupCars();
    this.dialogBox = new DialogBox(this);
    this.createSolveButton();

    this.checkStoryProgress();
    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  private setupWorld() {
    this.worldContainer = this.add.container(0, 0);

    if (this.savedProgress?.gameState?.eventFlags?.policeStoppedPlayer) {
      this.worldContainer.x = -2200;

      this.eventTriggered = true;
    }

    const bgNames = ["city_1", "city_2", "city_3", "city_4", "city_5"];
    bgNames.forEach((name, index) => {
      // Each background is 2000px wide
      const bg = this.add.image(index * 2000, 0, name).setOrigin(0, 0);
      this.worldContainer.add(bg);
    });
  }

  private setupCars() {
    this.car = this.add.sprite(400, 670, "car");
    this.car.setDisplaySize(260, 130);
    this.tweens.add({
      targets: this.car,
      y: 671,
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.policeCar = this.add.sprite(-300, 670, "police_car");
    this.policeCar.setDisplaySize(260, 130);
  }

  private checkStoryProgress() {
    if (this.savedProgress?.gameState) {
      const { eventFlags, currentTask } = this.savedProgress.gameState;

      // If they already arrived at the office in a previous session
      if (eventFlags.arrivedAtOffice) {
        this.scene.start("OfficeScene", this.savedProgress);
        return;
      }

      if (eventFlags.policeStoppedPlayer) {
        if (currentTask.status === "completed") {
          this.handlePoliceSuccess();
        } else {
          this.setupPoliceStandby();
        }
        return;
      }
    }
    AudioManager.getInstance().playMusic("drive-bgm", {
      loop: true,
      volume: 0.15,
    });
  }

  update() {
    if (!this.isDriving) return;

    if (this.cursors.right.isDown || this.keyD.isDown) {
      this.worldContainer.x -= this.scrollSpeed;

      // 1. Check for Police Trigger (End of City 1)
      const triggerWorldX = 2000 + 2000 / 3;
      const currentTriggerScreenX = triggerWorldX + this.worldContainer.x;
      if (!this.eventTriggered && currentTriggerScreenX < 400) {
        this.triggerPoliceEvent();
      }

      // 2. Check for Office Arrival (Middle of City 4)
      if (
        !this.hasReachedOffice &&
        this.worldContainer.x <= this.OFFICE_X_TARGET
      ) {
        this.handleArrivalAtOffice();
      }
    }
  }

  /* =====================================================
     Office Arrival Logic
  ===================================================== */

  private async handleArrivalAtOffice() {
    this.hasReachedOffice = true;
    this.isDriving = false;

    // Show Dialogue
    this.dialogBox.show(
      this.car.x,
      this.car.y - 150,
      "The office! I finally made it."
    );

    // SAVE PROGRESS: Mark arrivedAtOffice as true
    await this.updateProgress({
      lastLocation: "/game",
      gameState: {
        currentScene: "OfficeScene",
        eventFlags: {
          ...this.savedProgress?.gameState?.eventFlags,
          arrivedAtOffice: true,
        },
        currentTask: { taskType: "none", status: "none" }, // Clear the police task
      },
    });

    this.time.delayedCall(3000, () => {
      this.dialogBox.setVisible(false); // Clean up UI
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      AudioManager.getInstance().stopMusic();
      this.cameras.main.once("camerafadeoutcomplete", () => {
        if (this.savedProgress) {
          this.scene.start("OfficeScene", this.savedProgress);
        } else {
          this.scene.start("OfficeScene");
        }
      });
    });
  }

  /* =====================================================
     Police Event Logic
  ===================================================== */

  private triggerPoliceEvent() {
    this.eventTriggered = true;
    this.isDriving = false;
    AudioManager.getInstance().stopMusic();
    this.sirenSound.play();

    this.tweens.add({
      targets: this.policeCar,
      x: 100,
      duration: 1500,
      ease: "Power2",
      onComplete: () => {
        this.sirenSound.stop();
        this.startDialogSequence();
      },
    });
  }

  private handlePoliceSuccess() {
    this.isDriving = false;
    this.eventTriggered = true;
    this.car.setPosition(400, 670);
    this.policeCar.setPosition(100, 670);

    this.dialogBox.show(
      this.policeCar.x + 50,
      this.policeCar.y - 150,
      "Excellent work. You're free to go!"
    );

    this.time.delayedCall(3000, () => {
      this.dialogBox.setVisible(false); // Fix: Hide dialog
      this.tweens.add({
        targets: this.policeCar,
        x: -400,
        duration: 2000,
        ease: "Power2",
        onComplete: () => {
          this.isDriving = true;
          AudioManager.getInstance().playMusic("drive-bgm", {
            loop: true,
            volume: 0.15,
          });
        },
      });
    });
  }

  private setupPoliceStandby() {
    this.isDriving = false;
    this.eventTriggered = true;
    this.car.setPosition(400, 670);
    this.policeCar.setPosition(100, 670);
    this.showSolveButton();
  }

  private startDialogSequence() {
    this.dialogBox.show(
      this.policeCar.x + 50,
      this.policeCar.y - 150,
      "HALT! You ran a red light!"
    );
    this.time.delayedCall(3000, () => {
      this.dialogBox.show(
        this.car.x,
        this.car.y - 150,
        "Sorry! I was in a hurry."
      );
      this.time.delayedCall(3000, () => {
        this.dialogBox.show(
          this.policeCar.x + 50,
          this.policeCar.y - 150,
          "Your penalty: Solve this code!"
        );
        this.time.delayedCall(1500, () => this.showSolveButton());
      });
    });
  }

  /* =====================================================
     Database & UI Helpers
  ===================================================== */

  private createSolveButton() {
    this.solveButtonContainer = this.add.container(
      this.SCREEN_WIDTH / 2,
      this.SCREEN_HEIGHT / 2
    );
    this.solveButtonContainer.setVisible(false).setDepth(100);

    const bg = this.add
      .graphics()
      .fillStyle(0x000044, 1)
      .lineStyle(4, 0x00ff00, 1);
    bg.fillRoundedRect(-120, -30, 240, 60, 15).strokeRoundedRect(
      -120,
      -30,
      240,
      60,
      15
    );

    const text = this.add
      .text(0, 0, "SOLVE CODE >", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "20px",
        color: "#00ff00",
      })
      .setOrigin(0.5);

    const hitArea = this.add
      .zone(0, 0, 240, 60)
      .setInteractive({ useHandCursor: true });

    hitArea.on("pointerdown", async () => {
      AudioManager.getInstance().playSound("speech-blip", { volume: 1.0 });

      // Save that the police stopped them before leaving
      await this.updateProgress({
        lastLocation: "/game",
        gameState: {
          currentScene: "CarDriveScene",
          eventFlags: {
            ...this.savedProgress?.gameState?.eventFlags,
            policeStoppedPlayer: true,
          },
          currentTask: {
            taskType: "code_problem",
            taskId: "69582fb37538b18589a46564",
            status: "in_progress",
          },
        },
      });

      window.location.href = "/problem/69582fb37538b18589a46564";
    });

    this.solveButtonContainer.add([bg, text, hitArea]);
  }

  // Unified helper to send data to your Next.js API
  private async updateProgress(payload: Partial<IGameProgress>) {
    if (!this.savedProgress) return;

    try {
      const response = await fetch("/api/game-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.savedProgress.userId,
          ...payload,
        }),
      });
      // Update local copy so we have latest flags
      const updatedData = await response.json();
      this.savedProgress = updatedData;
    } catch (e) {
      console.error("Database Save Error:", e);
    }
  }

  private showSolveButton() {
    this.solveButtonContainer.setVisible(true).setScale(0);
    this.tweens.add({
      targets: this.solveButtonContainer,
      scale: 1,
      duration: 300,
      ease: "Back.out",
    });
  }
}
