"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { EventBus } from "@/game/events";
import { GameNotificationProps } from "@/game/components/GameNotification";
import AudioManager from "@/game/AudioManager";

const PhaserGame = dynamic(() => import("@/game/components/PhaserGame"), {
  ssr: false,
});

const GameOverlay = dynamic(
  () => import("@/game/components/GameOverlay").then((mod) => mod.GameOverlay),
  {
    ssr: false,
  }
);

const ProblemOverlay = dynamic(
  () =>
    import("@/game/components/ProblemOverlay").then(
      (mod) => mod.ProblemOverlay
    ),
  {
    ssr: false,
  }
);

const GameNotification = dynamic(
  () =>
    import("@/game/components/GameNotification").then(
      (mod) => mod.GameNotification
    ),
  {
    ssr: false,
  }
);

export default function GamePage() {
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<GameNotificationProps | null>(null);

  useEffect(() => {
    // --- RESET LOGIC ---
    const handleReset = () => {
      setIsResetting(true);
      setActiveProblemId(null);
      setNotification(null);
    };

    // --- PROBLEM OVERLAY LOGIC ---
    const handleOpenProblem = (id: string) => {
      setActiveProblemId(id);
    };

    // --- NOTIFICATION LOGIC ---
    // This allows Phaser scenes to trigger popups via EventBus.emit('show-notification', { ... })
    const handleShowNotification = (config: GameNotificationProps) => {
      setNotification(config);
    };

    const handleHideNotification = () => {
      setNotification(null);
    };

    EventBus.on("ui-reset-start", handleReset);
    EventBus.on("ui-open-problem", handleOpenProblem);
    EventBus.on("show-notification", handleShowNotification);
    EventBus.on("hide-notification", handleHideNotification);

    return () => {
      EventBus.off("ui-reset-start", handleReset);
      EventBus.off("ui-open-problem", handleOpenProblem);
      EventBus.off("show-notification", handleShowNotification);
      EventBus.off("hide-notification", handleHideNotification);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-0 md:p-4">
      {/* 16:9 RESPONSIVE CONTAINER 
          Maintains ratio and scales based on screen width up to 1376px
      */}
      <div className="relative shadow-2xl border-4 border-gray-800 rounded-lg overflow-hidden w-full max-w-[1376px] aspect-video bg-[#1a1a2e]">
        {/* 1. DATA RESET OVERLAY (Highest Z-Index) */}
        {isResetting && (
          <div className="absolute inset-0 z-[300] bg-[#1a1a2e] flex flex-col items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-xl tracking-widest text-blue-400">
                DATA RESETTING...
              </p>
            </div>
          </div>
        )}

        {/* 2. REUSABLE NOTIFICATIONS (Popups like Game Over / Level Clear) */}
        <AnimatePresence>
          {notification && (
            <GameNotification
              key="game-notification"
              {...notification}
              onConfirm={() => {
                if (notification.onConfirm) notification.onConfirm();
                setNotification(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* 3. CODING CHALLENGE OVERLAY */}
        {activeProblemId && !isResetting && (
          <div className="absolute inset-0 z-[150]">
            <ProblemOverlay
              problemId={activeProblemId}
              onClose={() => {
                setActiveProblemId(null);
                EventBus.emit("ui-close-problem");
              }}
            />
          </div>
        )}

        {/* 4. HUD / GAME OVERLAY */}
        {isGameLoaded && !isResetting && !activeProblemId && (
          <div className="absolute inset-0 z-40 pointer-events-none">
            <GameOverlay />
          </div>
        )}

        {/* 5. INITIAL ENGINE LOADER */}
        {!isGameLoaded && !isResetting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a2e] text-white">
            <div className="text-2xl font-mono animate-pulse tracking-tighter">
              GAME LOADING...
            </div>
          </div>
        )}

        {/* 6. PHASER GAME CANVAS */}
        <div className={`w-full h-full ${isResetting ? "hidden" : "block"}`}>
          <PhaserGame onBooted={() => setIsGameLoaded(true)} />
        </div>
      </div>
    </div>
  );
}
