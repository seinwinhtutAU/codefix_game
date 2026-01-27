"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { EventBus } from "../events";

export function GameOverlay() {
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [scene, setScene] = useState("PreloadScene");

  const togglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    EventBus.emit("ui-toggle-pause", nextState);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    EventBus.emit("ui-toggle-mute", nextMute);
  };

  const goToHome = () => {
    setIsPaused(false);
    EventBus.emit("ui-action", "menu");
  };

  useEffect(() => {
    const handleScene = (value: string) => {
      setScene(value);
    };

    EventBus.on("ui-scene", handleScene);
    EventBus.emit("request-current-scene");

    return () => {
      EventBus.off("ui-scene", handleScene);
    };
  }, []);

  // 1. Completely hide everything during Preload
  if (scene === "PreloadScene") return null;

  // 2. Determine if we are on Main Menu to filter buttons
  const isMainMenu = scene === "MainMenuScene";

  return (
    <div className="absolute inset-0 pointer-events-none font-mono">
      {/* --- TOP HUD CONTROLS --- */}
      <div className="absolute top-6 right-6 flex items-center gap-4 pointer-events-auto">
        {/* HOME BUTTON - Hide on Main Menu */}
        {!isMainMenu && (
          <button
            onClick={goToHome}
            className="transition-all active:scale-90 hover:brightness-110"
          >
            <Image
              src="/ui/Buttons-home.png"
              alt="Home Button"
              width={38}
              height={38}
              style={{ width: "38px", height: "auto" }}
              className="object-contain"
              priority
            />
          </button>
        )}

        {/* MUTE TOGGLE - Always shows (Main Menu & Levels) */}
        <button
          onClick={toggleMute}
          className="transition-all active:scale-90 hover:brightness-110"
        >
          <Image
            src={isMuted ? "/ui/Buttons-unmute.png" : "/ui/Buttons-mute.png"}
            alt="Volume Toggle"
            width={38}
            height={38}
            style={{ width: "38px", height: "auto" }}
            className="object-contain"
            priority
          />
        </button>

        {/* PAUSE TOGGLE - Hide on Main Menu */}
        {!isMainMenu && (
          <button
            onClick={togglePause}
            className="transition-all active:scale-90 hover:brightness-110"
          >
            <Image
              src={
                isPaused ? "/ui/Buttons-resume.png" : "/ui/Buttons-pause.png"
              }
              alt="Pause Toggle"
              width={38}
              height={38}
              style={{ width: "38px", height: "auto" }}
              className="object-contain"
              priority
            />
          </button>
        )}
      </div>

      {/* PAUSE INDICATOR */}
      {isPaused && !isMainMenu && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-black/60 px-6 py-2 rounded-full border border-white/20">
            <p className="text-white text-xl font-bold tracking-widest">
              GAME PAUSED
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
