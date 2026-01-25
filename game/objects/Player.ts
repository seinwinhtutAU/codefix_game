import * as Phaser from "phaser";

// If WASDKeys isn't exported globally, define a simple structure here for the type
type WASDKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export default class Player extends Phaser.GameObjects.Sprite {
  private speed = 200;
  private shadow: Phaser.GameObjects.Graphics;
  private dustParticles: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_walk", 0);

    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.3);
    this.shadow.fillEllipse(0, 0, 60, 20);

    if (!scene.textures.exists("dust")) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture("dust", 8, 8);
      graphics.destroy();
    }

    this.dustParticles = scene.add.particles(0, 0, "dust", {
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 600,
      speed: { min: 30, max: 60 },
      gravityY: -50,
      frequency: 100,
      emitting: false,
    });

    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setDisplaySize(140, 165);

    this.setDepth(2);
    this.shadow.setDepth(1);
    this.dustParticles.setDepth(1);

    this.shadow.setPosition(this.x, this.y + 80);

    this.setUpAnimation(scene);
  }

  private setUpAnimation(scene: Phaser.Scene) {
    if (!scene.anims.exists("walk")) {
      scene.anims.create({
        key: "walk",
        // This tells Phaser to use frames 1, 2, and 3 from 'player_sheet'
        frames: scene.anims.generateFrameNumbers("player_walk", {
          start: 1,
          end: 3,
        }),
        frameRate: 7,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("idle")) {
      scene.anims.create({
        key: "idle",
        // Use frame 0 for the idle state
        frames: [{ key: "player_walk", frame: 0 }],
        frameRate: 1,
      });
    }
  }

  move(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: WASDKeys,
    delta: number,
  ) {
    const moveAmount = (this.speed * delta) / 1000;

    let moving = false;

    if (cursors.left?.isDown || wasd.A.isDown) {
      this.x -= moveAmount;
      this.setFlipX(true);
      moving = true;
    } else if (cursors.right?.isDown || wasd.D.isDown) {
      this.x += moveAmount;
      this.setFlipX(false);
      moving = true;
    }

    const feetY = this.y + 80;
    this.shadow.setPosition(this.x, feetY);
    if (!this.flipX) {
      this.dustParticles.setPosition(this.x - 20, feetY);
    } else {
      this.dustParticles.setPosition(this.x + 20, feetY);
    }

    if (moving) {
      this.play("walk", true);
      if (!this.dustParticles.emitting) {
        this.dustParticles.start();
      }
    } else {
      this.play("idle", true);
      if (this.dustParticles.emitting) {
        this.dustParticles.stop();
      }
    }
  }
}
