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

    // 1. Background
    this.bg = scene.add.graphics();
    this.drawButton(this.isDisabled ? Button.DISABLED_COLOR : this.baseColor);

    // 2. Text
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
    this.setSize(w, h);

    // ---------------------------------------------------------
    // 🔥 FIX: Define a Centered Hit Area
    // ---------------------------------------------------------
    // By default, setInteractive uses (0,0) as top-left.
    // Since we draw our graphics centered at (0,0) (using -w/2),
    // we must offset the hit area to match.
    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);

    // 2. Pass a SINGLE config object
    this.setInteractive({
      hitArea: hitArea,
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      cursor: this.isDisabled ? "default" : "pointer",
    });

    // 3. Setup Events
    // We always setup events, but we check 'isDisabled' inside them
    this.setupPointerEvents();
    this.setupKeyboardEvents();

    // 4. Handle initial state
    if (this.isDisabled) {
      if (this.input) this.input.enabled = false;
    }

    scene.add.existing(this);
  }

  // --- Helper to play sound ---
  private playClickSound() {
    // Uses the existing AudioManager singleton
    AudioManager.getInstance().playSound("click", { volume: 0.5 });
  }

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

    this.on("pointerdown", () => {
      if (this.isDisabled) return;

      this.playClickSound();

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

  private setupKeyboardEvents() {
    // Clean up old listeners if they exist to prevent duplicates
    // (Though usually this is only called once in constructor)
    const keyEnter = this.scene.input.keyboard?.addKey("ENTER");
    const keySpace = this.scene.input.keyboard?.addKey("SPACE");

    const handler = (event: KeyboardEvent) => {
      // Only trigger if this button is "focused" or globally if that's intended.
      // NOTE: For a UI button, usually you only want keyboard events if it's selected.
      // If you want GLOBAL enter/space to trigger this, keep as is.
      // If not, you might need a focus management system.
      // Assuming global trigger based on your snippet:

      if (this.isDisabled) return;

      this.playClickSound();

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

    // Using the event emitter pattern from your snippet
    this.scene.input.keyboard?.on("keydown-ENTER", handler);
    this.scene.input.keyboard?.on("keydown-SPACE", handler);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.input.keyboard?.off("keydown-ENTER", handler);
      this.scene.input.keyboard?.off("keydown-SPACE", handler);
    });
  }

  /**
   * Enables or disables the button.
   * FIX: We toggle this.input.enabled instead of removing the component.
   */
  public setEnabled(enabled: boolean): this {
    this.isDisabled = !enabled;

    if (enabled) {
      this.label.setColor("#ffffff");
      this.drawButton(this.baseColor);

      // Re-enable input without destroying the hit area
      if (this.input) {
        this.input.enabled = true;
        this.input.cursor = "pointer";
      }
    } else {
      this.label.setColor("#888888");
      this.drawButton(Button.DISABLED_COLOR);

      // Disable input but keep the component
      if (this.input) {
        this.input.enabled = false;
        this.input.cursor = "default";
      }
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
