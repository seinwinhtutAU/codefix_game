"use client";

import { forwardRef, KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";

interface TerminalContentProps {
  isSubmitting: boolean;
  isContinuing: boolean;
  sessionHistory: Array<{
    type: "output" | "input";
    content: string;
    isError?: boolean;
  }>;
  wordWrap: boolean;
  waitingForInput: boolean;
  onInputSubmit: (input: string) => void;
}

export const TerminalContent = forwardRef<HTMLPreElement, TerminalContentProps>(
  (
    {
      isSubmitting,
      isContinuing,
      sessionHistory,
      wordWrap,
      waitingForInput,
      onInputSubmit,
    },
    ref,
  ) => {
    const wrapClass = wordWrap ? "whitespace-pre-wrap" : "whitespace-pre";

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const input = e.currentTarget.value;
        if (input.trim()) {
          onInputSubmit(input);
          e.currentTarget.value = "";
        }
      }
    };

    return (
      <div className="h-full flex flex-col">
        <pre
          ref={ref}
          className={`flex-1 text-sm font-mono p-4 text-slate-700 overflow-auto ${wrapClass}`}
        >
          {isSubmitting ? (
            <div className="text-violet-500 animate-pulse flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Running...
            </div>
          ) : (
            sessionHistory.map((item, i) => (
              <span key={i} className={item.isError ? "text-rose-600" : ""}>
                {item.type === "input" ? `> ${item.content}` : item.content}
                {i < sessionHistory.length - 1 && "\n"}
              </span>
            ))
          )}
        </pre>

        {/* Input field for interactive programs */}
        {waitingForInput && (
          <div className="border-t border-slate-200 bg-white p-2 flex items-center gap-2">
            <span className="text-violet-600 font-mono text-sm">&gt;</span>
            <input
              type="text"
              placeholder="Enter input..."
              className="flex-1 bg-transparent outline-none text-sm font-mono text-slate-700"
              onKeyDown={handleKeyDown}
              disabled={isContinuing}
              autoFocus
            />
            {isContinuing && (
              <Loader2 size={14} className="animate-spin text-violet-500" />
            )}
          </div>
        )}
      </div>
    );
  },
);

TerminalContent.displayName = "TerminalContent";
