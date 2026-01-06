"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GameOverlay } from "@/game/components/GameOverlay";
import { EventBus } from "@/game/events";

const PhaserGame = dynamic(() => import("@/game/components/PhaserGame"), {
  ssr: false,
});

export default function GamePage() {
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Listen for the signal from Phaser

    const handleReset = () => {
      setIsResetting(true);
    };

    EventBus.on("ui-reset-start", handleReset);

    return () => {
      EventBus.off("ui-reset-start", handleReset);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative shadow-2xl border-4 border-gray-800 rounded-lg overflow-hidden w-[1376px] h-[768px] bg-[#1a1a2e]">
        {isResetting && (
          <div className="absolute inset-0 z-[100] bg-[#1a1a2e] flex flex-col items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-xl tracking-widest">
                Resetting Data...
              </p>
            </div>
          </div>
        )}

        {/* The Game Overlay (HUD) */}
        {isGameLoaded && !isResetting && <GameOverlay />}

        {/* Initial Loader (Only shows on first load) */}
        {!isGameLoaded && !isResetting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a2e] text-white">
            <div className="text-2xl font-mono animate-pulse">
              Loading Game...
            </div>
          </div>
        )}

        {/* The Engine */}
        <div className={isResetting ? "hidden" : "block"}>
          <PhaserGame onBooted={() => setIsGameLoaded(true)} />
        </div>
      </div>
    </div>
  );
}
