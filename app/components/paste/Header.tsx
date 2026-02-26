"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Code2,
  Terminal,
  Sparkles,
  Play,
  Loader2,
} from "lucide-react";

interface HeaderProps {
  isOutputVisible: boolean;
  isHintsVisible: boolean;
  isSubmitting: boolean;
  onToggleOutput: () => void;
  onToggleHints: () => void;
  onRunCode: () => void;
}

export function Header({
  isOutputVisible,
  isHintsVisible,
  isSubmitting,
  onToggleOutput,
  onToggleHints,
  onRunCode,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
            <Code2 size={18} />
          </div>
          <h1 className="font-bold text-slate-700">Paste & Debug</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleOutput}
          className={`p-2 rounded-lg transition-colors ${
            isOutputVisible
              ? "bg-violet-50 text-violet-600"
              : "text-slate-400 hover:bg-slate-50"
          }`}
          aria-label="Toggle terminal"
        >
          <Terminal size={18} />
        </button>
        <button
          onClick={onToggleHints}
          className={`p-2 rounded-lg transition-colors ${
            isHintsVisible
              ? "bg-amber-50 text-amber-600"
              : "text-slate-400 hover:bg-slate-50"
          }`}
          aria-label="Toggle hints"
        >
          <Sparkles size={18} />
        </button>
        <div className="w-[1px] h-6 bg-slate-100 mx-1" />
        <button
          onClick={onRunCode}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-violet-600 text-white px-5 py-1.5 rounded-lg text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          Run Code
        </button>
      </div>
    </header>
  );
}
