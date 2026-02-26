"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { WarningOverlay } from "./WarningOverlay";
import { HintsList } from "./HintsList";
import { EmptyHintsState } from "./EmptyHintsState";
import { HintLevel } from "@/lib/types";

interface HintsPanelProps {
  isVisible: boolean;
  hints: string[];
  hintLevel: HintLevel;
  isGenerating: boolean;
  isSubmitting: boolean;
  code: string;
  showWarning: boolean;
  onHintLevelChange: (level: HintLevel) => void;
  onGetHint: (force?: boolean) => void;
  onDismissWarning: () => void;
  onGoToExpectedOutput: () => void;
}

export function HintsPanel({
  isVisible,
  hints,
  hintLevel,
  isGenerating,
  isSubmitting,
  code,
  showWarning,
  onHintLevelChange,
  onGetHint,
  onDismissWarning,
  onGoToExpectedOutput,
}: HintsPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="w-[380px] flex flex-col bg-white border-l border-slate-100 shrink-0 relative">
      {/* Warning Overlay */}
      {showWarning && (
        <WarningOverlay
          onGoToExpected={onGoToExpectedOutput}
          onContinue={() => onGetHint(true)}
        />
      )}

      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-amber-50/20">
        <div className="flex items-center gap-2 text-amber-600">
          <Sparkles size={18} />
          <span className="text-sm font-bold">Hints</span>
        </div>
        <select
          value={hintLevel}
          onChange={(e) => onHintLevelChange(e.target.value as HintLevel)}
          className="text-[11px] bg-white border border-amber-200 rounded px-2 py-0.5 outline-none font-bold text-amber-700 cursor-pointer hover:bg-amber-50 transition-colors"
        >
          <option value="small">small</option>
          <option value="medium">medium</option>
          <option value="big">big</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {hints.length > 0 ? <HintsList hints={hints} /> : <EmptyHintsState />}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => onGetHint(false)}
          disabled={isGenerating || !code.trim() || isSubmitting}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating || isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          Get AI Hint
        </button>
      </div>
    </div>
  );
}
