"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Loader2,
  List,
  Files,
  Terminal,
  Play,
  Lightbulb,
  Square,
  CheckSquare,
  Upload,
  ChevronRight,
} from "lucide-react";
import {
  ProblemDescription,
  FileExplorer,
  HintsPanel,
  OutputPanel,
  Toolbar,
  ProblemListPanel,
  TestCasePanel,
} from "@/app/components/normal";
import {
  useUserId,
  useProblemLoader,
  useUserCodeManager,
  useSolvingTimer,
  useExecutor,
  useUIState,
  useProblemList,
} from "@/hooks";
import { Problem } from "@/lib/types";
import { saveUserCode } from "@/services";
import Link from "next/link";

export default function ProblemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const outputContainerRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;

  const userId = useUserId();
  const {
    showProblem,
    showExplorer,
    setShowExplorer,
    showHints,
    setShowHints,
    showTestCases,
    setShowTestCases,
  } = useUIState();

  const {
    problem,
    setProblem,
    selectedFile,
    setSelectedFile,
    fileContents,
    setFileContents,
    originalFileContents,
    isLoading,
    hasCompleted,
    setHasCompleted,
    totalTimeSpent,
    setTotalTimeSpent,
    loadProblemData,
  } = useProblemLoader(id as string, userId);

  const {
    showProblemList,
    setShowProblemList,
    levelProblems,
    checkProblemCompletion,
    refreshProblemList,
  } = useProblemList({
    currentProblem: problem,
    userId,
    currentCompletion: hasCompleted,
  });

  const {
    hintUsages,
    findContentInUserCodeFiles,
    getCurrentFileContent,
    getOriginalFileContent,
    updateUserCodeFiles,
    resetAllFiles,
    recordHintUsage,
    isCurrentFileModified,
    isAnyFileModified,
  } = useUserCodeManager();

  const { totalTimeSpent: timerTimeSpent, setIsSolving } = useSolvingTimer(
    totalTimeSpent,
    hasCompleted,
    problem,
    problem ? problem._id : "",
    30,
  );

  const level = problem ? problem.difficulty : "no level";

  const {
    isSubmitting,
    isContinuing,
    executionResult,
    showOutput,
    setShowOutput,
    runNormalCode,
    runTestCode,
    continueExecution,
  } = useExecutor({
    problem,
    fileContents,
    userId,
    hintUsages,
    timerTimeSpent,
    hasCompleted,
    setHasCompleted,
    level,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [nextProblemId, setNextProblemId] = useState<string | null>(null);

  // Panel dimensions
  const [fileExplorerWidth, setFileExplorerWidth] = useState(200);
  const [hintsPanelWidth, setHintsPanelWidth] = useState(300);
  const [outputPanelWidth, setOutputPanelWidth] = useState(500);
  const [testCasePanelHeight, setTestCasePanelHeight] = useState(288);

  // Calculate editor dynamic width
  const editorWidth = () => {
    let width = "100%";

    if (showExplorer) {
      width = `calc(${width} - ${fileExplorerWidth}px - 1rem)`;
    }

    if (showHints) {
      width = `calc(${width} - ${hintsPanelWidth}px - 1rem)`;
    }

    if (showOutput) {
      width = `calc(${width} - ${outputPanelWidth}px - 1rem)`;
    }

    return width;
  };

  useEffect(() => {
    if (userId && userId !== "null") {
      loadProblemData().then((result) => {
        if (result) {
          setTotalTimeSpent(result.totalTimeSpent);
          setHasCompleted(result.hasCompleted);
          setIsSolving(!result.hasCompleted);
        }
      });
    }
  }, [
    id,
    userId,
    loadProblemData,
    setTotalTimeSpent,
    setHasCompleted,
    setIsSolving,
  ]);

  useEffect(() => {
    if (levelProblems.length > 0 && problem?._id) {
      const currentIndex = levelProblems.findIndex(
        (p) => p._id === problem._id,
      );
      if (currentIndex !== -1 && currentIndex < levelProblems.length - 1) {
        setNextProblemId(levelProblems[currentIndex + 1]._id);
      } else {
        setNextProblemId(null);
      }
    }
  }, [levelProblems, problem?._id]);

  useEffect(() => {
    if (hasCompleted && problem?._id) {
      const timer = setTimeout(() => {
        refreshProblemList?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasCompleted, problem?._id, refreshProblemList]);

  const handleCodeChange = (value: string | undefined) => {
    if (!selectedFile || !problem) return;

    const newValue = value ?? "";

    setFileContents((prev) => ({
      ...prev,
      [selectedFile.id]: newValue,
    }));

    const updatedProblem = updateUserCodeFiles(
      problem,
      selectedFile,
      selectedFile.id,
      newValue,
    );

    if (updatedProblem) {
      setProblem(updatedProblem);
    }
  };

  const resetCurrentFile = () => {
    if (!selectedFile || !problem) return;

    const originalContent = getOriginalFileContent(
      selectedFile,
      originalFileContents,
    );
    setFileContents((prev) => ({
      ...prev,
      [selectedFile.id]: originalContent,
    }));

    const updatedProblem = updateUserCodeFiles(
      problem,
      selectedFile,
      selectedFile.id,
      originalContent,
    );
    if (updatedProblem) {
      setProblem(updatedProblem);
    }
  };

  const handleResetAllFiles = async () => {
    if (
      !problem ||
      !window.confirm(
        "Are you sure you want to reset all files to their original state? This cannot be undone.",
      )
    ) {
      return;
    }

    setFileContents(originalFileContents);
    const updatedProblem = resetAllFiles(problem, originalFileContents);
    if (updatedProblem) {
      setProblem(updatedProblem);
    }
  };

  const handleSaveCode = async () => {
    if (!problem || !userId || userId === "null" || isSaving) return;

    setIsSaving(true);
    try {
      await saveUserCode(userId, problem);
      console.log("Code saved successfully");
    } catch (error) {
      console.error("Failed to save code:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    if (hasCompleted) return; // Don't run if already completed

    await runNormalCode();
  };

  const handleSubmitCode = async () => {
    if (hasCompleted) return;

    setIsTestRunning(true);
    try {
      const result = await runTestCode();

      if (
        result?.passedTests === result?.totalTests &&
        result?.totalTests &&
        result.totalTests > 0
      ) {
        setHasCompleted(true);
        handleSaveCode();

        setTimeout(() => {}, 100);
      }
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleContinueExecution = async (
    executionId: string,
    input: string,
  ) => {
    await continueExecution(executionId, input);
  };

  const currentFileContent = getCurrentFileContent(
    selectedFile,
    problem,
    fileContents,
    (fileName) => findContentInUserCodeFiles(problem, fileName),
  );

  const originalContent = getOriginalFileContent(
    selectedFile,
    originalFileContents,
  );

  const fileModified = isCurrentFileModified(
    selectedFile,
    currentFileContent,
    originalContent,
  );

  const anyFileModified = isAnyFileModified(fileContents, originalFileContents);

  const handleProblemSelect = (selectedProblem: Problem) => {
    if (selectedProblem._id !== id) {
      router.push(`/problem/${selectedProblem._id}`);
      setShowProblemList(false);
    }
  };

  if (isLoading || userId === "null") {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex flex-col items-center gap-4 p-8 bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
          <div className="relative">
            <Loader2 className="animate-spin text-blue-400" size={32} />
            <div className="absolute inset-0 animate-ping rounded-full border-2 border-blue-500/30"></div>
          </div>
          <p className="text-gray-200 font-medium">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center p-8 bg-gray-800 border border-red-700 rounded-xl shadow-lg">
          <div className="text-red-400 text-lg font-semibold mb-2">
            Problem not found
          </div>
          <p className="text-gray-300">
            The requested problem could not be loaded.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="h-full px-30 pt-4">
        {/* Top Problem Description */}
        <div>
          <ProblemDescription
            problem={problem}
            isOpen={showProblem}
            totalTimeSpent={timerTimeSpent}
            userId={userId}
            hasCompleted={hasCompleted}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col h-[calc(100vh-220px)] mt-4 min-h-0">
          {/* First row: Editor area */}
          <div className="flex flex-1 gap-4 min-h-0">
            {/* Left Sidebar - FileExplorer */}
            <FileExplorer
              files={problem.files}
              isOpen={showExplorer}
              selectedFileId={selectedFile?.id}
              onSelectFile={setSelectedFile}
              onResize={setFileExplorerWidth}
              defaultWidth={200}
              minWidth={150}
              maxWidth={400}
            />

            {/* Main Editor Area */}
            <div
              className="flex-1 flex flex-col min-w-0 rounded-lg border border-gray-700 bg-gray-800 overflow-hidden shadow-lg"
              style={{
                width: editorWidth(),
              }}
            >
              {/* Toolbar */}
              <Toolbar
                selectedFile={selectedFile!}
                hasCompleted={hasCompleted}
                isCurrentFileModified={fileModified}
                isAnyFileModified={anyFileModified}
                onResetCurrentFile={resetCurrentFile}
                onResetAllFiles={handleResetAllFiles}
                onSaveCode={handleSaveCode}
                isSaving={isSaving}
              />

              {/* Code Editor */}
              <div className="flex-1 min-h-0 relative bg-gray-800 rounded-lg border border-gray-700">
                <Editor
                  height="100%"
                  language="python"
                  value={currentFileContent}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    readOnly: hasCompleted,
                    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: "all",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    wordWrap: "on",
                  }}
                  theme="vs-dark"
                />

                {/* Bottom-right Run button */}
                <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                  {/* Run button */}
                  <button
                    onClick={handleRunCode}
                    disabled={
                      isSubmitting ||
                      hasCompleted ||
                      isContinuing ||
                      isTestRunning
                    }
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${
                        hasCompleted
                          ? "bg-green-900/30 text-green-400 border border-green-800 cursor-default"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }
                      ${
                        isSubmitting ||
                        hasCompleted ||
                        isContinuing ||
                        isTestRunning
                          ? "opacity-90"
                          : ""
                      }
                      ${
                        (isSubmitting || isContinuing) && !isTestRunning
                          ? "animate-pulse"
                          : ""
                      }
                    `}
                  >
                    {isSubmitting && !isTestRunning ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : hasCompleted ? (
                      <>
                        <CheckSquare size={14} />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} className="fill-current" />
                        <span>Run</span>
                      </>
                    )}
                  </button>

                  {/* Submit/Next button */}
                  {hasCompleted ? (
                    nextProblemId ? (
                      <Link
                        href={`/problem/${nextProblemId}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <ChevronRight size={16} />
                        <span>Next Problem</span>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                      >
                        <CheckSquare size={14} />
                        <span>All Problems Completed</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleSubmitCode}
                      disabled={
                        isTestRunning ||
                        hasCompleted ||
                        isSubmitting ||
                        isContinuing
                      }
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                        bg-purple-600 text-white hover:bg-purple-700
                        ${
                          isTestRunning ||
                          hasCompleted ||
                          isSubmitting ||
                          isContinuing
                            ? "opacity-90"
                            : ""
                        }
                        ${isTestRunning ? "animate-pulse" : ""}
                      `}
                    >
                      {isTestRunning ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>Submit</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - HintsPanel */}
            {showHints && problem.hints && (
              <HintsPanel
                hints={problem.hints}
                isVisible={showHints}
                onHintUsed={recordHintUsage}
                onClose={() => setShowHints(false)}
                onResize={setHintsPanelWidth}
                defaultWidth={400}
                minWidth={300}
                maxWidth={500}
              />
            )}

            {/* Right Side - OutputPanel */}
            <OutputPanel
              executionResult={executionResult}
              isVisible={showOutput}
              isSubmitting={isSubmitting}
              isContinuing={isContinuing}
              onClose={() => setShowOutput(false)}
              containerRef={outputContainerRef}
              onResize={setOutputPanelWidth}
              defaultWidth={500}
              minWidth={200}
              maxWidth={600}
              onContinueExecution={handleContinueExecution}
            />
          </div>

          {/* Second row: TestCasePanel */}
          {showTestCases && (
            <div className="mt-4 flex-shrink-0">
              <TestCasePanel
                executionResult={executionResult}
                isVisible={showTestCases}
                isSubmitting={isTestRunning || isSubmitting}
                onResize={setTestCasePanelHeight}
                defaultHeight={288}
                minHeight={150}
                onClose={() => setShowTestCases(false)} // Add this line
              />
            </div>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed left-6 top-[calc(220px+1rem)] flex flex-col gap-8 z-50">
          {/* Problem List */}
          <div className="relative group flex flex-col items-center">
            <button
              onClick={() => setShowProblemList(true)}
              className="p-3 bg-gray-800 text-gray-200 rounded-lg shadow-lg border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200"
            >
              <List size={20} />
            </button>
            <span className="mt-2 text-xs text-gray-300 font-medium whitespace-nowrap">
              Problems
            </span>
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-gray-200 text-xs rounded-lg border border-gray-700 shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
              Problem List
            </div>
          </div>

          {/* File Explorer */}
          <div className="relative group flex flex-col items-center">
            <button
              onClick={() => setShowExplorer(!showExplorer)}
              className={`p-3 rounded-lg shadow-lg border transition-all duration-200 ${
                showExplorer
                  ? "bg-gray-700 text-blue-400 border-blue-600"
                  : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
              }`}
            >
              <Files size={20} />
            </button>
            <span className="mt-2 text-xs text-gray-300 font-medium whitespace-nowrap">
              Files
            </span>
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-gray-200 text-xs rounded-lg border border-gray-700 shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
              {showExplorer ? "Hide" : "Show"} File Explorer
            </div>
          </div>

          {/* Hints */}
          {problem.hints && (
            <div className="relative group flex flex-col items-center">
              <button
                onClick={() => setShowHints(!showHints)}
                className={`p-3 rounded-lg shadow-lg border relative transition-all duration-200 ${
                  showHints
                    ? "bg-yellow-900/20 text-yellow-400 border-yellow-700/50"
                    : "bg-gray-800 text-yellow-200 border-gray-700 hover:bg-yellow-900/10"
                }`}
              >
                <Lightbulb size={20} />
                {hintUsages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center shadow">
                    {hintUsages.length}
                  </span>
                )}
              </button>
              <span className="mt-2 text-xs text-gray-300 font-medium whitespace-nowrap">
                Hints
              </span>
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-yellow-900/30 text-yellow-200 text-xs rounded-lg border border-yellow-700/40 shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                {showHints ? "Hide" : "Show"} Hints
              </div>
            </div>
          )}

          {/* Test Cases */}
          <div className="relative group flex flex-col items-center">
            <button
              onClick={() => setShowTestCases(!showTestCases)}
              className={`p-3 rounded-lg shadow-lg border transition-all duration-200 ${
                showTestCases
                  ? "bg-blue-900/30 text-blue-400 border-blue-600/60"
                  : "bg-gray-800 text-blue-200 border-blue-700/40 hover:bg-blue-900/20"
              }`}
            >
              <Terminal size={20} />
            </button>
            <span className="mt-2 text-xs text-gray-300 font-medium whitespace-nowrap">
              Tests
            </span>
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-blue-900/40 text-blue-200 text-xs rounded-lg border border-blue-700/50 shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
              {showTestCases ? "Hide" : "Show"} Test Cases
            </div>
          </div>

          {/* Output */}
          <div className="relative group flex flex-col items-center">
            <button
              onClick={() => setShowOutput(!showOutput)}
              className={`p-3 rounded-lg shadow-lg border transition-all duration-200 ${
                showOutput
                  ? "bg-gray-700 text-blue-400 border-blue-600"
                  : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
              }`}
            >
              {showOutput ? (
                <Square size={20} className="text-blue-400" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-500" />
              )}
            </button>
            <span className="mt-2 text-xs text-gray-300 font-medium whitespace-nowrap">
              Output
            </span>
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-gray-200 text-xs rounded-lg border border-gray-700 shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
              {showOutput ? "Hide" : "Show"} Output
            </div>
          </div>
        </div>

        {/* Problem List Panel */}
        <ProblemListPanel
          showList={showProblemList}
          problems={levelProblems}
          isCompleted={checkProblemCompletion}
          onClose={() => setShowProblemList(false)}
          onProblemSelect={handleProblemSelect}
          currentProblemId={problem?._id}
          currentProblemCompleted={hasCompleted}
        />
      </div>
    </div>
  );
}
