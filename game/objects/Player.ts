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

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player");

    scene.add.existing(this);
    this.setDisplaySize(256, 256);

    // IMPORTANT: Define animations here if they don't exist yet
    if (!scene.anims.exists("walk")) {
      scene.anims.create({
        key: "walk",
        frames: [
          { key: "player_walk_0" },
          { key: "player_walk_1" },
          { key: "player_walk_2" },
          { key: "player_walk_3" },
        ], // Simplified frame example
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!scene.anims.exists("idle")) {
      scene.anims.create({
        key: "idle",
        frames: [{ key: "player" }],
        frameRate: 1,
      });
    }
  }

  move(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: WASDKeys,
    delta: number
  ) {
    const moveAmount = (this.speed * delta) / 1000;

    let moving = false;

    if (cursors.left?.isDown || wasd.A.isDown) {
      this.x -= moveAmount;
      this.setFlipX(false);
      moving = true;
    } else if (cursors.right?.isDown || wasd.D.isDown) {
      this.x += moveAmount;
      this.setFlipX(true);
      moving = true;
    }

    if (moving) {
      this.play("walk", true);
    } else {
      this.play("idle", true);
    }
  }
}
