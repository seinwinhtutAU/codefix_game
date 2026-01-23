import Phaser from "phaser";
import GameScene from "./GameScene";
import DialogBox from "../ui/DialogBox";
import AudioManager from "../AudioManager";
import { EventBus } from "@/game/events";
import { IGameProgress } from "@/lib/types";

export default class PlayGroundScene extends GameScene {
  // --- ASSETS ---
  private car!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private worldContainer!: Phaser.GameObjects.Container;
  private dialogBox!: DialogBox;
  private clouds: Phaser.GameObjects.Image[] = []; // Added cloud array

  // --- INPUTS ---
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyD!: Phaser.Input.Keyboard.Key;

  // --- CONFIG ---
  private readonly SCREEN_WIDTH = 1376;
  private readonly SCREEN_HEIGHT = 768;
  private scrollSpeed: number = 10;
  private readonly DIALOG_TRIGGER_X = -2400;
  private hasTriggeredArrival: boolean = false;

  // --- STATE ---
  private isMoving: boolean = true;

  private nextButton!: Phaser.GameObjects.Container;

  constructor() {
    super("PlayGroundScene");
  }

  preload() {
    this.load.image("play_ground_bg1", "/medium/bg1.png");
    this.load.image("play_ground_bg2", "/medium/bg2.png");
    this.load.image("park_building", "/medium/building1.png");
  }

  create() {
    if (this.savedProgress?.gameState?.eventFlags?.playgroundCompleted) {
      this.scene.start("MediumLevelScene", this.savedProgress);
      return;
    }

    super.create();
    this.generateProceduralAssets();
    this.initAudio();

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    this.setupWorld();
    this.setupPlayer();
    this.dialogBox = new DialogBox(this);

    this.createNextButton();

    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  private createNextButton() {
    const { width, height } = this.scale;

    // Create a container at the bottom right
    this.nextButton = this.add.container(width - 150, height - 80);
    this.nextButton.setAlpha(0).setVisible(false).setDepth(1000);

    // Button Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-100, -25, 200, 50, 10);
    bg.strokeRoundedRect(-100, -25, 200, 50, 10);

    // Button Text
    const text = this.add
      .text(0, 0, "NEXT >", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.nextButton.add([bg, text]);

    // Interactivity
    const hitArea = new Phaser.Geom.Rectangle(-100, -25, 200, 50);
    this.nextButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this.nextButton.on("pointerover", () => text.setColor("#ffff00"));
    this.nextButton.on("pointerout", () => text.setColor("#ffffff"));

    this.nextButton.on("pointerdown", async () => {
      AudioManager.getInstance().playSound("click", { volume: 0.5 });

      // Prevent double clicks
      this.nextButton.disableInteractive();

      // 1. Update Progress
      await this.savePlaygroundCompletion();

      // 2. Transition
      this.transitionToMediumLevel();
    });
  }

  private generateProceduralAssets() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("dust_puff", 16, 16);
    graphics.clear();

    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(120, 40, 240, 80);
    graphics.generateTexture("car_shadow", 240, 80);
    graphics.destroy();
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }

  private setupWorld() {
    this.worldContainer = this.add.container(0, 0);

    // Backgrounds
    const backgrounds = ["car_bg_1", "car_bg_1", "car_bg_1"];
    backgrounds.forEach((texture, index) => {
      const bg = this.add
        .image(index * 2100, 0, texture)
        .setOrigin(0, 0)
        .setDisplaySize(2186, 768);
      this.worldContainer.add(bg);
    });

    this.addClouds();
    this.addSun();

    const building = this.add.image(0, 40, "park_building").setOrigin(0, 0);
    this.worldContainer.add(building);
  }

  private addSun() {
    const sun = this.add.image(3150, 100, "sun").setDisplaySize(150, 160);
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

  private setupPlayer() {
    const roadY = 635;
    const shadowYOffset = 55;

    this.shadow = this.add.image(400, roadY + shadowYOffset, "car_shadow");
    this.shadow.setAlpha(0.5);
    this.shadow.setDepth(99);

    this.car = this.add.sprite(400, roadY, "car");
    this.car.setDisplaySize(260, 130);
    this.car.setDepth(100);

    this.dustEmitter = this.add.particles(
      this.car.x - 138,
      this.car.y + 20,
      "dust_puff",
      {
        scale: { start: 0.5, end: 4.0 },
        alpha: { start: 0.4, end: 0 },
        lifespan: 800,
        speed: { min: 40, max: 100 },
        angle: { min: 140, max: 220 },
        gravityY: -30,
        blendMode: "NORMAL",
        tint: 0xbbbbbb,
        frequency: 30,
        emitting: false,
      },
    );
    this.dustEmitter.setDepth(98);

    this.tweens.add({
      targets: this.car,
      y: roadY - 2,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: this.shadow,
      scaleX: 1.02,
      alpha: 0.6,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });
  }

  update() {
    // 1. Driving Logic
    if (this.isMoving) {
      const isInputActive = this.cursors.right.isDown || this.keyD.isDown;

      if (isInputActive) {
        this.worldContainer.x -= this.scrollSpeed;

        if (!this.dustEmitter.emitting) {
          this.dustEmitter.start();
        }

        if (
          !this.hasTriggeredArrival &&
          this.worldContainer.x <= this.DIALOG_TRIGGER_X
        ) {
          this.handleArrivalAtPark();
        }
      } else {
        if (this.dustEmitter.emitting) {
          this.dustEmitter.stop();
        }
      }
    }

    // 2. Cloud Drift Logic (Constant movement)
    this.clouds.forEach((cloud) => {
      const speed = cloud.getData("driftSpeed");
      cloud.x -= speed;

      // Wrap around world width
      if (cloud.x < -200) {
        cloud.x = 6500;
      }
    });
  }

  private async handleArrivalAtPark() {
    this.hasTriggeredArrival = true;
    this.isMoving = false;
    this.dustEmitter.stop();

    this.dialogBox.show(
      this.car.x,
      this.car.y - 150,
      "I've arrived at the park! The system seems broken...",
    );

    this.nextButton.setVisible(true);
    this.tweens.add({
      targets: this.nextButton,
      alpha: 1,
      y: this.scale.height - 100,
      duration: 500,
      ease: "Power2",
    });
  }

  private async savePlaygroundCompletion() {
    if (!this.savedProgress) return;

    const progress: IGameProgress = {
      ...this.savedProgress,
      gameState: {
        ...this.savedProgress.gameState,
        currentScene: "MediumLevelScene",
        eventFlags: {
          ...this.savedProgress.gameState.eventFlags,
          playgroundCompleted: true,
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
    };

    this.savedProgress = progress;
    EventBus.emit("progress-updated", progress);
  }

  private transitionToMediumLevel() {
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MediumLevelScene", this.savedProgress);
    });
  }
}
