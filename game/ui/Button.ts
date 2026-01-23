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
  private isDisabled: boolean = false;
  private baseColor: number;
  private hoverTween: Phaser.Tweens.Tween | null = null;
  private clickTween: Phaser.Tweens.Tween | null = null;

  // Style constants
  private static readonly DEFAULT_WIDTH = 120;
  private static readonly DEFAULT_HEIGHT = 40;
  private static readonly DEFAULT_COLOR = 0x4d90fe;
  private static readonly DISABLED_COLOR = 0xcccccc;
  private static readonly STROKE_COLOR = 0x000000;
  private static readonly STROKE_ALPHA = 0.1;

  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, config.x, config.y);
    this.config = config;
    this.baseColor = config.color || Button.DEFAULT_COLOR;
    this.isDisabled = config.disabled || false;

    const w = config.width || Button.DEFAULT_WIDTH;
    const h = config.height || Button.DEFAULT_HEIGHT;

    // 1. Draw Background
    this.bg = scene.add.graphics();
    this.drawButton(this.isDisabled ? Button.DISABLED_COLOR : this.baseColor);

    // 2. Add Text with customizable style
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: this.isDisabled ? "#888888" : "#ffffff",
      fontStyle: "bold",
      align: "center",
      ...config.textStyle, // Allow customization
    };

    this.label = scene.add.text(0, 0, config.text, textStyle).setOrigin(0.5);

    this.add([this.bg, this.label]);

    // 3. Make Interactive (only if not disabled)
    this.setSize(w, h);
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      cursor: this.isDisabled ? "default" : "pointer",
      useHandCursor: !this.isDisabled,
    });

    if (!this.isDisabled) {
      this.setupEvents();
      this.setupKeyboard();
    }

    scene.add.existing(this);
  }

  private drawButton(color: number, isPressed: boolean = false) {
    const w = this.config.width || Button.DEFAULT_WIDTH;
    const h = this.config.height || Button.DEFAULT_HEIGHT;

    this.bg.clear();

    // Fill
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);

    // Stroke/border for better visibility
    this.bg.lineStyle(1, Button.STROKE_COLOR, Button.STROKE_ALPHA);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    // Pressed effect - subtle shadow
    if (isPressed) {
      this.bg.lineStyle(2, 0x000000, 0.1);
      this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    }
  }

  private setupEvents() {
    // Hover effect
    this.on("pointerover", () => {
      if (this.isDisabled) return;

      this.drawButton(
        Phaser.Display.Color.ValueToColor(this.baseColor).lighten(15).color,
      );

      // Smooth scale animation
      if (this.hoverTween) {
        this.hoverTween.stop();
      }

      this.hoverTween = this.scene.tweens.add({
        targets: this,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: "Back.easeOut",
      });

      if (this.config.onHover) {
        this.config.onHover();
      }
    });

    // Out effect
    this.on("pointerout", () => {
      if (this.isDisabled) return;

      this.drawButton(this.baseColor);

      if (this.hoverTween) {
        this.hoverTween.stop();
      }

      this.hoverTween = this.scene.tweens.add({
        targets: this,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Back.easeIn",
      });

      if (this.config.onHoverOut) {
        this.config.onHoverOut();
      }
    });

    // Down effect
    this.on("pointerdown", () => {
      if (this.isDisabled) return;

      this.drawButton(
        Phaser.Display.Color.ValueToColor(this.baseColor).darken(20).color,
        true,
      );

      // Quick scale down for click feel
      if (this.clickTween) {
        this.clickTween.stop();
      }

      this.clickTween = this.scene.tweens.add({
        targets: this,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: "Power2",
      });
    });

    // Up effect with callback
    this.on("pointerup", () => {
      if (this.isDisabled) return;

      this.drawButton(
        Phaser.Display.Color.ValueToColor(this.baseColor).lighten(10).color,
      );

      // Execute callback after a tiny delay for better feel
      this.scene.time.delayedCall(50, () => {
        if (!this.isDisabled) {
          this.config.onClick();
        }
      });
    });
  }

  private setupKeyboard() {
    // Support keyboard navigation
    this.on("pointerover", () => {
      this.scene.input.keyboard?.on(
        "keydown-ENTER",
        this.handleKeyboardClick,
        this,
      );
      this.scene.input.keyboard?.on(
        "keydown-SPACE",
        this.handleKeyboardClick,
        this,
      );
    });

    this.on("pointerout", () => {
      this.scene.input.keyboard?.off(
        "keydown-ENTER",
        this.handleKeyboardClick,
        this,
      );
      this.scene.input.keyboard?.off(
        "keydown-SPACE",
        this.handleKeyboardClick,
        this,
      );
    });
  }

  private handleKeyboardClick() {
    if (this.isDisabled) return;

    // Visual feedback for keyboard click
    this.drawButton(
      Phaser.Display.Color.ValueToColor(this.baseColor).darken(20).color,
      true,
    );

    this.scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50,
      yoyo: true,
      ease: "Power2",
      onComplete: () => {
        if (!this.isDisabled) {
          this.config.onClick();
          this.drawButton(this.baseColor);
        }
      },
    });
  }

  // --- Public API ---

  public setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  public setEnabled(enabled: boolean): this {
    if (this.isDisabled === !enabled) return this;

    this.isDisabled = !enabled;

    if (enabled) {
      // Enable
      this.drawButton(this.baseColor);
      this.label.setColor("#ffffff");
      this.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -this.config.width! / 2 || -Button.DEFAULT_WIDTH / 2,
          -this.config.height! / 2 || -Button.DEFAULT_HEIGHT / 2,
          this.config.width || Button.DEFAULT_WIDTH,
          this.config.height || Button.DEFAULT_HEIGHT,
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        cursor: "pointer",
        useHandCursor: true,
      });
      this.setupEvents();
      this.setupKeyboard();
    } else {
      // Disable
      this.drawButton(Button.DISABLED_COLOR);
      this.label.setColor("#888888");
      this.removeInteractive();
      this.off("pointerover");
      this.off("pointerout");
      this.off("pointerdown");
      this.off("pointerup");
    }

    return this;
  }

  public setColor(color: number): this {
    this.baseColor = color;
    if (!this.isDisabled) {
      this.drawButton(color);
    }
    return this;
  }

  public getText(): string {
    return this.label.text;
  }

  public isEnabled(): boolean {
    return !this.isDisabled;
  }

  public destroy() {
    // Clean up tweens
    if (this.hoverTween) {
      this.hoverTween.stop();
      this.hoverTween.remove();
    }

    if (this.clickTween) {
      this.clickTween.stop();
      this.clickTween.remove();
    }

    // Remove keyboard listeners
    this.scene.input.keyboard?.off(
      "keydown-ENTER",
      this.handleKeyboardClick,
      this,
    );
    this.scene.input.keyboard?.off(
      "keydown-SPACE",
      this.handleKeyboardClick,
      this,
    );

    super.destroy();
  }
}
