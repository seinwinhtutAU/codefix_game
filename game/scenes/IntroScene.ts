import Phaser from "phaser";
import Player from "../objects/Player";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox"; // Import the component

type WASDKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export default class IntroScene extends Phaser.Scene {
  private player!: Player;
  private wife!: Phaser.GameObjects.Image;
  private car!: Phaser.GameObjects.Image;
  private nextButton!: Phaser.GameObjects.Text;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: WASDKeys;
  private canMove: boolean = false;

  // REPLACEMENT: We use the class instead of raw graphics/text
  private dialogBox!: DialogBox;

  constructor() {
    super("IntroScene");
  }

  preload() {
    this.load.image("house-bg", "/intro/house-bg.png");
    this.load.image("player", "/player/idle/img.png");
    this.load.image("wife", "/player/idle/img.png");
    this.load.image("car", "/intro/car_1.png");

    for (let i = 0; i < 8; i++) {
      this.load.image(`player_walk_${i}`, `/player/walk/img${i}.png`);
    }

    // Audio assets
    this.load.audio("bgm", "/audio/bgm.mp3");
    this.load.audio("speech-blip", "/audio/blip.mp3");
  }

  create() {
    // 1. Initialize Audio
    AudioManager.getInstance().init(this.game);
    AudioManager.getInstance().playMusic("bgm", { loop: true, volume: 0.15 });

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // 2. Setup Inputs
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as WASDKeys;

    // 3. World Objects
    this.add.image(0, 0, "house-bg").setOrigin(0, 0);

    this.car = this.add.image(400, 670, "car");
    this.car.setDisplaySize(260, 130);

    this.player = new Player(this, 750, 670).setFlipX(true);

    this.wife = this.add.image(1000, 660, "wife");
    this.wife.setDisplaySize(256, 256);

    // 4. Setup UI Component
    this.dialogBox = new DialogBox(this);

    // 5. Next Button
    const { width, height } = this.scale;
    this.nextButton = this.add
      .text(width - 150, height - 100, "NEXT >", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 },
      })
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .on("pointerdown", () => {
        this.handleGoodbyeSequence();
      });

    // 6. Start Intro Story
    this.time.delayedCall(1000, () => this.runIntroSequence());
  }

  update(time: number, delta: number) {
    if (this.canMove) {
      this.player.move(this.cursors, this.wasd, delta);
      this.checkCarProximity();
    }
  }

  // --- LOGIC ---

  private checkCarProximity() {
    const dist = Math.abs(this.player.x - this.car.x);
    this.nextButton.setVisible(dist < 50);
  }

  private runIntroSequence() {
    // Using the clean component API
    this.dialogBox.show(
      this.wife.x,
      this.wife.y - 180,
      "Don't forget your code"
    );

    this.time.delayedCall(3000, () => {
      this.dialogBox.show(
        this.player.x,
        this.player.y - 180,
        "I won't, honey!"
      );

      this.time.delayedCall(2000, () => {
        this.dialogBox.hide();
        this.canMove = true;
      });
    });
  }

  private handleGoodbyeSequence() {
    this.canMove = false;
    this.player.play("idle", true);
    this.nextButton.setVisible(false);

    this.dialogBox.show(this.player.x, this.player.y - 180, "Bye bye!");

    this.time.delayedCall(2000, () => {
      this.dialogBox.show(this.wife.x, this.wife.y - 180, "Good luck!");

      this.time.delayedCall(2000, () => {
        this.dialogBox.hide();

        // Screen Fade
        AudioManager.getInstance().stopMusic();

        // 2. Start fading out the screen (1000ms)
        this.cameras.main.fadeOut(1000, 0, 0, 0);

        this.cameras.main.once(
          Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
          () => {
            this.scene.start("CarDriveScene");
          }
        );
      });
    });
  }
}
