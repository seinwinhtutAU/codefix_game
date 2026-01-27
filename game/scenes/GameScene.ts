// @/game/scenes/GameScene.ts
import Phaser from "phaser";
import { EventBus } from "../events";
import { IGameProgress } from "@/lib/types";
import { initGameAudioEvents } from "../GameAudioController";
import GameProgressController from "../GameProgressController";
import AudioManager from "../AudioManager";

export default class GameScene extends Phaser.Scene {
  // Use a static property or registry to keep data alive across scenes
  protected savedProgress!: IGameProgress;
  private static audioEventsInitialized = false;

  constructor(key: string) {
    super(key);
  }

  init(data?: IGameProgress) {
    if (data) {
      this.savedProgress = data;
    }
  }

  create() {
    // 1. Notify React which scene is active
    EventBus.on("request-current-scene", () => {
      EventBus.emit("ui-scene", this.scene.key);
    });
    const gameProgressController = GameProgressController.getInstance();
    gameProgressController.init();

    if (!GameScene.audioEventsInitialized) {
      initGameAudioEvents();
      GameScene.audioEventsInitialized = true;
    }

    EventBus.emit("ui-scene", this.scene.key);

    // 2. Setup standard listeners
    this.setupUIListeners();
  }

  protected setupUIListeners() {
    EventBus.on("ui-toggle-pause", (shouldPause: boolean) => {
      if (shouldPause) {
        this.scene.pause();
        this.sound.pauseAll();
      } else {
        this.scene.resume();
        this.sound.resumeAll();
      }
    });

    EventBus.on("ui-action", (action: string) => {
      if (action === "replay") {
        // Pass the current progress back into the restarted scene
        this.scene.restart(this.savedProgress);
      } else if (action === "menu") {
        this.scene.start("MainMenuScene", this.savedProgress);
      }
    });

    EventBus.on("ui-toggle-mute", (isMuted: boolean) => {
      this.sound.mute = isMuted;
    });

    // CRITICAL: Clean up to avoid duplicate listeners when switching scenes
    this.events.on("shutdown", () => {
      EventBus.off("ui-toggle-pause");
      EventBus.off("ui-action");
      EventBus.off("ui-toggle-mute");
      EventBus.off("start-scene-progress");
    });
  }
}
