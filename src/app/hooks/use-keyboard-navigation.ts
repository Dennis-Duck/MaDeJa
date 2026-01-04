"use client"

import { useEffect } from "react"

interface CanvasItemIdentifier {
  id: string
  type: "media" | "element"
}

interface Item {
  id: string
  x?: number
  y?: number
}

interface UseKeyboardNavigationProps {
  selectedItem: CanvasItemIdentifier | null
  items: Item[]
  onPositionUpdate: (item: CanvasItemIdentifier, x: number, y: number) => Promise<void>
}

export function useKeyboardNavigation({ selectedItem, items, onPositionUpdate }: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!selectedItem) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const item = items.find((i) => i.id === selectedItem.id)
      if (!item) return

      const currentX = item.x ?? 0
      const currentY = item.y ?? 0
      const step = e.shiftKey ? 10 : 1

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          onPositionUpdate(selectedItem, currentX, Math.max(0, currentY - step))
          break
        case "ArrowDown":
          e.preventDefault()
          onPositionUpdate(selectedItem, currentX, currentY + step)
          break
        case "ArrowLeft":
          e.preventDefault()
          onPositionUpdate(selectedItem, Math.max(0, currentX - step), currentY)
          break
        case "ArrowRight":
          e.preventDefault()
          onPositionUpdate(selectedItem, currentX + step, currentY)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedItem, items, onPositionUpdate])
}