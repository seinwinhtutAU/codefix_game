"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useExecutor, useUserId } from "@/hooks";
import { Problem } from "@/lib/types";
import { Header } from "../components/paste/Header";
import { OutputPanel } from "../components/paste/OutputPanel";
import { HintsPanel } from "../components/paste/HintsPanel";
import { HintLevel, HistoryItem, ActiveTab } from "@/lib/types";

export default function PastePage() {
  const userId = useUserId();

  // State
  const [code, setCode] = useState(
    "# Paste your code here\nprint('Hello World')",
  );
  const [hints, setHints] = useState<string[]>([]);
  const [isGeneratingHints, setIsGeneratingHints] = useState(false);
  const [hintLevel, setHintLevel] = useState<HintLevel>("small");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("terminal");
  const [isOutputVisible, setIsOutputVisible] = useState(true);
  const [isHintsVisible, setIsHintsVisible] = useState(true);
  const [outputHeight, setOutputHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<HistoryItem[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [extraInfo, setExtraInfo] = useState("");

  // Problem definition
  const pasteProblem: Problem = useMemo(
    () => ({
      _id: "paste-session",
      title: "Paste & Debug",
      description: "Paste mode.",
      difficulty: "small",
      mode: "paste",
      files: [
        {
          id: "main-file-id",
          name: "main.py",
          type: "file",
          content: code,
          order: 0,
          parentId: null,
          children: [],
        },
      ],
      userCodeFiles: [],
      expectedOutput: expectedOutput,
      testCases: [],
      hints: { small: [], medium: [], big: [] },
    }),
    [code, expectedOutput],
  );

  // Executor hook
  const {
    isSubmitting,
    isContinuing,
    executionResult,
    runNormalCode,
    continueExecution,
  } = useExecutor({
    problem: pasteProblem,
    fileContents: { "main-file-id": code },
    userId,
    level: "paste",
    timerTimeSpent: 0,
    hasCompleted: false,
    setHasCompleted: () => {},
    attempt: 0,
    bugCounts: 0,
    timeLimited: 0,
    hintUsages: [],
  });

  // Effects
  useEffect(() => {
    if (isSubmitting) {
      setIsOutputVisible(true);
      setActiveTab("terminal");
    }
  }, [isSubmitting]);

  useEffect(() => {
    if (!executionResult) return;

    const hasError = Boolean(executionResult.error);
    const content = hasError ? executionResult.error! : executionResult.output!;

    // Store execution ID if available (for interactive programs)
    if (executionResult.executionId) {
      setExecutionId(executionResult.executionId);
    }

    // Add output to history
    setSessionHistory((prev) => [
      ...prev,
      {
        type: "output",
        content,
        isError: hasError,
      },
    ]);

    // If waiting for input, add a prompt indicator
    if (executionResult.waitingForInput) {
      setSessionHistory((prev) => [
        ...prev,
        {
          type: "output",
          content: "\n⏎ Program waiting for input...",
          isError: false,
        },
      ]);
    }
  }, [executionResult]);

  // Handle input submission
  const handleInputSubmit = useCallback(
    async (input: string) => {
      if (!executionId || isContinuing) return;

      // Add input to history
      setSessionHistory((prev) => [
        ...prev,
        {
          type: "input",
          content: input,
          isError: false,
        },
      ]);

      // Continue execution with input
      const result = await continueExecution(executionId, input);

      // Update execution ID if new one provided
      if (result?.executionId) {
        setExecutionId(result.executionId);
      }
    },
    [executionId, isContinuing, continueExecution],
  );

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 80 && newHeight < window.innerHeight - 150) {
        setOutputHeight(newHeight);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handlers
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleRunCode = useCallback(async () => {
    // Clear previous execution ID
    setExecutionId(null);

    // Clear history for fresh start
    setSessionHistory([]);

    // Run the code
    await runNormalCode();
  }, [runNormalCode]);

  const handleGetHint = async (force: boolean = false) => {
    if (!code.trim() || isSubmitting) return;

    if (!expectedOutput.trim() && !force) {
      setShowWarning(true);
      setIsOutputVisible(true);
      return;
    }

    setShowWarning(false);
    setIsGeneratingHints(true);

    try {
      const freshResult = await runNormalCode();
      const freshError = freshResult?.error || null;
      const freshOutput = freshResult?.output || "";

      const response = await fetch("http://0.0.0.0:8000/api/get-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: [{ name: "main.py", path: "main.py", content: code }],
          error: freshError,
          hint_level: hintLevel,
          current_output: freshOutput,
          expected_output: expectedOutput,
          extra_info: extraInfo,
        }),
      });

      const data = await response.json();
      if (data.success) setHints(data.hints);
    } catch (error) {
      console.error("Hint Generation Error:", error);
    } finally {
      setIsGeneratingHints(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#FDFBF7] font-sans overflow-hidden">
      <Header
        isOutputVisible={isOutputVisible}
        isHintsVisible={isHintsVisible}
        isSubmitting={isSubmitting}
        onToggleOutput={() => setIsOutputVisible(!isOutputVisible)}
        onToggleHints={() => setIsHintsVisible(!isHintsVisible)}
        onRunCode={handleRunCode}
      />

      <main className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              language="python"
              theme="light"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* Output Panel */}
          <OutputPanel
            isVisible={isOutputVisible}
            height={outputHeight}
            activeTab={activeTab}
            wordWrap={wordWrap}
            isSubmitting={isSubmitting}
            isContinuing={isContinuing}
            sessionHistory={sessionHistory}
            expectedOutput={expectedOutput}
            showWarning={showWarning && activeTab === "expected"}
            extraInfo={extraInfo}
            setExtraInfo={setExtraInfo}
            waitingForInput={executionResult?.waitingForInput || false}
            onResizeStart={handleResizeStart}
            onTabChange={setActiveTab}
            onWordWrapToggle={() => setWordWrap(!wordWrap)}
            onClose={() => setIsOutputVisible(false)}
            onExpectedOutputChange={setExpectedOutput}
            onInputSubmit={handleInputSubmit}
          />
        </div>

        {/* Hints Panel */}
        <HintsPanel
          isVisible={isHintsVisible}
          hints={hints}
          hintLevel={hintLevel}
          isGenerating={isGeneratingHints}
          isSubmitting={isSubmitting}
          code={code}
          showWarning={showWarning}
          onHintLevelChange={setHintLevel}
          onGetHint={handleGetHint}
          onDismissWarning={() => setShowWarning(false)}
          onGoToExpectedOutput={() => {
            setShowWarning(false);
            setActiveTab("expected");
            setIsOutputVisible(true);
          }}
        />
      </main>
    </div>
  );
}
