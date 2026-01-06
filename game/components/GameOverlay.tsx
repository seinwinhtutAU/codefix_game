"use client";

import { useEffect, useState } from "react";
import { EventBus } from "../events";

export function GameOverlay() {
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [scene, setScene] = useState("MainMenuScene");

  const togglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    // Tell Phaser to pause or resume
    EventBus.emit("ui-toggle-pause", nextState);
  };

  const handleAction = (action: string) => {
    setIsPaused(false);
    EventBus.emit("ui-action", action);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    EventBus.emit("ui-toggle-mute", !isMuted);
  };

  useEffect(() => {
    const handleScene = (value: string) => {
      setScene(value);
    };

    EventBus.on("ui-scene", handleScene);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
      {/* Top Bar for Mute/Pause */}
      <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
        <button
          onClick={toggleMute}
          className="bg-gray-800 p-2 rounded text-white hover:bg-gray-700"
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        {scene !== "MainMenuScene" && (
          <button
            onClick={togglePause}
            className="bg-blue-600 p-2 rounded text-white hover:bg-blue-500"
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
        )}
      </div>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="pointer-events-auto bg-black/70 p-8 rounded-xl border-2 border-white/20 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Paused
          </h2>
          <button
            onClick={togglePause}
            className="w-full py-2 bg-green-600 text-white rounded font-bold"
          >
            RESUME
          </button>
          <button
            onClick={() => handleAction("replay")}
            className="w-full py-2 bg-yellow-600 text-white rounded font-bold"
          >
            RESTART
          </button>
          <button
            onClick={() => handleAction("menu")}
            className="w-full py-2 bg-red-600 text-white rounded font-bold"
          >
            MAIN MENU
          </button>
        </div>
      )}
    </div>
  );
}
