import GameScene from "./GameScene";
import AudioManager from "../AudioManager";
import SkipButton from "../ui/SkipButton";

export default class HardToWarningScene extends GameScene {
  private worldContainer!: Phaser.GameObjects.Container;
  private clouds: Phaser.GameObjects.Image[] = [];
  private car!: Phaser.GameObjects.Sprite;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private skipButton!: SkipButton;
  private hasTransitioned = false;

  constructor() {
    super("HardToWarningScene");
  }

  create() {
    super.create();
    this.initAudio();

    // 1. Create a "Smoke" texture
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("dust", 16, 16);
    graphics.destroy();

    // 2. Setup the Moving World (Container)
    this.setupWorld();

    // 3. Add Text (Stay on screen, not in container)
    const text = this.add
      .text(this.scale.width / 2, 300, "The Next Day.\n Heading to Office...", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "28px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 4. Add Car (Static on screen while world moves)
    this.car = this.add.sprite(400, 650, "car_player");
    this.car.setDisplaySize(260, 130);

    // 5. Dust Emitter
    this.dustEmitter = this.add.particles(0, 0, "dust", {
      scale: { start: 0.4, end: 3.0 },
      x: { min: -5, max: 10 },
      y: { min: -5, max: 5 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 1000,
      speed: { min: 30, max: 100 },
      angle: { min: 140, max: 240 },
      gravityY: -40,
      blendMode: "NORMAL",
      tint: 0xcccccc,
      frequency: 30,
      follow: this.car,
      followOffset: { x: -140, y: 15 },
    });

    // --- ANIMATIONS ---

    // Fade text in and out
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 1000,
      hold: 4000,
      yoyo: true,
    });

    // Move the WORLD (Everything moves left, making car look like it's going right)
    this.tweens.add({
      targets: this.worldContainer,
      x: -2000, // Distance to travel
      duration: 8000,
      ease: "Linear",
      onComplete: () => {
        this.dustEmitter.stop();
        this.transitionToHome();
      },
    });

    // Car engine vibration
    this.tweens.add({
      targets: this.car,
      y: 650 - 1.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    this.createSkipButton();
  }

  update() {
    // Cloud drifting logic
    this.clouds.forEach((cloud) => {
      const speed = cloud.getData("driftSpeed");
      cloud.x -= speed;
      if (cloud.x < -200) cloud.x = 2500;
    });
  }

  private setupWorld() {
    this.worldContainer = this.add.container(0, 0);

    // Background Image
    const bg1 = this.add.image(0, 0, "car_bg_1").setOrigin(0, 0);
    const bg2 = this.add.image(1376, 0, "car_bg_1").setOrigin(0, 0);
    this.worldContainer.add(bg1);
    this.worldContainer.add(bg2);

    // Sun
    const sun = this.add
      .image(this.scale.width / 2 - 100, 100, "sun")
      .setScale(0.5);
    this.worldContainer.add(sun);

    // Clouds
    const cloudPositions = [
      { x: 200, y: 200 },
      { x: 800, y: 100 },
      { x: 1400, y: 150 },
      { x: 2000, y: 120 },
    ];

    cloudPositions.forEach((pos) => {
      const cloud = this.add
        .image(pos.x, pos.y, "car_cloud")
        .setScale(0.5)
        .setAlpha(0.5);
      cloud.setData("driftSpeed", Phaser.Math.FloatBetween(0.2, 0.5));
      this.clouds.push(cloud);
      this.worldContainer.add(cloud);
    });

    // Building/City Scenery
    const building = this.add.image(0, 30, "car_building").setOrigin(0, 0);
    const light = this.add.image(100, 500, "transition-light").setOrigin(0);

    this.worldContainer.add([building, light]);
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }

  private transitionToHome() {
    if (this.hasTransitioned) return;
    this.hasTransitioned = true;
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      AudioManager.getInstance().stopMusic();
      this.scene.start("WarningScene", this.savedProgress);
    });
  }

  private createSkipButton() {
    this.skipButton = new SkipButton(this, {
      onClick: () => {
        if (this.skipButton) this.skipButton.setEnabled(false);
        this.time.removeAllEvents();
        this.transitionToHome();
      },
    });
  }
}
