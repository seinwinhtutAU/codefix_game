import { IGameProgress } from "@/lib/types";
import { getPlayerProgress, saveGameProgress } from "@/services/game";
import { EventBus } from "./events";

class GameProgressController {
  private static instance: GameProgressController;

  private constructor() {}

  static getInstance() {
    if (!GameProgressController.instance) {
      GameProgressController.instance = new GameProgressController();
    }
    return GameProgressController.instance;
  }

  init() {
    EventBus.on("progress-updated", this.onProgressUpdated);
  }

  destroy() {
    EventBus.off("progress-updated", this.onProgressUpdated);
  }

  private onProgressUpdated = async (progress: IGameProgress) => {
    try {
      await saveGameProgress(progress);
      console.log("[ProgressSync] Progress saved");
    } catch (error) {
      console.error("[ProgressSync] Failed to save progress", error);
    }
  };
}

export default GameProgressController;
