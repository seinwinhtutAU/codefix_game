"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  ClipboardPaste,
  ArrowRight,
  Timer,
  Lightbulb,
  Trophy,
  LucideIcon,
  Search,
} from "lucide-react";

// --- TYPES ---

interface ModeBenefit {
  icon: LucideIcon;
  text: string;
}

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "blue" | "amber";
  benefits: ModeBenefit[];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

// --- SUB-COMPONENTS ---

function ModeCard({
  title,
  description,
  icon: Icon,
  color,
  benefits,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: ModeCardProps) {
  const isBlue = color === "blue";

  return (
    <motion.button
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`relative flex flex-col items-start p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 bg-white shadow-sm overflow-hidden h-full ${
        isHovered
          ? isBlue
            ? "border-blue-400 shadow-blue-100"
            : "border-amber-400 shadow-amber-100"
          : "border-slate-100"
      }`}
    >
      <div
        className={`p-4 rounded-2xl mb-6 transition-colors ${
          isHovered
            ? isBlue
              ? "bg-blue-600 text-white"
              : "bg-amber-500 text-white"
            : isBlue
              ? "bg-blue-50 text-blue-500"
              : "bg-amber-50 text-amber-400"
        }`}
      >
        <Icon size={32} strokeWidth={2.5} />
      </div>

      <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-500 mb-8 leading-relaxed text-sm">
        {description}
      </p>

      <div className="space-y-4 w-full flex-1">
        {benefits.map((item, idx) => {
          const BenefitIcon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 text-sm font-semibold text-slate-600"
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isBlue
                    ? "bg-blue-50 text-blue-500"
                    : "bg-amber-50 text-amber-500"
                }`}
              >
                <BenefitIcon size={16} />
              </div>
              {item.text}
            </div>
          );
        })}
      </div>

      <div
        className={`mt-10 flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${
          isHovered
            ? isBlue
              ? "text-blue-600 translate-x-2"
              : "text-amber-500 translate-x-2"
            : "text-slate-400"
        }`}
      >
        Launch {title} <ArrowRight size={16} />
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            layoutId="glow-effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 -z-10 rounded-[2.5rem] blur-2xl opacity-20 ${
              isBlue ? "bg-blue-400" : "bg-amber-400"
            }`}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function ProblemModeSelector() {
  const router = useRouter();
  const [hoveredMode, setHoveredMode] = useState<"game" | "paste" | null>(null);

  const handleNavigation = (path: string) => {
    router.push(`/${path}`);
  };

  const gameBenefits: ModeBenefit[] = [
    { icon: Timer, text: "Timed Performance" },
    { icon: Trophy, text: "Earn Reward Points" },
    { icon: Lightbulb, text: "Full Hint Support" },
  ];

  const pasteBenefits: ModeBenefit[] = [
    { icon: Timer, text: "Infinite Time" },
    { icon: Lightbulb, text: "Full Hint Support" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] w-full bg-[#F7FAFD] flex items-center justify-center p-6 font-sans overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-50/60 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl w-full z-10 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-16"
        >
          {/* HORIZONTAL LOGO: Pulse point on the left */}
          <div className="group cursor-default flex items-center gap-6 mb-8">
            <div className="relative flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-blue-600 animate-pulse" />
              <div className="absolute w-10 h-10 rounded-full bg-blue-400/20 animate-ping" />
            </div>
            <span className="text-4xl md:text-7xl font-black tracking-tighter text-slate-900 transition-all group-hover:tracking-tight">
              CodeFix
            </span>
          </div>

          <div className="flex flex-col items-center">
            <h1 className="text-lg md:text-xl font-medium text-slate-400 mb-2 tracking-[0.3em] uppercase">
              Select{" "}
              <span className="text-slate-900 font-black tracking-normal">
                Mode
              </span>
            </h1>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full mb-6" />
            <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed">
              Choose mode to begin your debugging learning.
            </p>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ModeCard
              title="Game Mode"
              description="A competitive environment where timing and accuracy determine your rewards."
              icon={Gamepad2}
              color="blue"
              benefits={gameBenefits}
              isHovered={hoveredMode === "game"}
              onHover={() => setHoveredMode("game")}
              onLeave={() => setHoveredMode(null)}
              onClick={() => handleNavigation("game")}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ModeCard
              title="Paste Mode"
              description="A stress-free workspace to paste own code and run it"
              icon={ClipboardPaste}
              color="amber"
              benefits={pasteBenefits}
              isHovered={hoveredMode === "paste"}
              onHover={() => setHoveredMode("paste")}
              onLeave={() => setHoveredMode(null)}
              onClick={() => handleNavigation("paste")}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
