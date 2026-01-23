import Phaser from "phaser";
import GameScene from "./GameScene";
import AudioManager from "../AudioManager";

export default class EasyToHomeTransitionScene extends GameScene {
  constructor() {
    super("EasyToHomeTransitionScene");
  }

  preload() {
    this.load.image("intro_car", "/intro/car_1.png");
    this.load.audio("bgm", "/audio/bgm.mp3");
  }

  create() {
    super.create();
    this.initAudio();

    // 1. Create a "Smoke" texture
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(10, 10, 10);
    graphics.generateTexture("smoke_puff", 20, 20);
    graphics.destroy();

    // 2. Add Text
    const text = this.add
      .text(this.scale.width / 2, 300, "Work is done. Heading home...", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "28px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5);
    text.setAlpha(0);

    // 3. ADD THE LINE BELOW THE CAR
    // We place it at y = 560 so the car (at y = 500) looks like it sits on it
    const groundLine = this.add.rectangle(
      this.scale.width / 2,
      510,
      this.scale.width,
      4,
      0xffffff
    );
    groundLine.setAlpha(0.3); // Make it a bit subtle/transparent

    // 4. Add Car
    const car = this.add.sprite(-200, 500, "intro_car");
    car.setScale(0.4);

    // 5. Create Exhaust Particles
    const emitter = this.add.particles(0, 0, "smoke_puff", {
      speed: { min: 20, max: 50 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 800,
      frequency: 150,
      follow: car,
      followOffset: { x: -60, y: 20 },
    });

    // 6. Animation Sequence
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 1000,
      hold: 4000,
      yoyo: true,
    });

    this.tweens.add({
      targets: car,
      x: 1600,
      delay: 500,
      duration: 8000,
      ease: "Linear",
      onComplete: () => {
        emitter.stop();
        this.transitionToHome();
      },
    });
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }

  private transitionToHome() {
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      AudioManager.getInstance().stopMusic();
      this.scene.start("HomeScene", this.savedProgress);
    });
  }
}
