"use client";

import { useState, useRef, useEffect } from "react";
import {
  Folder,
  FileText,
  ChevronRight,
  GripVertical,
  FolderOpen,
} from "lucide-react";
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

  // Handle Resize Start
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

  // Global Cursor Style during Resize
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
    const paddingLeft = depth * 12 + 8; // Slightly tighter padding

    return (
      <ul className="space-y-1">
        {nodes.map((node) => {
          const nodePath = `${parentPath}/${node.id}`;

          if (node.type === "folder") {
            const isOpen = openFolders.has(node.id);
            return (
              <li key={nodePath}>
                <button
                  onClick={() => toggleFolder(node.id)}
                  className={`flex items-center w-full p-1.5 text-left text-sm rounded-lg hover:bg-slate-50 transition-colors ${
                    isOpen ? "text-slate-700 font-medium" : "text-slate-500"
                  }`}
                  style={{ paddingLeft: `${paddingLeft}px` }}
                >
                  <ChevronRight
                    size={14}
                    className={`mr-1.5 transition-transform duration-200 ${
                      isOpen ? "rotate-90 text-indigo-500" : "text-slate-400"
                    }`}
                  />
                  {isOpen ? (
                    <FolderOpen size={14} className="mr-2 text-indigo-500" />
                  ) : (
                    <Folder size={14} className="mr-2 text-indigo-400" />
                  )}
                  <span className="truncate">{node.name}</span>
                </button>
                {isOpen && renderTree(node.children, depth + 1, nodePath)}
              </li>
            );
          }

          const isSelected = selectedFileId === node.id;

          return (
            <li key={nodePath}>
              <button
                onClick={() => onSelectFile(node)}
                className={`flex items-center w-full p-1.5 text-left text-sm rounded-lg transition-all ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
                style={{ paddingLeft: `${paddingLeft + 22}px` }}
              >
                <FileText
                  size={14}
                  className={`mr-2 transition-colors ${isSelected ? "text-indigo-500" : "text-slate-400"}`}
                />
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
      className="h-full bg-white border border-slate-200 flex flex-col relative shadow-sm rounded-2xl overflow-hidden transition-all duration-300"
      style={{ width: `${width}px` }}
    >
      {/* Right Drag Handle (Gutter) */}
      <div
        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 hover:bg-slate-50 group flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => {
          const resetWidth = defaultWidth;
          setWidth(resetWidth);
          onResize?.(resetWidth);
        }}
        title="Drag to resize"
      >
        <div className="h-8 w-1 rounded-full bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
      </div>

      {/* Panel Content */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-white shrink-0 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-500">
              <Folder size={14} />
            </div>
            <h2 className="font-bold text-slate-700 text-sm">Explorer</h2>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
              <div className="p-3 bg-slate-50 rounded-full mb-3 border border-slate-100">
                <Folder size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">
                No files found
              </p>
            </div>
          ) : (
            <div className="rounded">{renderTree(files)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
