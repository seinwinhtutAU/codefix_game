"use client";

import { useRef } from "react";
import { Terminal, Target, X, WrapText, Info } from "lucide-react";
import { TabButton } from "./TabButton";
import { TerminalContent } from "./TerminalContent";
import { ExpectedOutputContent } from "./ExpectedOutputContent";
import { ActiveTab } from "@/lib/types";

interface OutputPanelProps {
  isVisible: boolean;
  height: number;
  activeTab: ActiveTab;
  wordWrap: boolean;
  isSubmitting: boolean;
  isContinuing: boolean;
  sessionHistory: Array<{
    type: "output" | "input";
    content: string;
    isError?: boolean;
  }>;
  expectedOutput: string;
  showWarning: boolean;
  waitingForInput: boolean;
  onResizeStart: () => void;
  onTabChange: (tab: ActiveTab) => void;
  onWordWrapToggle: () => void;
  onClose: () => void;
  onExpectedOutputChange: (value: string) => void;
  onInputSubmit: (input: string) => void;
  extraInfo: string;
  setExtraInfo: (value: string) => void;
}

export function OutputPanel({
  isVisible,
  height,
  activeTab,
  wordWrap,
  isSubmitting,
  isContinuing,
  sessionHistory,
  expectedOutput,
  extraInfo,
  showWarning,
  waitingForInput,
  onResizeStart,
  onTabChange,
  onWordWrapToggle,
  onClose,
  onExpectedOutputChange,
  setExtraInfo,
  onInputSubmit,
}: OutputPanelProps) {
  const outputRef = useRef<HTMLPreElement>(null);

  if (!isVisible) return null;

  return (
    <div
      className="bg-white border-t border-slate-200 flex flex-col relative z-10"
      style={{ height: `${height}px` }}
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-violet-400 transition-colors"
      />

      <div className="flex justify-between items-center px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <TabButton
            active={activeTab === "terminal"}
            onClick={() => onTabChange("terminal")}
            icon={<Terminal size={14} />}
            label="Terminal"
          />

          <TabButton
            active={activeTab === "expected"}
            onClick={() => onTabChange("expected")}
            icon={<Target size={14} />}
            label="Expected Output"
            showWarning={showWarning}
          />

          {/* New Description Tab */}

          <TabButton
            active={activeTab === "description"}
            onClick={() => onTabChange("description")}
            icon={<Info size={14} />}
            label="Description"
            color="amber"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onWordWrapToggle}
            className={`p-1.5 rounded-md transition-colors ${
              wordWrap
                ? "text-violet-600 bg-violet-50"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            <WrapText size={14} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 bg-white overflow-hidden">
        <div
          className={`h-full rounded-xl bg-slate-50 border overflow-hidden transition-colors duration-300 ${
            showWarning && activeTab === "expected"
              ? "border-rose-200 bg-rose-50/30"
              : "border-slate-200/60"
          }`}
        >
          {activeTab === "terminal" ? (
            <TerminalContent
              ref={outputRef}
              isSubmitting={isSubmitting}
              isContinuing={isContinuing}
              sessionHistory={sessionHistory}
              wordWrap={wordWrap}
              waitingForInput={waitingForInput}
              onInputSubmit={onInputSubmit}
            />
          ) : activeTab === "expected" ? (
            <ExpectedOutputContent
              value={expectedOutput}
              onChange={onExpectedOutputChange}
            />
          ) : (
            /* New Description Content */

            <textarea
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              placeholder="Describe what you are trying to achieve or the specific issue you're having..."
              className="w-full h-full p-4 text-sm font-sans text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
