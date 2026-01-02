import Phaser from "phaser";
import AudioManager from "../AudioManager";
import DialogBox from "../ui/DialogBox"; // Import the component

export default class CarDriveScene extends Phaser.Scene {
  // --- ASSETS ---
  private car!: Phaser.GameObjects.Sprite;
  private worldContainer!: Phaser.GameObjects.Container;
  private policeCar!: Phaser.GameObjects.Sprite;

  // --- UI ELEMENTS ---
  private dialogBox!: DialogBox; // Clean UI Component
  private solveButtonContainer!: Phaser.GameObjects.Container;

  // --- INPUTS ---
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyD!: Phaser.Input.Keyboard.Key;

  // --- CONFIGURATION ---
  private readonly SCREEN_WIDTH = 1376;
  private readonly SCREEN_HEIGHT = 768;
  private scrollSpeed: number = 8;

  // --- STATE ---
  private isDriving: boolean = true;
  private eventTriggered: boolean = false;

  // --- AUDIO ---
  // Siren is local because we need to control it precisely (start/stop)
  // tied to the police car animation, not global state.
  private sirenSound!: Phaser.Sound.BaseSound;

  constructor() {
    super("CarDriveScene");
  }

  preload() {
    // 1. Visuals
    for (let i = 1; i <= 4; i++) {
      this.load.image(`city_${i}`, `/intro/city_${i}.png`);
    }
    this.load.image("car", "/intro/car_1.png");
    this.load.image("police_car", "/intro/police1.png");

    // 2. Audio
    this.load.audio("siren", "/audio/siren.mp3");
    this.load.audio("speech-blip", "/audio/blip.mp3");
    this.load.audio("drive-bgm", "/audio/bgm.mp3"); // Using bgm as driving music
  }

  create() {
    // 1. Initialize Audio Manager
    AudioManager.getInstance().init(this.game);
    // Play BGM with fade-in
    AudioManager.getInstance().playMusic("drive-bgm", {
      loop: true,
      volume: 0.15,
    });

    // 2. Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    // 3. World Setup
    this.worldContainer = this.add.container(0, 0);
    const bgNames = ["city_1", "city_2", "city_3", "city_4"];
    bgNames.forEach((name, index) => {
      const bg = this.add.image(index * 2000, 0, name).setOrigin(0, 0);
      this.worldContainer.add(bg);
    });

    // 4. Player Car
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

    // 5. Police Car
    this.policeCar = this.add.sprite(-300, 670, "police_car");
    this.policeCar.setDisplaySize(260, 130);

    // 6. UI Setup
    this.dialogBox = new DialogBox(this); // Init reusable component
    this.createSolveButton();

    // 7. Local Audio Setup
    this.sirenSound = this.sound.add("siren", { volume: 0.3, loop: true });

    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  update(time: number, delta: number) {
    if (!this.isDriving) return;

    if (this.cursors.right.isDown || this.keyD.isDown) {
      this.worldContainer.x -= this.scrollSpeed;

      const triggerWorldX = 2000 + 2000 / 3;
      const currentTriggerScreenX = triggerWorldX + this.worldContainer.x;

      if (!this.eventTriggered && currentTriggerScreenX < 400) {
        this.triggerPoliceEvent();
      }
    }
  }

  // --- EVENT LOGIC ---

  private triggerPoliceEvent() {
    this.eventTriggered = true;
    this.isDriving = false;

    // AUDIO LOGIC: Stop the music to make the siren scary
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

  private startDialogSequence() {
    // 1. Police
    this.dialogBox.show(
      this.policeCar.x + 50,
      this.policeCar.y - 150,
      "HALT! You ran a red light!"
    );

    this.time.delayedCall(3000, () => {
      // 2. Player
      this.dialogBox.show(
        this.car.x,
        this.car.y - 150,
        "Sorry! I was in a hurry."
      );

      this.time.delayedCall(3000, () => {
        // 3. Police
        this.dialogBox.show(
          this.policeCar.x + 50,
          this.policeCar.y - 150,
          "Your penalty: Solve this code!"
        );

        this.time.delayedCall(1500, () => {
          this.showSolveButton();
        });
      });
    });
  }

  // --- BUTTON UI ---

  private createSolveButton() {
    this.solveButtonContainer = this.add.container(
      this.SCREEN_WIDTH / 2,
      this.SCREEN_HEIGHT / 2
    );
    this.solveButtonContainer.setVisible(false);
    this.solveButtonContainer.setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x000044, 1);
    bg.lineStyle(4, 0x00ff00, 1);
    bg.fillRoundedRect(-120, -30, 240, 60, 15);
    bg.strokeRoundedRect(-120, -30, 240, 60, 15);

    const text = this.add
      .text(0, 0, "SOLVE CODE >", {
        fontFamily: '"Press Start 2P", "Courier", monospace',
        fontSize: "20px",
        color: "#00ff00",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const hitArea = this.add
      .zone(0, 0, 240, 60)
      .setInteractive({ useHandCursor: true });

    // Interaction Logic
    hitArea.on("pointerdown", () => {
      // 1. Play Feedback Sound via Manager
      AudioManager.getInstance().playSound("speech-blip", {
        volume: 1.0,
        detune: 500,
      });

      // 2. Clean up audio before navigating
      AudioManager.getInstance().stopMusic();
      this.sound.stopAll();

      // 3. Navigate after short delay
      this.time.delayedCall(150, () => {
        window.location.href = "/problem";
      });
    });

    hitArea.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x002200, 1);
      bg.lineStyle(4, 0x00ff00, 1);
      bg.fillRoundedRect(-120, -30, 240, 60, 15);
      bg.strokeRoundedRect(-120, -30, 240, 60, 15);
    });

    hitArea.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x000044, 1);
      bg.lineStyle(4, 0x00ff00, 1);
      bg.fillRoundedRect(-120, -30, 240, 60, 15);
      bg.strokeRoundedRect(-120, -30, 240, 60, 15);
    });

    this.solveButtonContainer.add([bg, text, hitArea]);
  }

  private showSolveButton() {
    this.solveButtonContainer.setVisible(true);
    this.solveButtonContainer.setScale(0);

    this.tweens.add({
      targets: this.solveButtonContainer,
      scale: 1,
      duration: 300,
      ease: "Back.out",
    });
  }
}
