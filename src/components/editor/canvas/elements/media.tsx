"use client"

import Image from "next/image"
import type { ResizeHandle } from "@/app/hooks/use-canvas-interaction"
import { ResizeHandles } from "../resize-handles"

interface MediaItemProps {
  id: string
  type: string
  url: string
  x: number
  y: number
  width: number
  height: number
  z: number
  isSelected: boolean
  isDragging: boolean
  resizeMode: "scale" | "resize" | null
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void
  onDelete: () => void
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void
}

export function MediaItem({
  id,
  type,
  url,
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
}: MediaItemProps) {
  return (
    <div
      id={`media-${id}`}
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
      onMouseDown={(e) => {
        if (e.button === 2) return;
        onMouseDown(e);
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {type === "IMAGE" ? (
        <>
          <Image
            src={url || "/placeholder.svg"}
            alt="Step media"
            fill
            className="rounded-lg object-cover pointer-events-none select-none"
            draggable={false}
            unoptimized={url?.startsWith("http")}
          />
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
                if (e.button === 2) return; // Blokkeer resize bij rechterklik
                onResizeStart(e, handle);
              }}
            />
          )}

        </>
      ) : (
        <video src={url} controls className="w-full h-full rounded-lg block" />
      )}

      <div className="absolute left-1 top-1 bg-black/60 text-white text-xs px-1 rounded pointer-events-none">
        Z: {z}
      </div>
    </div>
  )
}