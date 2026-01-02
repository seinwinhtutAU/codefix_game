// src/game/ui/DialogBox.ts
import Phaser from "phaser";
import AudioManager from "../AudioManager";

export default class DialogBox extends Phaser.GameObjects.Container {
  private boxGraphics: Phaser.GameObjects.Graphics;
  private textObject: Phaser.GameObjects.Text;
  private typingEvent: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // 1. Create the Graphics background
    this.boxGraphics = scene.add.graphics();

    // 2. Create the Text object
    this.textObject = scene.add
      .text(0, 0, "", {
        fontFamily: '"Press Start 2P", "Courier", monospace',
        fontSize: "20px",
        color: "#000000",
        align: "center",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // 3. Add them to this Container
    this.add([this.boxGraphics, this.textObject]);

    // 4. Add this Container to the Scene
    scene.add.existing(this);
    this.setVisible(false);
  }

  public show(x: number, y: number, message: string) {
    // Stop any previous typing
    if (this.typingEvent) {
      this.typingEvent.remove();
      this.typingEvent = null;
    }

    this.setPosition(x, y);
    this.setVisible(true);

    // Draw the Box
    const w = 350;
    const h = 80;
    this.boxGraphics.clear();
    this.boxGraphics.fillStyle(0xffffff, 1);
    this.boxGraphics.lineStyle(3, 0x000000, 1);
    this.boxGraphics.fillRoundedRect(-(w / 2), -(h / 2), w, h, 20);
    this.boxGraphics.strokeRoundedRect(-(w / 2), -(h / 2), w, h, 20);

    // Start Typewriter
    this.typewriteText(message);
  }

  public hide() {
    this.setVisible(false);
    if (this.typingEvent) {
      this.typingEvent.remove();
      this.typingEvent = null;
    }
  }

  private typewriteText(message: string) {
    this.textObject.setText("");
    const words = message.split(" ");
    let i = 0;

    // Use the scene's time manager
    this.typingEvent = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        if (i < words.length) {
          this.textObject.text += words[i] + " ";

          // Use our Audio Manager
          AudioManager.getInstance().playSound("speech-blip", {
            volume: 0.5,
            detune: Phaser.Math.Between(-100, 100),
          });

          i++;
        }
      },
      repeat: words.length, // Ensures it runs enough times
    });
  }
}
