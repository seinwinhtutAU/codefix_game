import * as Phaser from "phaser";
// import GameScene from "./scenes/GameScene";
import PreloadScene from "./scenes/PreLoadScene";
import MainMenuScene from "./scenes/MainMenuScene";
import IntroScene from "./scenes/IntroScene";
import CarDriveScene from "./scenes/CarDriveScene";
import OfficeScene from "./scenes/OfficeScene";
import MediumLevelScene from "./scenes/MediumLevelScene";
import HardLevelScene from "./scenes/HardLevelScene";
import PlayGroundScene from "./scenes/PlayGroundScene";
import HomeScene from "./scenes/HomeScene";
import BossLevelScene from "./scenes/BossLevelScene";
import WarningScene from "./scenes/WarningScene";
import LevelScene from "./scenes/LevelScene";
import MediumToHomeScene from "./scenes/MediumToHomeScene";
import HardToWarningScene from "./scenes/HardToWarningScene";

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
    LevelScene,
    IntroScene,
    CarDriveScene,
    OfficeScene,
    MediumLevelScene,
    MediumToHomeScene,
    HomeScene,
    PlayGroundScene,
    HardLevelScene,
    HardToWarningScene,
    WarningScene,
    BossLevelScene,
  ],
};
