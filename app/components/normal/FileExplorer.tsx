"use client";

import { useState, useRef, useEffect } from "react";
import { Folder, FileText, ChevronRight, GripVertical } from "lucide-react";
import { ProblemFile } from "@/lib/types";

interface Props {
  files: ProblemFile[];
  isOpen: boolean;
  selectedFileId: string | undefined;
  onSelectFile: (file: ProblemFile) => void;
  onResize?: (width: number) => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function FileExplorer({
  files,
  isOpen,
  selectedFileId,
  onSelectFile,
  onResize,
  defaultWidth = 200,
  minWidth = 150,
  maxWidth = 400,
}: Props) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // 处理拖拽开始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;
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

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => {
      const newSet = new Set(prev);
      newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
      return newSet;
    });
  };

  const renderTree = (nodes: ProblemFile[], depth = 0, parentPath = "") => {
    const paddingLeft = depth * 16 + 8;

    return (
      <ul className="space-y-0.5">
        {nodes.map((node) => {
          const nodePath = `${parentPath}/${node.id}`;

          if (node.type === "folder") {
            const isOpen = openFolders.has(node.id);
            return (
              <li key={nodePath}>
                <button
                  onClick={() => toggleFolder(node.id)}
                  className={`flex items-center w-full p-2 text-left text-sm rounded-lg hover:bg-gray-700 ${
                    isOpen ? "text-gray-200 font-medium" : "text-gray-400"
                  }`}
                  style={{ paddingLeft: `${paddingLeft}px` }}
                >
                  <ChevronRight
                    size={14}
                    className={`mr-2 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    } text-blue-400`}
                  />
                  <Folder size={14} className="mr-2 text-blue-400" />
                  <span className="truncate">{node.name}</span>
                </button>
                {isOpen && renderTree(node.children, depth + 1, nodePath)}
              </li>
            );
          }

          return (
            <li key={nodePath}>
              <button
                onClick={() => onSelectFile(node)}
                className={`flex items-center w-full p-2 text-left text-sm rounded-lg transition-all ${
                  selectedFileId === node.id
                    ? "bg-gray-700 text-white border-l-2 border-l-blue-500"
                    : "text-gray-300 hover:bg-gray-700 border-l-2 border-transparent"
                }`}
                style={{ paddingLeft: `${paddingLeft + 24}px` }}
              >
                <FileText size={14} className="mr-2 text-blue-400" />
                <span className="truncate">{node.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="h-full bg-gray-800 border border-gray-700 flex flex-col relative shadow-lg rounded-lg overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* 右侧拖拽手柄 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-gray-600 active:bg-gray-500 rounded-r-lg"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => {
          const resetWidth = defaultWidth;
          setWidth(resetWidth);
          onResize?.(resetWidth);
        }}
        title="Drag to resize or double-click to reset"
      >
        <div className="absolute right-0.5 top-1/2 transform -translate-y-1/2">
          <GripVertical size={12} className="text-gray-500" />
        </div>
      </div>

      {/* 面板内容 */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-900 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-800 rounded-lg border border-gray-600">
              <Folder size={14} className="text-blue-400" />
            </div>
            <h2 className="font-medium text-white">Files</h2>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-3">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="p-3 bg-gray-700 rounded-lg mb-3 border border-gray-600">
                <Folder size={24} className="text-blue-400" />
              </div>
              <p className="text-sm text-gray-300">No files</p>
            </div>
          ) : (
            <div className="rounded">{renderTree(files)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
