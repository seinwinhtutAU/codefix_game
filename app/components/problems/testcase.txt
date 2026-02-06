"use client";

import {
  Loader2,
  Check,
  XCircle,
  Terminal,
  GripVertical,
  AlertCircle,
  CircleCheck,
  CircleX,
  Minus,
  X,
  ListChecks,
} from "lucide-react";
import { ExecutionResult } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface Props {
  executionResult: ExecutionResult | null;
  isVisible: boolean;
  isSubmitting: boolean;
  onResize?: (height: number) => void;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  onClose?: () => void;
}

export default function TestCasePanel({
  executionResult,
  isVisible,
  isSubmitting,
  onResize,
  defaultHeight = 200,
  minHeight = 150,
  maxHeight = 400,
  onClose,
}: Props) {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- STATE FIX START ---
  const [expandedIndex, setExpandedIndex] = useState<number | null>(() => {
    return (executionResult?.testResults?.length ?? 0) > 0 ? 0 : null;
  });

  const [prevResult, setPrevResult] = useState(executionResult);

  if (executionResult !== prevResult) {
    setPrevResult(executionResult);
    if (executionResult?.testResults?.length) {
      setExpandedIndex(0);
    } else {
      setExpandedIndex(null);
    }
  }
  // --- STATE FIX END ---

  const isTestMode =
    executionResult?.testResults && executionResult.testResults.length > 0;
  const { testResults, passedTests, totalTests } = executionResult || {};
  const allPassed = passedTests === totalTests && totalTests && totalTests > 0;

  // Handle resize logic
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = startHeight + deltaY;
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

      setHeight(clampedHeight);
      onResize?.(clampedHeight);
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
    if (isResizing) {
      document.body.style.cursor = "row-resize";
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

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);

    if (detailsRef.current && expandedIndex !== index) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  };

  const formatErrorMessage = (error: string) => {
    if (!error) return "";
    return error.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < error.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  if (!isVisible) return null;

  // --- EMPTY STATE (No tests run yet) ---
  if (!isTestMode) {
    return (
      <div
        ref={panelRef}
        className="bg-white border border-slate-200 rounded-2xl flex flex-col relative shadow-sm transition-all"
        style={{ height: `${height}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute top-0 left-0 right-0 h-3 cursor-row-resize z-10 hover:bg-slate-50 group flex items-center justify-center transition-colors"
          onMouseDown={handleResizeStart}
          onDoubleClick={() => {
            setHeight(defaultHeight);
            onResize?.(defaultHeight);
          }}
        >
          <div className="w-8 h-1 rounded-full bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <div className="pt-3 flex flex-col flex-1">
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-500">
              <ListChecks size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Test Results</h3>
          </div>

          {/* Empty Content */}
          <div className="flex-1 overflow-auto p-8">
            <div className="flex flex-col items-center justify-center h-full text-center rounded-xl bg-slate-50/50 border border-slate-100 border-dashed m-2">
              <div className="mb-3 p-3 bg-white rounded-full shadow-sm border border-slate-100">
                <Terminal size={24} className="text-slate-300" />
              </div>
              <h4 className="text-sm font-bold text-slate-600 mb-1">
                {isSubmitting ? "Running Tests..." : "No Results Available"}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                {isSubmitting
                  ? "Evaluating your code against test cases..."
                  : "Click 'Decrypt' or 'Run Test' to verify your solution."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULTS STATE ---
  return (
    <div
      ref={panelRef}
      className="bg-white border border-slate-200 rounded-2xl flex flex-col relative shadow-sm overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 right-0 h-3 cursor-row-resize z-10 hover:bg-slate-50 group flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => {
          setHeight(defaultHeight);
          onResize?.(defaultHeight);
        }}
      >
        <div className="w-8 h-1 rounded-full bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
        >
          <X size={16} />
        </button>
      )}

      <div className="pt-3 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-500">
                <ListChecks size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Test Results</h3>

              {/* Score Badge */}
              <div
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                  allPassed
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {allPassed ? <CircleCheck size={12} /> : <CircleX size={12} />}
                <span>
                  {passedTests}/{totalTests} Passed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab List (Horizontal Scroll) */}
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
              Cases:
            </span>
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-2 overflow-x-auto flex-1 pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
            >
              {testResults?.map((test, index) => (
                <button
                  key={index}
                  onClick={() => toggleExpand(index)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 shadow-sm ${
                    expandedIndex === index
                      ? test.passed
                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200 ring-offset-1"
                        : "bg-rose-100 text-rose-700 ring-2 ring-rose-200 ring-offset-1"
                      : test.passed
                        ? "bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50"
                        : "bg-white text-rose-600 border border-rose-100 hover:bg-rose-50"
                  }`}
                >
                  {test.passed ? (
                    <CircleCheck size={12} className="shrink-0" />
                  ) : (
                    <CircleX size={12} className="shrink-0" />
                  )}
                  <span>Test {test.testNumber}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details Area */}
        <div
          ref={detailsRef}
          className="flex-1 overflow-auto p-4 min-h-0 bg-white"
        >
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2
                className="animate-spin text-indigo-500 mb-2"
                size={24}
              />
              <p className="text-sm font-medium text-slate-500">
                Executing tests...
              </p>
            </div>
          ) : expandedIndex !== null && testResults ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(() => {
                const test = testResults[expandedIndex];
                const hasError = test.error && test.error.trim().length > 0;

                return (
                  <div
                    className={`border rounded-2xl overflow-hidden shadow-sm ${test.passed ? "border-emerald-100 bg-emerald-50/30" : "border-rose-100 bg-rose-50/30"}`}
                  >
                    {/* Test Header */}
                    <div
                      className={`px-4 py-3 border-b flex justify-between items-center ${test.passed ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                            test.passed
                              ? "bg-emerald-500 text-white"
                              : "bg-rose-500 text-white"
                          }`}
                        >
                          {test.passed ? (
                            <Check size={14} strokeWidth={3} />
                          ) : (
                            <X size={14} strokeWidth={3} />
                          )}
                        </div>
                        <h4
                          className={`font-bold text-sm ${test.passed ? "text-emerald-800" : "text-rose-800"}`}
                        >
                          Test Case #{test.testNumber} Details
                        </h4>
                      </div>
                      <button
                        onClick={() => setExpandedIndex(null)}
                        className="p-1 hover:bg-black/5 rounded-full text-slate-400 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* INPUT */}
                      {test.input && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                            Input
                          </p>
                          <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm text-slate-700 whitespace-pre-wrap shadow-sm">
                            {test.input}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* EXPECTED OUTPUT */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-emerald-600/70 mb-1.5 font-bold">
                            Expected Output
                          </p>
                          <div className="bg-white border border-emerald-100 rounded-xl px-3 py-2 font-mono text-sm text-emerald-800 whitespace-pre-wrap shadow-sm">
                            {test.expectedOutput}
                          </div>
                        </div>

                        {/* ACTUAL OUTPUT */}
                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wider mb-1.5 font-bold ${test.passed ? "text-emerald-600/70" : "text-rose-600/70"}`}
                          >
                            Actual Output
                          </p>
                          <div
                            className={`rounded-xl px-3 py-2 font-mono text-sm border whitespace-pre-wrap shadow-sm bg-white ${
                              test.passed
                                ? "border-emerald-100 text-emerald-800"
                                : "border-rose-100 text-rose-800"
                            }`}
                          >
                            {test.actualOutput || (
                              <span className="italic text-slate-300">
                                (Empty output)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ERROR MESSAGE */}
                      {hasError && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-rose-500 mb-1.5 font-bold flex items-center gap-1">
                            <AlertCircle size={10} /> Runtime Error
                          </p>
                          <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 font-mono text-sm text-rose-600 whitespace-pre-wrap">
                            {formatErrorMessage(test.error || "")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            // --- NO SELECTION STATE ---
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <div className="bg-slate-50 p-3 rounded-full mb-3">
                <AlertCircle size={24} className="text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-600">
                Select a Test Case
              </h4>
              <p className="text-xs text-slate-400">
                Click on the tabs above to view input/output details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
