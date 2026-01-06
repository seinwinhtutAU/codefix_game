"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { EventBus } from "@/game/events";
import { Trophy, AlertTriangle, CheckCircle2, Star } from "lucide-react";

export type NotificationType = "SUCCESS" | "GAMEOVER" | "LEVEL_UP" | "VICTORY";

export interface GameNotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmLabel?: string;
}

const THEMES = {
  SUCCESS: {
    color: "text-green-400",
    border: "border-green-500/50",
    bg: "bg-green-950/90",
    icon: <CheckCircle2 className="w-12 h-12 text-green-400" />,
    sound: "success-chime",
  },
  GAMEOVER: {
    color: "text-red-500",
    border: "border-red-500/50",
    bg: "bg-red-950/90",
    icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
    sound: "game-over-sting",
  },
  LEVEL_UP: {
    color: "text-blue-400",
    border: "border-blue-500/50",
    bg: "bg-blue-950/90",
    icon: <Trophy className="w-12 h-12 text-blue-400" />,
    sound: "level-up-fanfare",
  },
  VICTORY: {
    color: "text-yellow-400",
    border: "border-yellow-500/50",
    bg: "bg-yellow-950/90",
    icon: <Star className="w-12 h-12 text-yellow-400" />,
    sound: "victory-music",
  },
};

export function GameNotification({
  type,
  title,
  message,
  onConfirm,
  confirmLabel = "CONTINUE",
}: GameNotificationProps) {
  const theme = THEMES[type];

  useEffect(() => {
    // Play the associated sound via Phaser's AudioManager
    EventBus.emit("play-ui-sound", theme.sound);
  }, [type, theme.sound]);

  return (
    <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.1, opacity: 0 }}
        className={`relative w-full max-w-md p-8 rounded-2xl border-2 ${theme.bg} ${theme.border} shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center`}
      >
        {/* Glow Effect */}
        <div className={`absolute -inset-1 blur-2xl opacity-20 ${theme.bg}`} />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {theme.icon}
          </motion.div>

          <h2
            className={`text-4xl font-mono font-bold tracking-tighter ${theme.color}`}
          >
            {title.toUpperCase()}
          </h2>

          <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6">
            {message}
          </p>

          {onConfirm && (
            <button
              onClick={() => {
                EventBus.emit("play-ui-sound", "click");
                onConfirm();
              }}
              className={`px-8 py-3 rounded-lg font-mono font-bold transition-all active:scale-95
                ${theme.bg} border ${theme.border} ${theme.color} hover:bg-white hover:text-black`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
