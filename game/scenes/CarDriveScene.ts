import Phaser from "phaser";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox";
import Button from "../ui/Button";
import { IGameProgress } from "@/lib/types";
import GameScene from "./GameScene";
import { EventBus } from "@/game/events";
import { checkExistingSolveRecord } from "@/services";

export default class CarDriveScene extends GameScene {
  // --- ASSETS ---
  private car!: Phaser.GameObjects.Sprite;
  private worldContainer!: Phaser.GameObjects.Container;
  private policeCar!: Phaser.GameObjects.Sprite;
  private clouds: Phaser.GameObjects.Image[] = [];
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private shadow!: Phaser.GameObjects.Image;

  // --- UI ---
  private dialogBox!: DialogBox;
  private solveButton!: Button;

  // --- INPUTS ---
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyD!: Phaser.Input.Keyboard.Key;

  // --- CONFIG ---
  private readonly SCREEN_WIDTH = 1376;
  private readonly SCREEN_HEIGHT = 768;
  private scrollSpeed: number = 10;
  private readonly OFFICE_X_TARGET = -5500;
  private readonly POLICE_TRIGGER_X = -2900;

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

    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("dust", 16, 16);
    graphics.destroy();

    const shadowGraphics = this.make.graphics({ x: 0, y: 0 });
    shadowGraphics.fillStyle(0x000000, 0.3);
    shadowGraphics.fillEllipse(120, 40, 240, 80);
    shadowGraphics.generateTexture("car_shadow", 240, 80);
    shadowGraphics.destroy();

    AudioManager.getInstance().init(this.game);
    this.sirenSound = this.sound.add("siren", { volume: 0.3, loop: true });

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    // 1. Setup world
    this.setupWorld();
    // 2. Setup cars
    this.setupCars();
    // 3. Setup UI
    this.dialogBox = new DialogBox(this);
    // 4. Setup Button
    this.createSolveButton();

    // Listen for quiz completion
    EventBus.on("quiz-completed", (data: { score: number; total: number }) => {
      console.log(`Quiz completed! Score: ${data.score}/${data.total}`);
      this.isSolved = true;

      // Immediately handle success sequence
      this.handlePoliceSuccess();

      // Ensure local progress is updated so if they reload, they don't get stuck
      if (this.savedProgress?.gameState?.eventFlags) {
        this.savedProgress.gameState.eventFlags.easyQuizCompleted = true;
      }
    });

    // 5. Check progress (This handles page reloads/resuming)
    this.checkStoryProgress();

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    EventBus.on("ui-close-quiz", () => {
      if (!this.isSolved) {
        AudioManager.getInstance().playMusic("bgm", {
          loop: true,
          volume: 0.15,
        });
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off("problem-update-progress", this.handleProblemUpdate);
      EventBus.off("problem-solved");
      EventBus.off("ui-close-quiz");
      EventBus.off("quiz-completed");
    });

    AudioManager.getInstance().playMusic("bgm", {
      loop: true,
      volume: 0.15,
    });
  }

  private handleProblemUpdate!: (progress: IGameProgress) => void;

  private setupWorld() {
    this.worldContainer = this.add.container(0, 0);

    // If we previously stopped, put the world at the stop point.
    // Logic later in checkStoryProgress will determine if we stay stopped or resume.
    if (this.savedProgress?.gameState?.eventFlags?.policeStoppedPlayer) {
      this.worldContainer.x = this.POLICE_TRIGGER_X;
    }

    const bgNames = ["car_bg_1", "car_bg_2", "car_bg_3", "car_bg_4"];
    bgNames.forEach((name, index) => {
      const bg = this.add
        .image(index * 2100, 0, name)
        .setDisplaySize(2186, 768)
        .setOrigin(0, 0);
      this.worldContainer.add(bg);
    });

    this.addClouds();

    const building = this.add.image(0, 30, "car_building").setOrigin(0, 0);
    this.worldContainer.add(building);

    this.addSun();

    const red_light = this.add.image(3200, 480, "red_light");
    this.worldContainer.add(red_light);
  }

  private addSun() {
    const sun = this.add.image(400, 120, "sun").setDisplaySize(150, 160);
    this.worldContainer.add(sun);
    this.tweens.add({
      targets: sun,
      scale: sun.scaleX * 1.1,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private addClouds() {
    const cloudCount = 10;
    for (let i = 0; i < cloudCount; i++) {
      const x = Phaser.Math.Between(0, 6500);
      const y = Phaser.Math.Between(50, 200);
      const cloud = this.add.image(x, y, "car_cloud");
      const scale = Phaser.Math.FloatBetween(0.5, 1);
      cloud.setScale(scale);
      const depthAlpha = Phaser.Math.Linear(0.4, 0.7, (scale - 0.5) / 0.5);
      cloud.setAlpha(depthAlpha);
      if (scale < 0.7) {
        cloud.setTint(0xeeeeff);
      }
      cloud.setData("driftSpeed", scale * 0.4);
      this.worldContainer.add(cloud);
      this.clouds.push(cloud);
    }
  }

  private setupCars() {
    const roadY = 635;
    const shadowYOffset = 55;

    this.car = this.add.sprite(400, roadY, "car_player");
    this.car.setDisplaySize(260, 130);
    this.car.setDepth(100);

    this.shadow = this.add.image(
      this.car.x,
      roadY + shadowYOffset,
      "car_shadow",
    );
    this.shadow.setAlpha(0.5);
    this.shadow.setDepth(99);

    const particles = this.add.particles(
      this.car.x - 140,
      this.car.y + 15,
      "dust",
      {
        scale: { start: 0.4, end: 3.0 },
        x: { min: -10, max: 10 },
        y: { min: -5, max: 5 },
        alpha: { start: 0.4, end: 0 },
        lifespan: 1000,
        speed: { min: 30, max: 100 },
        angle: { min: 140, max: 240 },
        gravityY: -40,
        blendMode: "NORMAL",
        tint: 0xcccccc,
        frequency: 30,
        emitting: false,
      },
    );

    this.dustEmitter = particles;

    this.tweens.add({
      targets: this.shadow,
      scaleX: 1.01,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: this.car,
      y: roadY - 0.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // Check progress specifically to position police car
    const flags = this.savedProgress?.gameState?.eventFlags;
    const isStopped = flags?.policeStoppedPlayer;
    const isCompleted = flags?.easyQuizCompleted;

    // If completed, police are gone. If stopped but not completed, police are visible.
    const policeInitialX = isStopped && !isCompleted ? 100 : -500;

    this.policeCar = this.add.sprite(policeInitialX, roadY, "police_car");
    this.policeCar.setDisplaySize(260, 130);
  }

  private checkStoryProgress() {
    if (this.savedProgress?.gameState) {
      const { eventFlags } = this.savedProgress.gameState;

      // 1. If already at office, skip this scene entirely
      if (eventFlags.arrivedAtOffice) {
        this.scene.start("OfficeScene", this.savedProgress);
        return;
      }

      // 2. NEW LOGIC: If Quiz is completed, resume driving immediately
      if (eventFlags.easyQuizCompleted) {
        this.isDriving = true;
        this.eventTriggered = true; // Prevent police from triggering again
        this.isSolved = true;

        // Ensure police car is off-screen
        if (this.policeCar) this.policeCar.x = -500;

        // Ensure we are logically past the trigger point so we don't glitch
        if (this.worldContainer.x > this.POLICE_TRIGGER_X) {
          this.worldContainer.x = this.POLICE_TRIGGER_X - 100;
        }
        return;
      }

      // 3. If stopped but NOT completed, trigger standby mode
      if (eventFlags.policeStoppedPlayer) {
        this.isDriving = false;
        // Check local state just in case
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
    if (this.isDriving) {
      const isMoving = this.cursors.right.isDown || this.keyD.isDown;
      if (isMoving) {
        this.worldContainer.x -= this.scrollSpeed;
        if (!this.dustEmitter.emitting) {
          this.dustEmitter.start();
        }

        // Only trigger police if event hasn't happened yet
        if (
          !this.eventTriggered &&
          this.worldContainer.x <= this.POLICE_TRIGGER_X
        ) {
          this.triggerPoliceEvent();
        }

        if (
          !this.hasReachedOffice &&
          this.worldContainer.x <= this.OFFICE_X_TARGET
        ) {
          this.handleArrivalAtOffice();
        }
      } else {
        this.dustEmitter.stop();
      }
    }

    this.clouds.forEach((cloud) => {
      const speed = cloud.getData("driftSpeed");
      cloud.x -= speed;
      if (cloud.x < -200) {
        cloud.x = 6500;
      }
    });
  }

  private async handleArrivalAtOffice() {
    this.hasReachedOffice = true;
    this.isDriving = false;

    this.dialogBox.show(
      this.car.x,
      this.car.y - 150,
      "The office! I finally made it.",
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
    // 1. Stop driving initially for the animation
    this.isDriving = false;
    this.eventTriggered = true; // Ensure event is marked as triggered

    // 2. Position cars for the "Leaving" animation
    const roadY = 635;
    this.car.setPosition(400, roadY);
    this.policeCar.setPosition(100, roadY);

    // 3. Hide button
    this.solveButton.setVisible(false);

    // 4. Show success dialog
    this.dialogBox.show(
      this.policeCar.x + 50,
      this.policeCar.y - 150,
      "Excellent work. You're free to go!",
    );

    // 5. Animate police leaving, then resume driving
    this.time.delayedCall(3000, () => {
      this.dialogBox.setVisible(false);
      this.tweens.add({
        targets: this.policeCar,
        x: -400, // Move off screen to the left
        duration: 2000,
        ease: "Power2",
        onComplete: () => {
          this.isDriving = true; // Allow player to drive again
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
    this.car.setPosition(400, 630);
    this.policeCar.setPosition(100, 630);
    this.showSolveButton();
  }

  private startDialogSequence() {
    this.dialogBox.show(
      this.policeCar.x + 50,
      this.policeCar.y - 150,
      "HALT! You ran a red light!",
    );
    this.time.delayedCall(2000, () => {
      this.dialogBox.show(
        this.car.x,
        this.car.y - 150,
        "Sorry! I was in a hurry.",
      );
      this.time.delayedCall(2000, () => {
        this.dialogBox.show(
          this.policeCar.x + 50,
          this.policeCar.y - 150,
          "Your penalty: Start the quiz!",
        );
        this.time.delayedCall(1000, () => this.showSolveButton());
      });
    });
  }

  private createSolveButton() {
    this.solveButton = new Button(this, {
      x: this.SCREEN_WIDTH / 2,
      y: this.SCREEN_HEIGHT / 2,
      width: 165,
      height: 55,
      text: "START >",
      color: 0x4a90e2,
      onClick: async () => {
        this.solveButton.setEnabled(false);

        await this.updateProgress({
          gameState: {
            ...this.savedProgress?.gameState,
            currentScene: "CarDriveScene",
            eventFlags: {
              ...this.savedProgress?.gameState?.eventFlags,
              policeStoppedPlayer: true,
            },
          },
        });

        AudioManager.getInstance().stopMusic();

        this.solveButton.setEnabled(true);

        EventBus.emit("ui-open-quiz");
      },
    });

    this.solveButton.setVisible(false).setScale(0);
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
    this.solveButton.setVisible(true).setScale(0);
    this.tweens.add({
      targets: this.solveButton,
      scale: 1,
      duration: 300,
      ease: "Back.out",
    });
  }
}
