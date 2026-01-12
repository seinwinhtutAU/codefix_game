"use client";

import { useEffect, useRef } from "react";
import type Phaser from "phaser";
import AudioManager from "@/game/AudioManager";
import { getPlayerProgress } from "@/services/game";
import { EventBus } from "../events";

export default function PhaserGame({ onBooted }: { onBooted: () => void }) {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const initPhaser = async () => {
      // Phase 1: Background work
      const progress = await getPlayerProgress();
      const PhaserModule = await import("phaser");
      const { phaserConfig } = await import("@/game/config");

      if (!gameRef.current) {
        const game = new PhaserModule.Game(phaserConfig);
        gameRef.current = game;

        game.events.once("ready", () => {
          EventBus.emit("start-scene-progress", progress);
          onBooted();
        });
      }
    };

    initPhaser();

    return () => {
      AudioManager.getInstance().stopMusic();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div id="phaser-container" />;
}
