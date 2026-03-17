import Phaser from "phaser";
import Button from "./Button";

export interface SkipButtonConfig {
  onClick: () => void;
  x?: number;
  y?: number;
}

export default class SkipButton extends Button {
  constructor(scene: Phaser.Scene, config: SkipButtonConfig) {
    const x = config.x ?? 60;
    const y = config.y ?? scene.scale.height - 40;
    super(scene, {
      x,
      y,
      width: 46,
      height: 36,
      text: ">>",
      color: 0x4b5563,
      textStyle: {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
      },
      onClick: config.onClick,
    });

    this.setDepth(1000);
  }
}
