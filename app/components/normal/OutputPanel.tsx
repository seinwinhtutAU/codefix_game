"use client";

import {
  Loader2,
  X,
  GripVertical,
  WrapText,
  Clock,
  AlertCircle,
  Keyboard,
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
  containerRef: React.RefObject<HTMLDivElement>;
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
  const displayText = hasError ? error : output;
  const isLongOutput = displayText && displayText.length > 1000;

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
    // We reset the history entirely to the final output/error result.
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
    // 2. If it's an ongoing interactive session (isInteractive is true, no error):
    else if (isInteractive) {
      const lastItem = sessionHistory[sessionHistory.length - 1];

      // 💡 FIX: Check if the new output content is just the prompt itself (server duplication).
      const newContentIsOnlyPrompt =
        content.trim() === (inputPrompt || "").trim();

      // Only update history if the content is new/meaningful or if the last item was input
      if (
        sessionHistory.length === 0 ||
        lastItem?.type === "input" ||
        !newContentIsOnlyPrompt
      ) {
        const newHistory = [...sessionHistory];

        // If the last item was a clean output, we might be replacing it with new output.
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
    // Only focus if interactive and there is NO error
    if (isInteractive && !hasError && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInteractive, hasError]);

  // Handle keyboard shortcuts for input history
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

  // Handle Enter key in input
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
    <div
      ref={panelRef}
      className="h-full bg-gray-800 border border-gray-700 flex flex-col relative shadow-lg rounded-lg overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Left drag handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-gray-600 active:bg-gray-500 rounded-l-lg"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => {
          const resetWidth = defaultWidth;
          setWidth(resetWidth);
          onResize?.(resetWidth);
        }}
        title="Drag to resize or double-click to reset"
      >
        <div className="absolute left-0.5 top-1/2 transform -translate-y-1/2">
          <GripVertical size={12} className="text-gray-500" />
        </div>
      </div>

      {/* Panel content */}
      <div className="h-full flex flex-col ml-2">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-gray-900 border-b border-gray-700 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-lg ${
                hasError
                  ? "bg-red-900/30 border-red-800"
                  : isInteractive && !hasError
                  ? "bg-blue-900/30 border-blue-800"
                  : "bg-gray-700 border-gray-600"
              } border`}
            >
              {hasError ? (
                <AlertCircle size={16} className="text-red-400" />
              ) : isInteractive && !hasError ? (
                <Keyboard size={16} className="text-blue-400" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {hasError
                  ? "Error Output"
                  : isInteractive
                  ? "Interactive Console"
                  : "Code Output"}
              </h3>
              {executionTime && !isInteractive && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Clock size={10} />
                  <span>{executionTime.toFixed(2)}s execution time</span>
                </div>
              )}
              {isInteractive && inputPrompt && !hasError && (
                <div className="text-xs text-blue-400 mt-0.5">
                  Awaiting input
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Word wrap toggle */}
            {sessionHistory.length > 0 && (
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={`p-2 rounded-lg border transition-colors ${
                  wordWrap
                    ? "bg-gray-700 text-blue-400 border-gray-600"
                    : "text-gray-400 hover:bg-gray-700 border-gray-700"
                }`}
                title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
              >
                <WrapText size={14} />
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Close output"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isSubmitting || isContinuing ? (
            // --- LOADER BLOCK ---
            <div className="flex items-center justify-center h-full p-4">
              <div className="flex flex-col items-center gap-3 text-blue-400">
                <div className="relative">
                  <Loader2 className="animate-spin" size={24} />
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-blue-500/30"></div>
                </div>
                <span className="text-sm font-medium">
                  {isContinuing ? "Processing input..." : "Running code..."}
                </span>
              </div>
            </div>
          ) : sessionHistory.length > 0 || isInteractive ? (
            // --- OUTPUT/INTERACTIVE BLOCK ---
            <div className="h-full flex flex-col">
              {/* Output area - Renders history and the *inline* input field */}
              <div className="flex-1 overflow-auto p-4">
                <pre
                  ref={outputRef}
                  className={`text-sm font-mono h-full overflow-auto bg-gray-900/50 rounded-lg border ${
                    hasError ? "border-red-700" : "border-gray-700"
                  } p-4 text-gray-300 ${
                    wordWrap
                      ? "whitespace-pre-wrap break-words"
                      : "whitespace-pre"
                  } focus:outline-none`}
                  tabIndex={-1}
                >
                  {sessionHistory.map((item, index) => (
                    <span key={index}>
                      {item.type === "input" ? (
                        // Submitted input: Prompt + Value, with a newline after
                        <span className="text-blue-300">
                          {/* Icon for submitted prompt */}
                          <span className="text-gray-500 mr-2">{">"}</span>
                          {item.prompt}
                          <span className="text-blue-500 font-bold">
                            {item.content}
                          </span>
                          {"\n"}
                        </span>
                      ) : (
                        // Standard output or error
                        <span
                          className={
                            item.isError ? "text-red-300" : "text-gray-300"
                          }
                        >
                          {item.content}
                          {/* Ensure newline after output chunk if it doesn't end with one */}
                          {item.content.endsWith("\n") ? "" : "\n"}
                        </span>
                      )}
                    </span>
                  ))}

                  {/* INLINE INPUT LOGIC */}
                  {isInteractive &&
                    !hasError && // Do not show input prompt if there is an error
                    executionResult &&
                    executionResult.inputPrompt && (
                      <span className="text-blue-300">
                        {/* Add newline BEFORE the current prompt if necessary */}
                        {sessionHistory.length > 0 &&
                        sessionHistory[sessionHistory.length - 1].type !==
                          "input"
                          ? ""
                          : ""}

                        {/* Icon for current interactive prompt */}
                        <span className="text-gray-500 mr-2">{">"}</span>

                        {executionResult.inputPrompt}

                        {/* The actual input element, styled to look like inline text */}
                        <input
                          ref={inputRef}
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={handleInputKeyDown}
                          className="bg-transparent border-0 p-0 m-0 w-auto min-w-[50px] focus:ring-0 text-white inline font-bold"
                          style={{
                            width: `${userInput.length * 8 + 10}px`,
                          }}
                          disabled={isContinuing}
                          autoFocus
                        />
                      </span>
                    )}
                </pre>
              </div>

              {/* Footer info (only showing history hint) */}
              <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/30 flex justify-between items-center text-xs text-gray-400">
                <span className="text-gray-500">
                  {isInteractive && !hasError && inputHistory.length > 0 && (
                    <span>↑↓ history. Press Enter to submit.</span>
                  )}
                  {!isInteractive &&
                    (hasError ? "Execution failed" : "Execution completed")}
                </span>
                {executionTime && !isInteractive && (
                  <span className="text-gray-500">
                    {executionTime.toFixed(2)}s
                  </span>
                )}
              </div>
            </div>
          ) : (
            // --- NO OUTPUT BLOCK ---
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="mb-4 p-3 bg-gray-700 rounded-full border border-gray-600">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium mb-1">
                No output generated
              </p>
              <p className="text-xs text-gray-500">
                Run your code to see the output here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
