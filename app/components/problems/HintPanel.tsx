"use client";

import { useState, useRef, useEffect } from "react";
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  GripVertical,
  X,
  Maximize2,
} from "lucide-react";
import { HintUsage } from "@/lib/types";

type HintLevel = "small" | "medium" | "big";

interface Props {
  hints: { small?: string[]; medium?: string[]; big?: string[] };
  hintUsages: HintUsage[]; // Added hintUsages
  isVisible: boolean;
  onClose?: () => void;
  onHintUsed?: (hintId: string, hintLevel: HintLevel) => void;
  onResize?: (width: number) => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function HintsPanel({
  hints,
  hintUsages,
  isVisible,
  onHintUsed,
  onClose,
  onResize,
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 500,
}: Props) {
  const [selectedLevel, setSelectedLevel] = useState<HintLevel | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentHints = selectedLevel ? hints[selectedLevel] || [] : [];
  const levels: HintLevel[] = ["small", "medium", "big"];

  // Sync internal used levels state from props
  const usedHintLevels = new Set(hintUsages.map((u) => u.hintLevel));

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.min(
        Math.max(startWidth + deltaX, minWidth),
        maxWidth,
      );
      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    document.body.style.cursor = isResizing ? "col-resize" : "";
    document.body.style.userSelect = isResizing ? "none" : "";
  }, [isResizing]);

  const handleHintNavigation = (newIndex: number) => {
    if (!selectedLevel) return;
    setHintIndex(newIndex);

    const hintId = `${selectedLevel}-hint-${newIndex}`;
    // Check if this specific hint/level combo exists in hintUsages
    const alreadyUsed = hintUsages.some((u) => u.hintId === hintId);

    if (!alreadyUsed && onHintUsed) {
      onHintUsed(hintId, selectedLevel);
    }
  };

  const getHighestUsedLevel = (): HintLevel | "none" => {
    if (usedHintLevels.has("big")) return "big";
    if (usedHintLevels.has("medium")) return "medium";
    if (usedHintLevels.has("small")) return "small";
    return "none";
  };

  const handleLevelSelect = (level: HintLevel) => {
    setSelectedLevel(level);
    setHintIndex(0);

    const hintId = `${level}-hint-0`;
    const alreadyUsed = hintUsages.some((u) => u.hintId === hintId);

    if (!alreadyUsed && onHintUsed) {
      onHintUsed(hintId, level);
    }
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setHintIndex(0);
  };

  const handleClose = () => {
    setSelectedLevel(null);
    setHintIndex(0);
    onClose?.();
  };

  const renderHintContent = () => (
    <div className="flex-1 overflow-hidden p-4 bg-white flex flex-col">
      <div className="h-full overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {!selectedLevel && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-2">
              <p className="text-xs text-slate-500">
                Stuck? Select a hint level below.
                <span className="block text-[10px] text-amber-600 mt-1 font-medium">
                  Note: Using hints will affect your final score.
                </span>
              </p>
            </div>

            <div className="space-y-3">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className={`flex flex-col w-full p-4 rounded-xl border transition-all text-left shadow-sm ${
                    usedHintLevels.has(level)
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {usedHintLevels.has(level) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      <span className="capitalize font-bold text-slate-700">
                        {level} Hint
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {hints[level]?.length || 0} hint
                      {hints[level]?.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Max Score:
                      <span className="text-indigo-500 ml-1">
                        {level === "small" && "90"}
                        {level === "medium" && "70"}
                        {level === "big" && "50"} pts
                      </span>
                    </span>
                    {usedHintLevels.has(level) && (
                      <span className="text-amber-600 font-bold text-[10px] uppercase tracking-wide">
                        Unlocked
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedLevel && currentHints.length > 0 && (
          <div className="space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <button
                onClick={handleBackToLevels}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:border-indigo-100"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-xs font-bold text-amber-700 capitalize">
                  {selectedLevel} Hint
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-1 text-xs text-slate-400 font-medium shrink-0">
              <span>
                Tip {hintIndex + 1} of {currentHints.length}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={hintIndex === 0}
                  onClick={() => handleHintNavigation(hintIndex - 1)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 border border-slate-200 text-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={hintIndex === currentHints.length - 1}
                  onClick={() => handleHintNavigation(hintIndex + 1)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 border border-slate-200 text-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 shadow-sm flex-1 overflow-auto">
              <div className="flex gap-3">
                <Lightbulb
                  size={18}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {currentHints[hintIndex]}
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedLevel && currentHints.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80">
            <div className="mb-3 p-3 bg-slate-50 rounded-full border border-slate-100">
              <AlertCircle size={24} className="text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-600 mb-1">
              No Hints Found
            </h4>
            <button
              onClick={handleBackToLevels}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 hover:underline"
            >
              Select another level
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={panelRef}
        className="h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative"
        style={{ width: `${width}px` }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-20 hover:bg-amber-50 group flex items-center justify-center transition-colors"
          onMouseDown={handleResizeStart}
        >
          <div className="h-8 w-1 rounded-full bg-slate-200 group-hover:bg-amber-300 transition-colors" />
        </div>

        <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0 h-14">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-100">
              <Lightbulb size={16} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Hints</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {getHighestUsedLevel() !== "none"
                  ? `Current Level: ${getHighestUsedLevel()}`
                  : "No hints used yet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {renderHintContent()}

        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <AlertCircle size={10} className="text-amber-500" />
              Hints reduce score
            </span>
            <span>
              {hintUsages.length > 0
                ? `${hintUsages.length} Tips Unlocked`
                : "0 Used"}
            </span>
          </div>
        </div>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsFullScreen(false)}
          />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-100">
                  <Lightbulb size={20} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-slate-800">Hints Support</h3>
              </div>
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {renderHintContent()}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                Note: Hints significantly impact final decryption score.
              </span>
              <div className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                Total Unlocked: {hintUsages.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
