import Phaser from "phaser";
import AudioManager from "../AudioManager";

export interface ButtonConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  color?: number;
  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  disabled?: boolean;
  onClick: () => void;
  onHover?: () => void;
  onHoverOut?: () => void;
}

export default class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private hitZone: Phaser.GameObjects.Zone; // <--- The secret weapon
  private config: ButtonConfig;
  private isDisabled = false;
  private baseColor: number;

  private static readonly DEFAULT_WIDTH = 120;
  private static readonly DEFAULT_HEIGHT = 40;
  private static readonly DEFAULT_COLOR = 0x4d90fe;
  private static readonly DISABLED_COLOR = 0xcccccc;

  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, config.x, config.y);

    this.config = config;
    this.baseColor = config.color ?? Button.DEFAULT_COLOR;
    this.isDisabled = config.disabled ?? false;

    const w = config.width ?? Button.DEFAULT_WIDTH;
    const h = config.height ?? Button.DEFAULT_HEIGHT;

    // 1. Draw Background (Centered)
    this.bg = scene.add.graphics();
    this.drawButton(this.isDisabled ? Button.DISABLED_COLOR : this.baseColor);

    // 2. Draw Text (Centered)
    this.label = scene.add
      .text(0, 0, config.text, {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: this.isDisabled ? "#888888" : "#ffffff",
        fontStyle: "bold",
        align: "center",
        ...config.textStyle,
      })
      .setOrigin(0.5); // Ensures text is perfectly centered

    // 3. Create a Hit Zone (The Fix)
    // We create a Zone at (0,0) with the exact width/height.
    // Zones support origins, so we set it to 0.5 to match the graphics.
    this.hitZone = scene.add.zone(0, 0, w, h).setOrigin(0.5);

    // Add everything to container
    this.add([this.bg, this.label, this.hitZone]);

    // 4. Setup Interaction on the ZONE, not the Container
    this.hitZone.setInteractive({
      useHandCursor: !this.isDisabled,
      cursor: this.isDisabled ? "default" : "pointer",
    });

    // 5. Setup Events
    this.setupEvents();

    // 6. Handle Initial State
    if (this.isDisabled) {
      this.setEnabled(false);
    }

    scene.add.existing(this);
  }

  private playClickSound() {
    AudioManager.getInstance().playSound("click", { volume: 0.5 });
  }

  private drawButton(color: number, pressed = false) {
    const w = this.config.width ?? Button.DEFAULT_WIDTH;
    const h = this.config.height ?? Button.DEFAULT_HEIGHT;

    this.bg.clear();
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // Optional border
    this.bg.lineStyle(2, 0x000000, 0.1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

    if (pressed) {
      this.bg.lineStyle(2, 0x000000, 0.3);
      this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    }
  }

  private setupEvents() {
    // Note: We listen to 'this.hitZone', NOT 'this'

    this.hitZone.on("pointerover", () => {
      if (this.isDisabled) return;

      const hoverColor = Phaser.Display.Color.ValueToColor(
        this.baseColor,
      ).lighten(15).color;
      this.drawButton(hoverColor);
      this.setScale(1.05);
      this.config.onHover?.();
    });

    this.hitZone.on("pointerout", () => {
      if (this.isDisabled) return;

      this.drawButton(this.baseColor);
      this.setScale(1);
      this.config.onHoverOut?.();
    });

    this.hitZone.on("pointerdown", () => {
      if (this.isDisabled) return;

      this.playClickSound();

      const pressColor = Phaser.Display.Color.ValueToColor(
        this.baseColor,
      ).darken(20).color;
      this.drawButton(pressColor, true);

      this.scene.tweens.add({
        targets: this,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          if (!this.isDisabled) this.drawButton(this.baseColor);
        },
      });

      this.config.onClick();
    });
  }

  public setEnabled(enabled: boolean): this {
    this.isDisabled = !enabled;

    // Toggle the Zone's interactivity
    if (enabled) {
      this.hitZone.setInteractive();
      this.hitZone.input!.cursor = "pointer";

      this.label.setColor("#ffffff");
      this.drawButton(this.baseColor);
      this.setAlpha(1);
    } else {
      this.hitZone.disableInteractive();

      this.label.setColor("#888888");
      this.drawButton(Button.DISABLED_COLOR);
      this.setAlpha(0.8);
    }

    return this;
  }

  public setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  public setColor(color: number): this {
    this.baseColor = color;
    if (!this.isDisabled) this.drawButton(color);
    return this;
  }
}
