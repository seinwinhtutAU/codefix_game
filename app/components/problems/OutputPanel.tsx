"use client";

import {
  Loader2,
  X,
  WrapText,
  Clock,
  AlertCircle,
  Keyboard,
  Terminal,
} from "lucide-react";
import { ExecutionResult } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

// --- TYPE DEFINITION ---
type HistoryItem = {
  type: "output" | "input";
  content: string;
  prompt?: string;
  isError?: boolean;
};

// --- PROPS INTERFACE ---
interface Props {
  executionResult: ExecutionResult | null;
  isVisible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  onResize?: (width: number) => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onContinueExecution?: (executionId: string, input: string) => Promise<void>;
  isContinuing?: boolean;
}

export default function OutputPanel({
  executionResult,
  isVisible,
  isSubmitting,
  onClose,
  onResize,
  defaultWidth = 500,
  minWidth = 200,
  maxWidth = 600,
  onContinueExecution,
  isContinuing = false,
}: Props) {
  // --- STATE ---
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sessionHistory, setSessionHistory] = useState<HistoryItem[]>([]);

  // --- REFS ---
  const panelRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- EXECUTION RESULT ---
  const {
    output,
    error,
    executionTime,
    waitingForInput,
    inputPrompt,
    executionId,
  } = executionResult || {};

  const isInteractive = waitingForInput && executionId;
  const hasOutput = output && output.trim().length > 0;
  const hasError = Boolean(error && error.trim().length > 0);

  // --- EFFECTS ---

  // Handle incoming execution results and append to history
  useEffect(() => {
    if (!executionResult) {
      setSessionHistory([]);
      return;
    }

    const rawContent = hasError ? error! : output!;

    // Remove prompt-only output from backend
    const content =
      isInteractive && inputPrompt
        ? rawContent.replace(inputPrompt, "")
        : rawContent;

    // 1. If the execution is finished (NOT interactive) OR it has an error:
    if (!isInteractive || hasError) {
      setSessionHistory([
        {
          type: "output",
          content: content,
          isError: hasError,
        },
      ]);

      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }
    // 2. If it's an ongoing interactive session:
    else if (isInteractive) {
      const lastItem = sessionHistory[sessionHistory.length - 1];
      const newContentIsOnlyPrompt =
        content.trim() === (inputPrompt || "").trim();

      if (
        sessionHistory.length === 0 ||
        lastItem?.type === "input" ||
        !newContentIsOnlyPrompt
      ) {
        const newHistory = [...sessionHistory];
        if (
          newHistory.length > 0 &&
          newHistory[newHistory.length - 1].type === "output" &&
          !newHistory[newHistory.length - 1].isError
        ) {
          newHistory.pop();
        }

        setSessionHistory([
          ...newHistory,
          {
            type: "output",
            content: content,
            isError: hasError, // false here
          },
        ]);
      }

      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionResult, isInteractive, hasOutput, hasError, output, error]);

  // Focus input when waiting for input
  useEffect(() => {
    if (isInteractive && !hasError && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInteractive, hasError]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInteractive || !inputRef.current) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (inputHistory.length > 0) {
          const newIndex =
            historyIndex >= inputHistory.length - 1
              ? inputHistory.length - 1
              : historyIndex + 1;
          setHistoryIndex(newIndex);
          setUserInput(inputHistory[inputHistory.length - 1 - newIndex] || "");
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setUserInput(inputHistory[inputHistory.length - 1 - newIndex] || "");
        } else {
          setHistoryIndex(-1);
          setUserInput("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInteractive, inputHistory, historyIndex]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!panelRef.current) return;
      const containerRect =
        panelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = containerRect.right - moveEvent.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      setWidth(clampedWidth);
      onResize?.(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle input submission
  const handleSubmitInput = async () => {
    if (!userInput.trim() || !executionId || !onContinueExecution) return;

    const input = userInput.trim();
    const currentPrompt = inputPrompt || "";

    setSessionHistory((prev) => [
      ...prev,
      {
        type: "input",
        content: input,
        prompt: currentPrompt,
      },
    ]);

    setInputHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);
    setUserInput("");

    await onContinueExecution(executionId, input);

    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitInput();
    }
  };

  // Global drag state styles
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  if (!isVisible) return null;

  return (
    // MAIN CONTAINER: White card style with rounded corners
    <div
      ref={panelRef}
      className="h-full bg-white border border-slate-200 flex flex-col relative shadow-sm rounded-2xl overflow-hidden transition-colors"
      style={{ width: `${width}px` }}
    >
      {/* Left drag handle (Gutter) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 hover:bg-violet-50 group flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => {
          const resetWidth = defaultWidth;
          setWidth(resetWidth);
          onResize?.(resetWidth);
        }}
        title="Drag to resize"
      >
        <div className="h-8 w-1 rounded-full bg-slate-200 group-hover:bg-violet-300 transition-colors" />
      </div>

      {/* Panel content */}
      <div className="h-full flex flex-col ml-3">
        {/* Header: Clean & Minimal */}
        <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-slate-100 shrink-0 h-14">
          <div className="flex items-center gap-3">
            {/* Status Icon */}
            <div
              className={`p-1.5 rounded-lg border ${
                hasError
                  ? "bg-rose-50 border-rose-100 text-rose-500"
                  : isInteractive && !hasError
                    ? "bg-indigo-50 border-indigo-100 text-indigo-500"
                    : "bg-slate-50 border-slate-100 text-slate-500"
              }`}
            >
              {hasError ? (
                <AlertCircle size={16} />
              ) : isInteractive && !hasError ? (
                <Keyboard size={16} />
              ) : (
                <Terminal size={16} />
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-700">
                {hasError
                  ? "Runtime Error"
                  : isInteractive
                    ? "Interactive Terminal"
                    : "Output"}
              </h3>

              <div className="flex items-center gap-2">
                {executionTime && !isInteractive && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mt-0.5 bg-slate-50 px-1.5 py-0.5 rounded">
                    <Clock size={10} />
                    <span>{executionTime.toFixed(2)}s</span>
                  </div>
                )}
                {isInteractive && inputPrompt && !hasError && (
                  <div className="text-[10px] font-bold text-indigo-400 mt-0.5 animate-pulse">
                    Awaiting input...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Word wrap toggle */}
            {sessionHistory.length > 0 && (
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={`p-2 rounded-xl border transition-all duration-200 ${
                  wordWrap
                    ? "bg-indigo-50 text-indigo-500 border-indigo-100"
                    : "bg-white text-slate-400 hover:bg-slate-50 border-slate-200 hover:text-slate-600"
                }`}
                title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
              >
                <WrapText size={14} />
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 bg-white hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all text-slate-400 hover:text-rose-400"
              title="Close output"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-3 bg-white">
          {isSubmitting || isContinuing ? (
            // --- LOADER BLOCK ---
            <div className="flex items-center justify-center h-full rounded-xl bg-slate-50 border border-slate-100 border-dashed">
              <div className="flex flex-col items-center gap-3 text-indigo-400">
                <div className="relative">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-indigo-200"></div>
                </div>
                <span className="text-sm font-bold text-slate-500">
                  {isContinuing ? "Processing input..." : "Running code..."}
                </span>
              </div>
            </div>
          ) : sessionHistory.length > 0 || isInteractive ? (
            // --- OUTPUT/INTERACTIVE BLOCK ---
            <div className="h-full flex flex-col relative">
              {/* Output area - CHANGED TO LIGHT THEME (bg-slate-50) */}
              <div className="flex-1 overflow-hidden rounded-xl bg-slate-50 shadow-inner border border-slate-200">
                <pre
                  ref={outputRef}
                  className={`text-sm font-mono h-full overflow-auto p-4 text-slate-700 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent ${
                    wordWrap
                      ? "whitespace-pre-wrap break-words"
                      : "whitespace-pre"
                  } focus:outline-none`}
                  tabIndex={-1}
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}
                >
                  {sessionHistory.map((item, index) => (
                    <span key={index}>
                      {item.type === "input" ? (
                        // Submitted input
                        <span className="text-indigo-600 block my-1">
                          <span className="text-slate-400 mr-2 opacity-70">
                            {">"}
                          </span>
                          <span className="opacity-70 text-xs mr-2 text-slate-500">
                            {item.prompt}
                          </span>
                          <span className="text-indigo-600 font-bold">
                            {item.content}
                          </span>
                        </span>
                      ) : (
                        // Standard output or error
                        <span
                          className={`block ${
                            item.isError
                              ? "text-rose-600 bg-rose-50 -mx-4 px-4 py-1 border-l-4 border-rose-400"
                              : "text-slate-700"
                          }`}
                        >
                          {item.content}
                        </span>
                      )}
                    </span>
                  ))}

                  {/* INLINE INPUT LOGIC */}
                  {isInteractive &&
                    !hasError &&
                    executionResult &&
                    executionResult.inputPrompt && (
                      <div className="text-indigo-600 mt-2 flex items-center">
                        <span className="text-slate-400 mr-2 animate-pulse">
                          {">"}
                        </span>
                        <span className="mr-2 text-slate-500">
                          {executionResult.inputPrompt}
                        </span>

                        <input
                          ref={inputRef}
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={handleInputKeyDown}
                          className="bg-transparent border-0 p-0 m-0 w-auto flex-1 focus:ring-0 text-slate-800 font-bold outline-none placeholder-slate-400"
                          disabled={isContinuing}
                          autoFocus
                          placeholder="_"
                          autoComplete="off"
                        />
                      </div>
                    )}
                </pre>
              </div>

              {/* Footer status bar */}
              <div className="mt-2 flex justify-between items-center text-[10px] font-medium text-slate-400 px-1">
                <span>
                  {isInteractive && !hasError && inputHistory.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="bg-slate-100 px-1 rounded border border-slate-200">
                        ↑
                      </span>
                      <span className="bg-slate-100 px-1 rounded border border-slate-200">
                        ↓
                      </span>
                      <span>History</span>
                    </span>
                  )}
                  {!isInteractive &&
                    (hasError
                      ? "Process exited with error (Exit 1)"
                      : "Process finished (Exit 0)")}
                </span>
              </div>
            </div>
          ) : (
            // --- NO OUTPUT BLOCK (Empty State) ---
            <div className="flex flex-col items-center justify-center h-full p-4 text-center rounded-xl bg-slate-50/50 border border-slate-100 border-dashed">
              <div className="mb-3 p-3 bg-white rounded-full shadow-sm border border-slate-100">
                <Terminal className="text-slate-300" size={24} />
              </div>
              <p className="text-sm text-slate-600 font-bold mb-1">No Output</p>
              <p className="text-xs text-slate-400">
                Click ==Run== to see code execution results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
