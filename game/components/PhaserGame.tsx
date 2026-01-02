"use client";

import { useEffect, useRef } from "react";
import type Phaser from "phaser";
import AudioManager from "@/game/AudioManager";

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const initPhaser = async () => {
      const PhaserModule = await import("phaser");
      const { phaserConfig } = await import("@/game/config");

      if (!gameRef.current) {
        // Initialize using the imported module
        gameRef.current = new PhaserModule.Game(phaserConfig);
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
