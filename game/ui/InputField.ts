import Phaser from "phaser";

export interface InputFieldConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  placeholder?: string;
  maxLength?: number;
  onConfirm?: (val: string) => void;
  onCancel?: () => void;
}

export default class InputField extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private displayText: Phaser.GameObjects.Text;
  private currentInput: string = "";
  private isBlinking: boolean = true;
  private isActive: boolean = false;
  private config: InputFieldConfig;
  private pointerDownHandler!: (pointer: Phaser.Input.Pointer) => void;
  private keyDownHandler!: (event: KeyboardEvent) => void;
  private cursorBlinkEvent?: Phaser.Time.TimerEvent;

  private static readonly DEFAULT_WIDTH = 400;
  private static readonly DEFAULT_HEIGHT = 40;
  private static readonly DEFAULT_MAX_LENGTH = 50;

  constructor(scene: Phaser.Scene, config: InputFieldConfig) {
    super(scene, config.x, config.y);
    this.config = config;
    const w = config.width || InputField.DEFAULT_WIDTH;
    const h = config.height || InputField.DEFAULT_HEIGHT;

    // 1. Setup Graphics
    this.bg = scene.add.graphics();

    // 2. Setup Text
    this.displayText = scene.add
      .text(-w / 2 + 10, 0, config.placeholder || "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: "#aaaaaa",
      })
      .setOrigin(0, 0.5);

    this.add([this.bg, this.displayText]);

    // 3. Setup Interactive Area (simpler approach)
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      cursor: "text",
    });

    this.drawBackground(0xffffff); // Draw initial state
    scene.add.existing(this);

    this.setupInteractions();
    this.setupKeyboard();
    this.startCursorBlink();
    this.setVisible(false);
  }

  private drawBackground(color: number, borderColor: number = 0xcccccc) {
    const w = this.config.width || InputField.DEFAULT_WIDTH;
    const h = this.config.height || InputField.DEFAULT_HEIGHT;
    this.bg.clear();
    this.bg.fillStyle(color, 1);
    this.bg.lineStyle(1, borderColor, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
  }

  private setupInteractions() {
    this.on("pointerover", () => {
      if (!this.isActive) {
        this.drawBackground(0xf2f2f2); // Gray hover
      }
    });

    this.on("pointerout", () => {
      if (!this.isActive) {
        this.drawBackground(0xffffff); // White out
      }
    });

    this.on("pointerdown", () => {
      this.activate();
    });

    // Handle clicks outside to deactivate
    this.pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      if (!this.visible || !this.isActive) return;

      const worldPos = this.getWorldTransformMatrix();
      const w = this.config.width || InputField.DEFAULT_WIDTH;
      const h = this.config.height || InputField.DEFAULT_HEIGHT;

      // Check if the click was outside this box
      if (
        pointer.x < worldPos.tx - w / 2 ||
        pointer.x > worldPos.tx + w / 2 ||
        pointer.y < worldPos.ty - h / 2 ||
        pointer.y > worldPos.ty + h / 2
      ) {
        this.deactivate();
      }
    };

    this.scene.input.on("pointerdown", this.pointerDownHandler);
  }

  private setupKeyboard() {
    this.keyDownHandler = (event: KeyboardEvent) => {
      if (!this.visible || !this.isActive) return;

      const maxLength = this.config.maxLength || InputField.DEFAULT_MAX_LENGTH;

      switch (event.key) {
        case "Enter":
          this.config.onConfirm?.(this.currentInput);
          this.deactivate();
          break;

        case "Escape":
          this.deactivate();
          if (this.config.onCancel) {
            this.config.onCancel();
          }
          break;

        case "Tab":
          // Allow tab to pass through (could be used for field navigation)
          break;

        case "Backspace":
          this.currentInput = this.currentInput.slice(0, -1);
          this.updateDisplay();
          break;

        case "a":
          // Ctrl+A for select all
          if (event.ctrlKey || event.metaKey) {
            // Could implement text selection here
            event.preventDefault();
          } else {
            this.addCharacter(event.key);
          }
          break;

        case "c":
        case "v":
          // Allow copy/paste shortcuts
          if (event.ctrlKey || event.metaKey) {
            // Let browser handle these
            return;
          }
          this.addCharacter(event.key);
          break;

        default:
          if (event.key.length === 1) {
            this.addCharacter(event.key);
          }
          break;
      }
    };

    this.scene.input.keyboard?.on("keydown", this.keyDownHandler);
  }

  private addCharacter(char: string) {
    const maxLength = this.config.maxLength || InputField.DEFAULT_MAX_LENGTH;
    if (this.currentInput.length < maxLength) {
      this.currentInput += char;
      this.updateDisplay();
    }
  }

  private updateDisplay() {
    let displayText = this.currentInput;

    if (this.currentInput.length === 0 && !this.isActive) {
      displayText = this.config.placeholder || "";
      this.displayText.setColor("#aaaaaa");
    } else {
      this.displayText.setColor("#333333");
    }

    // Only add cursor in the blink timer, not here
    this.displayText.setText(displayText);
  }

  private startCursorBlink() {
    // Stop any existing blink timer
    this.stopCursorBlink();

    this.cursorBlinkEvent = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (!this.visible || !this.isActive) {
          // Make sure we're showing text without cursor when not active
          this.displayText.setText(
            this.currentInput || this.config.placeholder || "",
          );
          return;
        }

        this.isBlinking = !this.isBlinking;

        let displayText = this.currentInput;
        if (this.isBlinking) {
          displayText += "|";
        }

        this.displayText.setText(displayText);
        this.displayText.setColor("#333333");
      },
    });
  }

  private stopCursorBlink() {
    if (this.cursorBlinkEvent) {
      this.cursorBlinkEvent.remove();
      this.cursorBlinkEvent.destroy();
      this.cursorBlinkEvent = undefined;
    }
  }

  private activate() {
    if (this.isActive) return;

    this.isActive = true;
    this.drawBackground(0xffffff, 0x4d90fe); // White with Blue border
    this.updateDisplay();
    this.isBlinking = true;

    // Restart blinking to ensure cursor appears immediately
    this.startCursorBlink();
  }

  private deactivate() {
    if (!this.isActive) return;

    this.isActive = false;
    this.drawBackground(0xffffff);
    this.updateDisplay();
    // Keep blinking timer running but it won't show cursor when not active
  }

  public show() {
    this.setVisible(true);
    this.deactivate();
    this.currentInput = "";
    this.drawBackground(0xffffff);
    this.updateDisplay();
    this.startCursorBlink(); // Ensure blink timer is running
  }

  public hide() {
    this.setVisible(false);
    this.deactivate();
  }

  public getValue(): string {
    return this.currentInput;
  }

  public setValue(value: string): void {
    const maxLength = this.config.maxLength || InputField.DEFAULT_MAX_LENGTH;
    this.currentInput = value.slice(0, maxLength);
    this.updateDisplay();
  }

  public clear(): void {
    this.currentInput = "";
    this.updateDisplay();
  }

  public focus(): void {
    this.activate();
  }

  public blur(): void {
    this.deactivate();
  }

  public destroy() {
    // Clean up event listeners
    this.stopCursorBlink();

    if (this.pointerDownHandler) {
      this.scene.input.off("pointerdown", this.pointerDownHandler);
    }

    if (this.keyDownHandler) {
      this.scene.input.keyboard?.off("keydown", this.keyDownHandler);
    }

    super.destroy();
  }
}
