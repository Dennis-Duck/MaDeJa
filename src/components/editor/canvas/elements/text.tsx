"use client"

import type { ResizeHandle } from "@/app/hooks/use-canvas-interaction"
import { ResizeHandles } from "../resize-handles"

interface TextItemProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  z: number
  text: string
  isSelected: boolean
  isDragging: boolean
  resizeMode: "scale" | "resize" | null
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onDelete: () => void
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void
}

export function TextItem({
  id,
  x,
  y,
  width,
  height,
  z,
  text,
  isSelected,
  isDragging,
  resizeMode,
  onMouseDown,
  onClick,
  onContextMenu,
  onDelete,
  onResizeStart,
}: TextItemProps) {
  return (
    <div
      id={`element-${id}`}
      className="absolute"
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
      onMouseDown={(e) => {
        if (e.button === 2) return
        onMouseDown(e)
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* TEXT CONTENT */}
      <div
        className="w-full h-full text-[var(--foreground)] bg-[var(--hover-border)] overflow-hidden flex items-center justify-center text-center"
        style={{ fontSize: `${Math.min(width / 10, height / 3)}px` }}
      >
        {text}
      </div>

      {/* DELETE BUTTON */}
      <button
        onClick={onDelete}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white font-bold pointer-events-auto"
      >
        ×
      </button>

      {/* RESIZE HANDLES */}
      {isSelected && resizeMode && (
        <ResizeHandles
          resizeMode={resizeMode}
          onResizeStart={(e, handle) => {
            if (e.button === 2) return
            onResizeStart(e, handle)
          }}
        />
      )}

      {/* Z-INDEX LABEL */}
      <div className="absolute left-1 top-1 bg-black/60 text-white text-xs px-1 rounded pointer-events-none">
        Z: {z}
      </div>
    </div>
  )
}
