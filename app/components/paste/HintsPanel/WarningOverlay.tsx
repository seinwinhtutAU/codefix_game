"use client";

import { AlertCircle, ArrowRight } from "lucide-react";

interface WarningOverlayProps {
  onGoToExpected: () => void;
  onContinue: () => void;
}

export function WarningOverlay({
  onGoToExpected,
  onContinue,
}: WarningOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="font-bold text-slate-800 mb-2">No Expected Output</h3>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        Without an expected output, AI hints might be inaccurate.
      </p>

      {/* Example */}
      <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 text-left">
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
          Example
        </p>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-violet-600 font-bold">Code:</span>
            <span className="text-slate-600">a = 10 + 1</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ArrowRight size={12} className="text-slate-300" />
            <span className="text-emerald-600 font-bold">Expected Output:</span>
            <span className="bg-emerald-50 px-1 rounded text-emerald-700 font-bold">
              11
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full gap-2">
        <button
          onClick={onGoToExpected}
          className="w-full py-2.5 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
        >
          Go to Expected Output
        </button>
        <button
          onClick={onContinue}
          className="w-full py-2 text-slate-400 text-xs hover:text-slate-600 transition-colors"
        >
          Continue without output
        </button>
      </div>
    </div>
  );
}
