import * as Phaser from "phaser";
// import GameScene from "./scenes/GameScene";
import PreloadScene from "./scenes/PreLoadScene";
import MainMenuScene from "./scenes/MainMenuScene";
import IntroScene from "./scenes/IntroScene";
import CarDriveScene from "./scenes/CarDriveScene";
import OfficeScene from "./scenes/OfficeScene";
import EasyLevelScene from "./scenes/EasyLevelScene";
import MediumLevelScene from "./scenes/MediumLevelScene";
import PlayGroundScene from "./scenes/PlayGroundScene";
import HomeScene from "./scenes/HomeScene";
import EasyToHomeTransitionScene from "./scenes/EasyToHomeTransitionScene";
import BossLevelScene from "./scenes/BossLevelScene";
import WarningScene from "./scenes/WarningScene";
import MediumTransitionScene from "./scenes/MediumTransitionScene";

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "phaser-container",
  backgroundColor: "#1a1a2e",
  width: 1376,
  height: 768,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1376,
    height: 768,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: [
    PreloadScene,
    MainMenuScene,
    IntroScene,
    CarDriveScene,
    OfficeScene,
    EasyLevelScene,
    EasyToHomeTransitionScene,
    HomeScene,
    PlayGroundScene,
    MediumLevelScene,
    MediumTransitionScene,
    WarningScene,
    BossLevelScene,
  ],
};
