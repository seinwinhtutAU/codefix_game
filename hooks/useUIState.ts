import { useState } from "react";

export function useUIState() {
  const [showProblem, setShowProblem] = useState(true);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showTestCases, setShowTestCases] = useState(true);
  return {
    showProblem,
    setShowProblem,
    showExplorer,
    setShowExplorer,
    showHints,
    setShowHints,
    showOutput,
    setShowOutput,
    showTestCases,
    setShowTestCases,
  };
}
