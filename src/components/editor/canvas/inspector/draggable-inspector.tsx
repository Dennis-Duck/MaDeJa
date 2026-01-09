"use client"
import React, { useRef } from "react"
import { Z } from "@/lib/z-index"

interface DraggableInspectorProps {
  position: { x: number; y: number; width: number; height: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  onSizeChange: (size: { width: number; height: number }) => void
  children: React.ReactNode
}

export function DraggableInspector({ position, onPositionChange, onSizeChange, children }: DraggableInspectorProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startPos = { ...position }

    const onMouseMove = (e: MouseEvent) => {
      onPositionChange({
        x: startPos.x + (e.clientX - startX),
        y: startPos.y + (e.clientY - startY),
      })
    }

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startSize = { width: position.width, height: position.height }

    const onMouseMove = (e: MouseEvent) => {
      onSizeChange({
        width: Math.max(100, startSize.width + (e.clientX - startX)),
        height: Math.max(100, startSize.height + (e.clientY - startY)),
      })
    }

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  return (
    <div
      ref={ref}
      className="absolute bg-gray-800 p-2 rounded shadow-lg cursor-move"
      style={{
        top: position.y,
        left: position.x,
        width: position.width,
        height: position.height,
        zIndex: Z.INSPECTOR,
      }}
      onMouseDown={onMouseDown}
    >
      <div className="w-full h-full overflow-auto">{children}</div>

      <div
        className="absolute w-4 h-4 bg-white/70 bottom-0 right-0 cursor-se-resize rounded"
        onMouseDown={onResizeMouseDown}
      />
    </div>
  )
}
