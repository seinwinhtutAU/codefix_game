import Phaser from "phaser";
import AudioManager from "../AudioManager";

export default class DialogBox extends Phaser.GameObjects.Container {
  private boxGraphics: Phaser.GameObjects.Graphics;
  private textObject: Phaser.GameObjects.Text;
  private typingEvent: Phaser.Time.TimerEvent | null = null;

  private readonly PADDING = 24;
  private readonly MAX_WIDTH = 350;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Graphics for the bubble and shadow
    this.boxGraphics = scene.add.graphics();

    this.textObject = scene.add
      .text(0, 0, "", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "12px",
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
    }

    this.setPosition(x, y);
    this.setVisible(true);
    this.setScale(0); // Start small for pop-in effect

    // Pop-in Animation
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut", // Gives it a "bouncy" feel
    });

    this.textObject.setText(message);
    const boxWidth = this.textObject.width + this.PADDING * 2;
    const boxHeight = this.textObject.height + this.PADDING * 2;

    this.drawBubble(boxWidth, boxHeight);
    this.typewriteText(message);
  }

  private drawBubble(width: number, height: number) {
    const graphics = this.boxGraphics;
    graphics.clear();

    const x = -(width / 2);
    const y = -(height / 2);
    const cornerRadius = 20; // Soft but not overly round
    const tailSize = 12; // Smaller tail to match thinner border
    const borderWidth = 2; // Reduced from 6 to 2 for a cleaner look

    // 1. Soft Shadow
    graphics.fillStyle(0x000000, 0.1);
    graphics.fillRoundedRect(x + 3, y + 3, width, height, cornerRadius);

    // 2. Main Bubble
    graphics.lineStyle(borderWidth, 0x000000, 1);
    graphics.fillStyle(0xffffff, 1);

    graphics.fillRoundedRect(x, y, width, height, cornerRadius);
    graphics.strokeRoundedRect(x, y, width, height, cornerRadius);

    // 3. The Tail
    graphics.beginPath();
    graphics.moveTo(-tailSize, height / 2 - 1);
    graphics.lineTo(0, height / 2 + tailSize);
    graphics.lineTo(tailSize, height / 2 - 1);

    // Fill first, then stroke to keep the point sharp
    graphics.fillPath();
    graphics.strokePath();

    // 4. Refined Seam Fix
    // This hides the border segment where the tail meets the box
    // We use a slightly thicker white line to ensure full coverage
    graphics.lineStyle(borderWidth + 1, 0xffffff, 1);
    graphics.lineBetween(
      -tailSize + borderWidth,
      height / 2 - 1,
      tailSize - borderWidth,
      height / 2 - 1
    );
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

  public hide() {
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      duration: 200,
      ease: "Back.easeIn",
      onComplete: () => this.setVisible(false),
    });
  }
}
