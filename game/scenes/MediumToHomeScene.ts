import GameScene from "./GameScene";
import AudioManager from "../AudioManager";
import SkipButton from "../ui/SkipButton";

export default class MediumToHomeScene extends GameScene {
  private worldContainer!: Phaser.GameObjects.Container;
  private clouds: Phaser.GameObjects.Image[] = [];
  private car!: Phaser.GameObjects.Sprite;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private skipButton!: SkipButton;
  private hasTransitioned = false;

  constructor() {
    super("MediumToHomeScene");
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

    // 3. Add Text (Static UI layer)
    const text = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 50,
        "Work is done 😁.\nHeading home... 🏠",
        {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "28px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 6,
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    // 4. Add Car (Fixed screen position)
    this.car = this.add.sprite(400, 650, "car_player");
    this.car.setDisplaySize(260, 130);

    // 5. Dust Emitter (Follows car)
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

    // Move the WORLD container to simulate driving
    this.tweens.add({
      targets: this.worldContainer,
      x: -2000,
      duration: 8000,
      ease: "Linear",
      onComplete: () => {
        this.dustEmitter.stop();
        this.transitionToHome();
      },
    });

    // Engine vibration effect
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
    // Parallax/Drifting clouds
    this.clouds.forEach((cloud) => {
      const speed = cloud.getData("driftSpeed");
      cloud.x -= speed;
      if (cloud.x < -200) cloud.x = 2500;
    });
  }

  private setupWorld() {
    this.worldContainer = this.add.container(0, 0);

    // Dark Background (Tiled to prevent gaps during movement)
    const bg1 = this.add.image(0, 0, "transition-dark-bg").setOrigin(0, 0);
    const bg2 = this.add.image(1300, 0, "transition-dark-bg").setOrigin(0, 0);
    const bg3 = this.add.image(2600, 0, "transition-dark-bg").setOrigin(0, 0);
    this.worldContainer.add([bg1, bg2, bg3]);

    // Moon
    const moon = this.add
      .image(this.scale.width / 2, 100, "moon")
      .setScale(0.5);
    this.worldContainer.add(moon);

    // Night Clouds
    const cloudPositions = [
      { x: 300, y: 150 },
      { x: 900, y: 80 },
      { x: 1500, y: 200 },
      { x: 2100, y: 100 },
    ];

    cloudPositions.forEach((pos) => {
      const cloud = this.add
        .image(pos.x, pos.y, "car_cloud")
        .setScale(0.5)
        .setAlpha(0.3); // Slightly dimmer for night
      cloud.setTint(0x9999ff); // Blueish tint for night
      cloud.setData("driftSpeed", Phaser.Math.FloatBetween(0.2, 0.5));
      this.clouds.push(cloud);
      this.worldContainer.add(cloud);
    });

    // Dark Buildings and Street Lights
    const building = this.add
      .image(0, 95, "transition-dark-building")
      .setOrigin(0, 0);

    this.worldContainer.add(building);
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
      this.scene.start("HomeScene", this.savedProgress);
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
