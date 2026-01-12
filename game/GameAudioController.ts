import AudioManager from "@/game/AudioManager";
import { EventBus } from "@/game/events";

export function initGameAudioEvents() {
  const audio = AudioManager.getInstance();

  // Stop BGM when problem UI opens
  EventBus.on("ui-open-problem", () => {
    audio.stopMusic();
  });

  // Resume BGM when problem UI closes
  EventBus.on("ui-close-problem", () => {
    audio.playMusic("menu-bgm", {
      loop: true,
      volume: 0.15,
    });
  });
}
