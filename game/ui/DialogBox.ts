// src/game/ui/DialogBox.ts
import Phaser from "phaser";
import AudioManager from "../AudioManager";

export default class DialogBox extends Phaser.GameObjects.Container {
  private boxGraphics: Phaser.GameObjects.Graphics;
  private textObject: Phaser.GameObjects.Text;
  private typingEvent: Phaser.Time.TimerEvent | null = null;

  // Configuration for look and feel
  private readonly PADDING = 20;
  private readonly MAX_WIDTH = 350;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.boxGraphics = scene.add.graphics();

    this.textObject = scene.add
      .text(0, 0, "", {
        fontFamily: '"Press Start 2P", "Courier", monospace',
        fontSize: "18px", // Slightly smaller to fit more text adaptively
        color: "#000000",
        align: "center",
        wordWrap: { width: this.MAX_WIDTH - this.PADDING * 2 },
      })
      .setOrigin(0.5);

    this.add([this.boxGraphics, this.textObject]);
    scene.add.existing(this);
    this.setVisible(false);
  }

  public show(x: number, y: number, message: string) {
    if (this.typingEvent) {
      this.typingEvent.remove();
      this.typingEvent = null;
    }

    this.setPosition(x, y);
    this.setVisible(true);

    // 1. Set the full text temporarily to measure the final size
    this.textObject.setText(message);

    // 2. Calculate adaptive dimensions based on text bounds
    const textWidth = this.textObject.width;
    const textHeight = this.textObject.height;

    const boxWidth = textWidth + this.PADDING * 2;
    const boxHeight = textHeight + this.PADDING * 2;

    // 3. Draw the Adaptive Box
    this.boxGraphics.clear();
    this.boxGraphics.fillStyle(0xffffff, 1);
    this.boxGraphics.lineStyle(3, 0x000000, 1);

    // Draw centered around (0,0)
    this.boxGraphics.fillRoundedRect(
      -(boxWidth / 2),
      -(boxHeight / 2),
      boxWidth,
      boxHeight,
      15
    );
    this.boxGraphics.strokeRoundedRect(
      -(boxWidth / 2),
      -(boxHeight / 2),
      boxWidth,
      boxHeight,
      15
    );

    // 4. Start the typewriter effect
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

    this.typingEvent = this.scene.time.addEvent({
      delay: 180, // Slightly faster for better UX
      callback: () => {
        if (i < words.length) {
          this.textObject.text += words[i] + " ";

          AudioManager.getInstance().playSound("speech-blip", {
            volume: 0.4,
            detune: Phaser.Math.Between(-100, 100),
          });

          i++;
        }
      },
      repeat: words.length - 1,
    });
  }
}
