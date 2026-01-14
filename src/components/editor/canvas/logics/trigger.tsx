"use client"

import type { ResizeHandle } from "@/app/hooks/use-canvas-interaction"
import { ResizeHandles } from "../resize-handles"
import { Z } from "@/lib/z-index"

interface TriggerItemProps {
  id: string
  subtype?: string
  x: number
  y: number
  width: number
  height: number
  z: number
  isSelected: boolean
  isDragging: boolean
  resizeMode: "scale" | "resize" | null
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onDelete: () => void
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void
}

export function TriggerItem({
  id,
  subtype,
  x,
  y,
  width,
  height,
  z,
  isSelected,
  isDragging,
  resizeMode,
  onMouseDown,
  onClick,
  onContextMenu,
  onDelete,
  onResizeStart,
}: TriggerItemProps) {
  return (
    <div
      id={`logic-${id}`}
      className="absolute rounded-lg shadow-lg"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: Z.LOGIC + z,
        cursor: isDragging ? "grabbing" : "grab",
        outline: isSelected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
      }}
      onMouseDown={(e) => {
        if (e.button === 2) return;
        onMouseDown(e);
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div
        className="relative w-full h-full bg-green-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center pointer-events-none"
        style={{ fontSize: `${Math.min(width / 10, height / 3)}px` }}
      >
        <div className="absolute left-3 flex items-center">
          <span className="text-yellow-300">⚡</span>
        </div>

        <span className="text-center">
          {subtype ? `${subtype.toLowerCase()}` : "Trigger"}
        </span>
      </div>

      <button
        onClick={onDelete}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white font-bold pointer-events-auto"
      >
        ×
      </button>

      {isSelected && resizeMode && (
        <ResizeHandles
          resizeMode={resizeMode}
          onResizeStart={(e, handle) => {
            if (e.button === 2) return;
            onResizeStart(e, handle);
          }}
        />
      )}
    </div>
  )
}
