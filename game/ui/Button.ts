import Phaser from "phaser";

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
  private config: ButtonConfig;
  private isDisabled = false;
  private baseColor: number;

  private static readonly DEFAULT_WIDTH = 120;
  private static readonly DEFAULT_HEIGHT = 40;
  private static readonly DEFAULT_COLOR = 0x4d90fe;
  private static readonly DISABLED_COLOR = 0xcccccc;
  private static readonly STROKE_COLOR = 0x000000;
  private static readonly STROKE_ALPHA = 0.15;

  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, config.x, config.y);

    this.config = config;
    this.baseColor = config.color ?? Button.DEFAULT_COLOR;
    this.isDisabled = config.disabled ?? false;

    const w = config.width ?? Button.DEFAULT_WIDTH;
    const h = config.height ?? Button.DEFAULT_HEIGHT;

    // Background
    this.bg = scene.add.graphics();
    this.drawButton(this.isDisabled ? Button.DISABLED_COLOR : this.baseColor);

    // Text
    this.label = scene.add
      .text(0, 0, config.text, {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: this.isDisabled ? "#888888" : "#ffffff",
        fontStyle: "bold",
        align: "center",
        ...config.textStyle,
      })
      .setOrigin(0.5);

    this.add([this.bg, this.label]);

    // Hitbox (stable, no scaling issues)
    this.setSize(w, h);
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      cursor: "pointer",
    });

    if (!this.isDisabled) {
      this.setupPointerEvents();
      this.setupKeyboardEvents();
    }

    scene.add.existing(this);
  }

  // ----------------- Drawing -----------------

  private drawButton(color: number, pressed = false) {
    const w = this.config.width ?? Button.DEFAULT_WIDTH;
    const h = this.config.height ?? Button.DEFAULT_HEIGHT;

    this.bg.clear();

    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);

    this.bg.lineStyle(1, Button.STROKE_COLOR, Button.STROKE_ALPHA);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    if (pressed) {
      this.bg.lineStyle(2, 0x000000, 0.25);
      this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    }
  }

  // ----------------- Pointer Events -----------------

  private setupPointerEvents() {
    this.on("pointerover", () => {
      if (this.isDisabled) return;
      this.drawButton(
        Phaser.Display.Color.ValueToColor(this.baseColor).lighten(15).color,
      );
      this.bg.setScale(1.05);
      this.label.setScale(1.05);
      this.config.onHover?.();
    });

    this.on("pointerout", () => {
      if (this.isDisabled) return;
      this.drawButton(this.baseColor);
      this.bg.setScale(1);
      this.label.setScale(1);
      this.config.onHoverOut?.();
    });

    // 🔥 Click happens immediately (NO DELAY)
    this.on("pointerdown", () => {
      if (this.isDisabled) return;

      this.drawButton(
        Phaser.Display.Color.ValueToColor(this.baseColor).darken(20).color,
        true,
      );

      this.scene.tweens.add({
        targets: [this.bg, this.label],
        scale: 0.95,
        duration: 60,
        yoyo: true,
        ease: "Power2",
      });

      this.config.onClick();
    });
  }

  // ----------------- Keyboard -----------------

  private setupKeyboardEvents() {
    const handler = () => {
      if (this.isDisabled) return;

      this.drawButton(
        Phaser.Display.Color.ValueToColor(this.baseColor).darken(20).color,
        true,
      );

      this.scene.tweens.add({
        targets: [this.bg, this.label],
        scale: 0.95,
        duration: 60,
        yoyo: true,
        ease: "Power2",
        onComplete: () => this.drawButton(this.baseColor),
      });

      this.config.onClick();
    };

    this.scene.input.keyboard?.on("keydown-ENTER", handler);
    this.scene.input.keyboard?.on("keydown-SPACE", handler);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.input.keyboard?.off("keydown-ENTER", handler);
      this.scene.input.keyboard?.off("keydown-SPACE", handler);
    });
  }

  // ----------------- Public API -----------------

  public setEnabled(enabled: boolean): this {
    this.isDisabled = !enabled;

    if (enabled) {
      this.label.setColor("#ffffff");
      this.drawButton(this.baseColor);
      this.setInteractive();
    } else {
      this.label.setColor("#888888");
      this.drawButton(Button.DISABLED_COLOR);
      this.disableInteractive();
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
