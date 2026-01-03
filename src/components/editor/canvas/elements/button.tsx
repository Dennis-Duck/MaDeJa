"use client";

import { ResizeHandles } from "../resize-handles";

interface ButtonItemProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;

  label: string;

  isSelected: boolean;
  isDragging: boolean;
  resizeMode: "scale" | "resize" | null;

  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onResizeStart: (e: React.MouseEvent, handle: string) => void;
}

export function ButtonItem({
  id,
  x,
  y,
  width,
  height,
  z,
  label,
  isSelected,
  isDragging,
  resizeMode,
  onMouseDown,
  onClick,
  onContextMenu,
  onDelete,
  onResizeStart,
}: ButtonItemProps) {
  return (
    <div
      id={`button-${id}`}
      className="absolute rounded-lg shadow-lg"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: z,
        cursor: isDragging ? "grabbing" : "grab",
        outline: isSelected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* BUTTON VISUAL */}
      <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
        <button
          className="w-full h-full rounded-lg bg-blue-600 text-white font-semibold"
          style={{
            fontSize: Math.max(12, height * 0.35),
          }}
        >
          {label}
        </button>
      </div>

      {/* DELETE */}
      <button
        onClick={onDelete}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white font-bold"
      >
        ×
      </button>

      {/* RESIZE */}
      {isSelected && resizeMode && (
        <ResizeHandles
          resizeMode={resizeMode}
          onResizeStart={onResizeStart}
        />
      )}

      {/* Z-INDEX BADGE */}
      <div className="absolute left-1 top-1 bg-black/60 text-white text-xs px-1 rounded">
        Z: {z}
      </div>
    </div>
  );
}
