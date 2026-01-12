import Phaser from "phaser";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox";
import { IGameProgress, CurrentTask } from "@/lib/types";
import GameScene from "./GameScene";
import { EventBus } from "@/game/events";
import { checkExistingSolveRecord } from "@/services";

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
  private readonly OFFICE_X_TARGET = -6500;
  private readonly POLICE_TRIGGER_X = -2666;

  // --- GAME STATE ---
  private isDriving: boolean = true;
  private eventTriggered: boolean = false;
  private hasReachedOffice: boolean = false;
  private sirenSound!: Phaser.Sound.BaseSound;
  private isSolved: boolean = false;

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

    // 1. Setup world first
    this.setupWorld();
    // 2. Setup cars
    this.setupCars();
    // 3. Setup UI
    this.dialogBox = new DialogBox(this);
    EventBus.on(
      "problem-update-progress",
      async (updatedProgress: IGameProgress) => {
        console.log("Syncing progress from UI update...");

        // Update the local scene's reference so 'this.savedProgress' is always fresh
        this.savedProgress = updatedProgress;

        // you might want to trigger the success animation immediately.
        const problemId = updatedProgress.gameState.currentTask.taskId;
        if (!problemId)
          return console.error(
            "taskId is undefined in progress. (CarDriveScene - EventBus.on(problem-update-progress))"
          );

        const solveRecord = await this.checkPointSolved(
          updatedProgress.userId,
          problemId
        );

        // if (updatedProgress.gameState.currentTask.status === "completed") {
        //   this.handlePoliceSuccess();
        // }

        this.isSolved = !!solveRecord;

        if (this.isSolved) {
          this.handlePoliceSuccess();
        }
      }
    );

    this.createSolveButton();

    // 4. Check progress
    this.checkStoryProgress();

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // ✅ CRITICAL FIX: Receive the full task object
    EventBus.on(
      "problem-solved",
      async (data: { currentTask: CurrentTask }) => {
        await this.updateProgress({
          gameState: {
            ...this.savedProgress?.gameState,
            currentTask: {
              taskType: data.currentTask.taskType,
              taskId: data.currentTask.taskId,
              status: data.currentTask.status ?? "none",
              attempts: data.currentTask.attempts,
              timer: data.currentTask.timer,
              highestHintLevelUsed: data.currentTask.highestHintLevelUsed,
            },
          },
        });
      }
    );

    EventBus.on("resume-after-solve", () => {
      this.handlePoliceSuccess();
    });

    AudioManager.getInstance().playMusic("bgm", {
      loop: true,
      volume: 0.15,
    });
  }

  private setupWorld() {
    this.worldContainer = this.add.container(0, 0);

    // If already stopped by police, teleport the background to the stop point
    if (this.savedProgress?.gameState?.eventFlags?.policeStoppedPlayer) {
      this.worldContainer.x = this.POLICE_TRIGGER_X;
      this.eventTriggered = true;
      this.isDriving = false; // Freeze movement immediately
    }

    const bgNames = ["city_1", "city_2", "city_3", "city_4", "city_5"];
    bgNames.forEach((name, index) => {
      const bg = this.add.image(index * 2000, 0, name).setOrigin(0, 0);
      this.worldContainer.add(bg);
    });
  }

  private async checkPointSolved(userId: string, problemId: string) {
    const response = await checkExistingSolveRecord(userId, problemId);
    return response?.data;
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

    // Determine police car starting position based on flag
    const isStopped =
      this.savedProgress?.gameState?.eventFlags?.policeStoppedPlayer;
    const policeInitialX = isStopped ? 100 : -300;

    this.policeCar = this.add.sprite(policeInitialX, 670, "police_car");
    this.policeCar.setDisplaySize(260, 130);
  }

  private checkStoryProgress() {
    if (this.savedProgress?.gameState) {
      const { eventFlags, currentTask } = this.savedProgress.gameState;

      if (eventFlags.arrivedAtOffice) {
        this.scene.start("OfficeScene", this.savedProgress);
        return;
      }

      if (eventFlags.policeStoppedPlayer) {
        this.isDriving = false;
        if (this.isSolved) {
          this.handlePoliceSuccess();
        } else {
          this.setupPoliceStandby();
        }
        return;
      }
    }
  }

  update() {
    if (!this.isDriving) return;

    if (this.cursors.right.isDown || this.keyD.isDown) {
      this.worldContainer.x -= this.scrollSpeed;

      // Check for Police Trigger
      const triggerWorldX = 2000 + 2000 / 3;
      const currentTriggerScreenX = triggerWorldX + this.worldContainer.x;
      if (!this.eventTriggered && currentTriggerScreenX < 400) {
        this.triggerPoliceEvent();
      }

      // Check for Office Arrival
      if (
        !this.hasReachedOffice &&
        this.worldContainer.x <= this.OFFICE_X_TARGET
      ) {
        this.handleArrivalAtOffice();
      }
    }
  }

  private async handleArrivalAtOffice() {
    this.hasReachedOffice = true;
    this.isDriving = false;

    this.dialogBox.show(
      this.car.x,
      this.car.y - 150,
      "The office! I finally made it."
    );

    await this.updateProgress({
      gameState: {
        currentScene: "OfficeScene",
        eventFlags: {
          ...this.savedProgress?.gameState?.eventFlags,
          arrivedAtOffice: true,
        },
        currentTask: {
          ...this.savedProgress?.gameState?.currentTask,
          taskType: "none",
          status: "none",
        },
      },
    });

    this.time.delayedCall(3000, () => {
      this.dialogBox.setVisible(false);
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      AudioManager.getInstance().stopMusic();
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("OfficeScene", this.savedProgress);
      });
    });
  }

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
    this.solveButtonContainer.setVisible(false);

    this.dialogBox.show(
      this.policeCar.x + 50,
      this.policeCar.y - 150,
      "Excellent work. You're free to go!"
    );

    this.time.delayedCall(3000, () => {
      this.dialogBox.setVisible(false);
      this.tweens.add({
        targets: this.policeCar,
        x: -400,
        duration: 2000,
        ease: "Power2",
        onComplete: () => {
          this.isDriving = true;
          AudioManager.getInstance().playMusic("bgm", {
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
    this.time.delayedCall(2000, () => {
      this.dialogBox.show(
        this.car.x,
        this.car.y - 150,
        "Sorry! I was in a hurry."
      );
      this.time.delayedCall(2000, () => {
        this.dialogBox.show(
          this.policeCar.x + 50,
          this.policeCar.y - 150,
          "Your penalty: Solve this code!"
        );
        this.time.delayedCall(1000, () => this.showSolveButton());
      });
    });
  }

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
      const targetTaskId = "69582fb37538b18589a46564";
      const existingTask = this.savedProgress?.gameState?.currentTask;
      const isSameTask = existingTask?.taskId === targetTaskId;

      const taskToSave = isSameTask
        ? { ...existingTask } // Keep current status/attempts/timer
        : {
            taskType: "code_problem",
            taskId: targetTaskId,
            status: "in_progress",
            attempts: 0,
            timer: 0,
          };

      const updatedProgress = {
        gameState: {
          ...this.savedProgress?.gameState,
          currentScene: "CarDriveScene",
          eventFlags: {
            ...this.savedProgress?.gameState?.eventFlags,
            policeStoppedPlayer: true,
          },
          currentTask: taskToSave,
        },
      };

      console.log(
        "CarDriveScene after click solved button: ",
        JSON.stringify(updatedProgress, null, 2)
      );

      // We initialize the task here in the DB before opening the UI
      await this.updateProgress({
        gameState: {
          ...this.savedProgress?.gameState,
          currentScene: "CarDriveScene",
          eventFlags: {
            ...this.savedProgress?.gameState?.eventFlags,
            policeStoppedPlayer: true,
          },
          currentTask: isSameTask
            ? { ...existingTask } // Keep current status/attempts/timer
            : {
                taskType: "code_problem",
                taskId: targetTaskId,
                status: "in_progress",
                attempts: 0,
                timer: 0,
                currentActiveIndex: 0,
                highestHintLevelUsed: "none",
              },
        },
      });

      // Open the overlay
      EventBus.emit("ui-open-problem", "69582fb37538b18589a46564");
    });

    this.solveButtonContainer.add([bg, text, hitArea]);
  }

  private async updateProgress(payload: Partial<IGameProgress>) {
    if (!this.savedProgress) return;
    try {
      const response = await fetch("/api/game-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this.savedProgress.userId, ...payload }),
      });
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
