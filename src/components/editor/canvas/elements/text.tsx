
"use client"

import { useState, useRef, useEffect } from "react"
import type { ResizeHandle } from "@/app/hooks/use-canvas-interaction"
import { ResizeHandles } from "../resize-handles"
import { TextSegment } from "@/types/text-segment"

interface TextItemProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  z: number
  text?: string
  textSegments?: TextSegment[]
  isSelected: boolean
  isDragging: boolean
  resizeMode: "scale" | "resize" | null
  mode: "editor" | "preview"
  onMouseDown?: (e: React.MouseEvent) => void
  onClick?: (e: React.MouseEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
  onDelete?: () => void
  onResizeStart?: (e: React.MouseEvent, handle: ResizeHandle) => void
}

export function TextItem({
  id,
  x,
  y,
  width,
  height,
  z,
  text,
  textSegments = [],
  isSelected,
  isDragging,
  resizeMode,
  mode,
  onMouseDown,
  onClick,
  onContextMenu,
  onDelete,
  onResizeStart,
}: TextItemProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [spacerHeight, setSpacerHeight] = useState(0)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeTextRef = useRef<HTMLParagraphElement | null>(null)
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([])

  const segments = textSegments.length > 0
    ? textSegments
    : (text ? [{ id: 'legacy', elementId: id, text, order: 0 }] : [])

  const hasSegments = segments.length > 0
  const hasMultipleSegments = segments.length > 1

  const isEditorMode = mode === "editor"
  const isPreviewMode = mode === "preview"
  const canAdvance = isPreviewMode && hasMultipleSegments && currentSegmentIndex < segments.length - 1

  const handleNextSegment = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1)
    }
  }

  // Bereken spacerHeight op basis van container en actieve tekst
  useEffect(() => {
    if (!isPreviewMode || !containerRef.current || !activeTextRef.current) return

    const containerHeight = containerRef.current.clientHeight
    const textHeight = activeTextRef.current.clientHeight

    const space = Math.max((containerHeight - textHeight) / 2, 0)
    setSpacerHeight(space > 4 ? space - 4 : space)

  }, [currentSegmentIndex, mode, width, height])

  // Scroll naar actieve segment
  useEffect(() => {
    if (isPreviewMode && segmentRefs.current[currentSegmentIndex]) {
      segmentRefs.current[currentSegmentIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }
  }, [currentSegmentIndex, mode])

  return (
    <div
      id={`element-${id}`}
      className="absolute rounded-lg shadow-lg"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: z,
        cursor: isPreviewMode && canAdvance ? "pointer" : (isDragging ? "grabbing" : "grab"),
        outline: isSelected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        pointerEvents: isPreviewMode ? "auto" : undefined,
      }}
      onMouseDown={(e) => {
        if (isPreviewMode) return
        if (e.button === 2) return
        onMouseDown?.(e)
      }}
      onClick={(e) => {
        if (isPreviewMode && canAdvance) {
          handleNextSegment(e)
        } else if (isEditorMode) {
          onClick?.(e)
        }
      }}
      onContextMenu={(e) => {
        if (isPreviewMode) return
        onContextMenu?.(e)
      }}
    >
      {/* TEXT CONTENT */}
      <div
        ref={containerRef}
        className={`w-full h-full text-[var(--foreground)] bg-[var(--hover-border)] rounded-lg shadow-lg relative overflow-y-auto ${isPreviewMode ? "scroll-container" : ""}`}
        style={{
          fontSize: `${Math.min(width / 25, 18)}px`,
          lineHeight: 1.6,
        }}
      >
        {!hasSegments && (
          <div className="flex items-center justify-center h-full text-foreground-muted italic">
            No text
          </div>
        )}

        {segments.map((segment, index) => {
          if (isPreviewMode && index > currentSegmentIndex) return null

          const isCurrent = isPreviewMode && index === currentSegmentIndex

          return (
            <div key={segment.id}
              ref={(el: HTMLDivElement | null) => {
                segmentRefs.current[index] = el
              }}
            >
              {/* Spacer boven actieve segment */}
              {isCurrent && <div style={{ height: spacerHeight }} />}

              <div className={`flex justify-center ${isCurrent ? "" : "py-4"}`}>
                <p
                  ref={isCurrent ? activeTextRef : undefined}
                  className={`whitespace-pre-wrap text-center ${isCurrent ? "font-bold" : ""}`}
                  style={{ margin: 0, lineHeight: 1.35 }}
                >
                  {segment.text}
                </p>
              </div>

              {/* Spacer onder actieve segment */}
              {isCurrent && <div style={{ height: spacerHeight }} />}
            </div>
          )
        })}
      </div>

      {/* Next indicator */}
      {canAdvance && (
        <div
          className="absolute bottom-2 left-0 w-full flex items-center justify-center text-foreground-muted animate-pulse pointer-events-none"
          style={{
            fontSize: `${Math.min(width / 30, 12)}px`
          }}
        >
          <span>▼</span>
        </div>
      )}

      {/* Editor-only controls */}
      {isEditorMode && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white font-bold pointer-events-auto hover:bg-black/80 transition-colors"
          >
            ×
          </button>

          {isSelected && resizeMode && onResizeStart && (
            <ResizeHandles
              resizeMode={resizeMode}
              onResizeStart={(e, handle) => {
                if (e.button === 2) return
                onResizeStart(e, handle)
              }}
            />
          )}

          <div className="absolute left-1 top-1 bg-black/60 text-white text-xs px-1 rounded pointer-events-none">
            Z: {z}
          </div>

          {hasMultipleSegments && (
            <div className="absolute left-1 bottom-1 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {segments.length} segments
            </div>
          )}
        </>
      )}
    </div>
  )
}
