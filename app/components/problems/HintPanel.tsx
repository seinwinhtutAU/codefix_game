import { useState, useRef, useEffect } from "react";
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  GripVertical,
  X,
} from "lucide-react";

type HintLevel = "small" | "medium" | "big";

interface Props {
  hints: { small?: string[]; medium?: string[]; big?: string[] };
  isVisible: boolean;
  onClose?: () => void;
  onHintUsed?: (hintId: string, hintLevel: HintLevel) => void;
  onResize?: (width: number) => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function HintsPanel({
  hints,
  isVisible,
  onHintUsed,
  onClose,
  onResize,
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 500,
}: Props) {
  const [selectedLevel, setSelectedLevel] = useState<HintLevel | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [usedHintLevels, setUsedHintLevels] = useState<Set<HintLevel>>(
    new Set()
  );
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentHints = selectedLevel ? hints[selectedLevel] || [] : [];
  const levels: HintLevel[] = ["small", "medium", "big"];

  // 处理拖拽调整宽度
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = startWidth + deltaX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      setWidth(clampedWidth);
      if (onResize) {
        onResize(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 全局拖拽状态样式
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

  const handleHintNavigation = (newIndex: number) => {
    if (!selectedLevel) return;
    setHintIndex(newIndex);

    const hintId = `${selectedLevel}-hint-${newIndex}`;
    if (!usedHintLevels.has(selectedLevel)) {
      const newUsedLevels = new Set(usedHintLevels);
      newUsedLevels.add(selectedLevel);
      setUsedHintLevels(newUsedLevels);
      if (onHintUsed) {
        onHintUsed(hintId, selectedLevel);
      }
    }
  };

  const calculatePoints = (): number => {
    if (usedHintLevels.has("big")) return 50;
    if (usedHintLevels.has("medium")) return 70;
    if (usedHintLevels.has("small")) return 90;
    return 100;
  };

  const getCurrentPoints = () => calculatePoints();
  const getHighestUsedLevel = (): HintLevel | "none" => {
    if (usedHintLevels.has("big")) return "big";
    if (usedHintLevels.has("medium")) return "medium";
    if (usedHintLevels.has("small")) return "small";
    return "none";
  };

  const handleLevelSelect = (level: HintLevel) => {
    setSelectedLevel(level);
    setHintIndex(0);

    const hintId = `${level}-hint-0`;
    if (!usedHintLevels.has(level)) {
      const newUsedLevels = new Set(usedHintLevels);
      newUsedLevels.add(level);
      setUsedHintLevels(newUsedLevels);
      if (onHintUsed) {
        onHintUsed(hintId, level);
      }
    }
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setHintIndex(0);
  };

  const handleClose = () => {
    setSelectedLevel(null);
    setHintIndex(0);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={panelRef}
      className="h-full bg-gray-900 border border-yellow-700/30 rounded-lg shadow-xl overflow-hidden flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* 左侧拖拽手柄 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-20 hover:bg-yellow-600/30 active:bg-yellow-500/40"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => {
          const newWidth = defaultWidth;
          setWidth(newWidth);
          if (onResize) onResize(newWidth);
        }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <GripVertical size={12} className="text-yellow-500/60" />
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-900 border-b border-yellow-700/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
            <Lightbulb size={16} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-yellow-100">Hints</h3>
            <p className="text-xs text-yellow-300/70 mt-0.5">
              {getHighestUsedLevel() !== "none"
                ? `Using ${getHighestUsedLevel()} hints`
                : "No hints used yet"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 分数显示 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/20 rounded-lg border border-yellow-700/40">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-sm font-bold text-yellow-100">
              {getCurrentPoints()}
              <span className="text-xs text-yellow-300/70">/100</span>
            </span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-yellow-900/20 rounded-lg text-yellow-400 hover:text-yellow-300"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-hidden p-4">
        <div ref={contentRef} className="h-full overflow-auto pr-2">
          {/* Level Selection */}
          {!selectedLevel && (
            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-sm text-yellow-300/70 mb-2">
                  Select a hint level to view hints.
                </p>
              </div>

              <div className="space-y-3">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelSelect(level)}
                    className={`flex flex-col w-full p-4 rounded-lg border transition-all text-left ${
                      usedHintLevels.has(level)
                        ? "border-yellow-500 bg-yellow-900/20"
                        : "border-yellow-700/40 bg-yellow-900/10 hover:bg-yellow-900/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {usedHintLevels.has(level) && (
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        )}
                        <span className="capitalize font-medium text-yellow-100">
                          {level} Hint
                        </span>
                      </div>
                      <div className="text-xs text-yellow-400">
                        {hints[level]?.length || 0} hint
                        {hints[level]?.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-yellow-300/70">
                      <span>
                        {level === "small" && "90 points"}
                        {level === "medium" && "70 points"}
                        {level === "big" && "50 points"}
                      </span>
                      {usedHintLevels.has(level) && (
                        <span className="text-yellow-400 font-medium">
                          Used
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hint Content */}
          {selectedLevel && currentHints.length > 0 && (
            <div className="space-y-4 h-full">
              {/* 返回按钮和标题 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBackToLevels}
                  className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300"
                >
                  <ChevronLeft size={16} />
                  <span>Back to levels</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/20 rounded-lg border border-yellow-700/40">
                  <div className="p-1 bg-yellow-900/30 rounded">
                    <Lightbulb size={12} className="text-yellow-400" />
                  </div>
                  <span className="text-sm font-medium text-yellow-100 capitalize">
                    {selectedLevel} Hint
                  </span>
                </div>
              </div>

              {/* 导航和提示信息 */}
              <div className="flex justify-between items-center mb-3 text-sm text-yellow-300/70">
                <span>
                  Hint {hintIndex + 1} of {currentHints.length}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={hintIndex === 0}
                    onClick={() => handleHintNavigation(hintIndex - 1)}
                    className="p-1.5 hover:bg-yellow-900/20 rounded-lg disabled:opacity-30 border border-yellow-700/40 text-yellow-300/70 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={hintIndex === currentHints.length - 1}
                    onClick={() => handleHintNavigation(hintIndex + 1)}
                    className="p-1.5 hover:bg-yellow-900/20 rounded-lg disabled:opacity-30 border border-yellow-700/40 text-yellow-300/70 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* 提示内容 - 可滚动 */}
              <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-auto">
                <p className="text-sm text-yellow-100 leading-relaxed whitespace-pre-wrap">
                  {currentHints[hintIndex]}
                </p>
              </div>
            </div>
          )}

          {/* No hints available */}
          {selectedLevel && currentHints.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="mb-4 p-4 bg-yellow-900/20 rounded-full border border-yellow-700/30">
                <AlertCircle size={24} className="text-yellow-500/50" />
              </div>
              <h4 className="text-sm font-medium text-yellow-100 mb-2">
                No Hints Available
              </h4>
              <p className="text-sm text-yellow-300/70 mb-4">
                No hints available for {selectedLevel} level.
              </p>
              <button
                onClick={handleBackToLevels}
                className="text-sm text-yellow-400 hover:text-yellow-300 underline"
              >
                Choose another level
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-yellow-700/30 bg-yellow-900/10 flex-shrink-0">
        <div className="flex justify-between items-center text-xs text-yellow-300/70">
          <span>Using hints will reduce your final score</span>
          <span>
            {getHighestUsedLevel() !== "none"
              ? `Highest hint used: ${getHighestUsedLevel()}`
              : "No hints used"}
          </span>
        </div>
      </div>
    </div>
  );
}
