"use client";

import {
  Loader2,
  Check,
  XCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
  CircleCheck,
  CircleX,
  Minus,
  X,
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
  // Initialize expandedIndex based on initial executionResult
  const [expandedIndex, setExpandedIndex] = useState<number | null>(() => {
    return (executionResult?.testResults?.length ?? 0) > 0 ? 0 : null;
  });

  // Track the previous executionResult to detect when new results arrive
  const [prevResult, setPrevResult] = useState(executionResult);

  // Adjust state during render if executionResult changed
  // This avoids the "useEffect setState" cascading render warning
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

  if (!isTestMode) {
    return (
      <div
        ref={panelRef}
        className="bg-gray-900 border border-blue-700/40 rounded-xl flex flex-col relative shadow-lg"
        style={{ height: `${height}px` }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-row-resize z-10 hover:bg-blue-600/30 active:bg-blue-500/40"
          onMouseDown={handleResizeStart}
          onDoubleClick={() => {
            setHeight(defaultHeight);
            onResize?.(defaultHeight);
          }}
        >
          <div className="absolute left-1/2 top-1 transform -translate-x-1/2">
            <GripVertical size={12} className="text-blue-500/60 rotate-90" />
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-1.5 hover:bg-blue-800/40 rounded text-blue-300/80 hover:text-blue-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <div className="pt-2 flex flex-col flex-1">
          <div className="px-4 py-3 bg-blue-900/30 border-b border-blue-700/40">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-900/40 rounded-lg border border-blue-600/50">
                <Terminal size={16} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-blue-100">
                Test Results
              </h3>
              <div className="text-xs text-blue-300/80">
                {isSubmitting ? "Running tests..." : "Run tests to see results"}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 p-4 bg-blue-900/20 rounded-full border border-blue-700/40">
                <Terminal size={24} className="text-blue-400" />
              </div>
              <h4 className="text-sm font-medium text-blue-200 mb-2">
                {isSubmitting ? "Executing Tests..." : "No Test Results Yet"}
              </h4>
              <p className="text-xs text-blue-300/70 max-w-sm">
                {isSubmitting
                  ? "Running your code against test cases..."
                  : "Test results will appear here when you run code in test mode."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="bg-gray-900 border border-blue-700/40 rounded-xl flex flex-col relative shadow-lg overflow-hidden"
      style={{ height: `${height}px` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-row-resize z-10 hover:bg-blue-600/30 active:bg-blue-500/40"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => {
          setHeight(defaultHeight);
          onResize?.(defaultHeight);
        }}
      >
        <div className="absolute left-1/2 top-1 transform -translate-x-1/2">
          <GripVertical size={12} className="text-blue-500/60 rotate-90" />
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 hover:bg-blue-800/40 rounded text-blue-300/80 hover:text-blue-100 transition-colors"
        >
          <X size={16} />
        </button>
      )}

      <div className="pt-2 flex flex-col flex-1 min-h-0">
        <div className="px-4 py-3 bg-blue-900/30 border-b border-blue-700/40 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-900/40 rounded-lg border border-blue-600/50">
                <Terminal size={16} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-blue-100">
                Test Results
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    allPassed
                      ? "bg-green-900/40 text-green-400 border-green-700/60"
                      : "bg-blue-900/40 text-blue-300 border border-blue-700/50"
                  }`}
                >
                  {passedTests}/{totalTests} passed
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-blue-700/40 bg-blue-900/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-300/90 font-medium whitespace-nowrap">
              Test Cases:
            </span>
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-2 overflow-x-auto flex-1 pb-1"
            >
              {testResults?.map((test, index) => (
                <button
                  key={index}
                  onClick={() => toggleExpand(index)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    expandedIndex === index
                      ? test.passed
                        ? "bg-green-900/40 text-green-400 border border-green-700/60"
                        : "bg-red-900/40 text-red-400 border border-red-700/60"
                      : test.passed
                      ? "hover:bg-green-900/30 text-green-300 border border-green-700/40"
                      : "hover:bg-red-900/30 text-red-300 border border-red-700/40"
                  }`}
                >
                  {test.passed ? (
                    <CircleCheck size={10} className="text-green-500" />
                  ) : (
                    <CircleX size={10} className="text-red-500" />
                  )}
                  <span>Test {test.testNumber}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div ref={detailsRef} className="flex-1 overflow-auto p-4 min-h-0">
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="animate-spin text-blue-400 mb-2" size={24} />
              <p className="text-sm text-blue-300">Running tests...</p>
            </div>
          ) : expandedIndex !== null && testResults ? (
            <div className="space-y-4">
              {(() => {
                const test = testResults[expandedIndex];
                const hasError = test.error && test.error.trim().length > 0;

                return (
                  <div className="border border-blue-700/40 rounded-lg overflow-hidden bg-blue-900/10">
                    <div className="px-4 py-3 bg-blue-900/30 border-b border-blue-700/40 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            test.passed ? "bg-green-600" : "bg-red-600"
                          }`}
                        >
                          {test.passed ? (
                            <Check size={14} className="text-white" />
                          ) : (
                            <XCircle size={14} className="text-white" />
                          )}
                        </div>
                        <h4 className="font-medium text-blue-100">
                          Test Case {test.testNumber} Details
                        </h4>
                      </div>
                      <button
                        onClick={() => setExpandedIndex(null)}
                        className="text-blue-400 hover:text-blue-100"
                      >
                        <Minus size={14} />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {test.input && (
                        <div>
                          <p className="text-xs text-blue-300/90 mb-1 font-medium">
                            Input
                          </p>
                          <div className="bg-blue-900/30 border border-blue-700/40 rounded-lg px-3 py-2 font-mono text-sm text-blue-200 whitespace-pre-wrap">
                            {test.input}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-green-400 mb-1 font-medium">
                            Expected Output
                          </p>
                          <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 font-mono text-sm text-green-300 whitespace-pre-wrap">
                            {test.expectedOutput}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-blue-400 mb-1 font-medium">
                            Actual Output
                          </p>
                          <div
                            className={`rounded-lg px-3 py-2 font-mono text-sm border whitespace-pre-wrap ${
                              test.passed
                                ? "bg-green-900/30 border-green-700/40 text-green-300"
                                : "bg-red-900/30 border-red-700/40 text-red-300"
                            }`}
                          >
                            {test.actualOutput || (
                              <span className="italic opacity-50">
                                No output
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasError && (
                        <div>
                          <p className="text-xs text-red-400 mb-1 font-medium">
                            Error
                          </p>
                          <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 font-mono text-sm text-red-300 whitespace-pre-wrap">
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
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle size={20} className="text-blue-400 mb-2" />
              <h4 className="text-sm font-medium text-blue-200">
                Select a Test Case
              </h4>
              <p className="text-xs text-blue-300/80">
                Click on any test case above to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
