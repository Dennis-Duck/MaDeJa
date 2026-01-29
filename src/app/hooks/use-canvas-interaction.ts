"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

interface CanvasItemIdentifier {
  id: string
  type: "media" | "element" | "logic"
}

interface UseCanvasInteractionProps {
  scale: number
  onPositionUpdate: (item: CanvasItemIdentifier, x: number, y: number) => void
  onSizeUpdate: (item: CanvasItemIdentifier, width: number, height: number) => void
}

export function useCanvasInteraction({ scale, onPositionUpdate, onSizeUpdate }: UseCanvasInteractionProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const draggedItemType = useRef<"media" | "element" | "logic" | null>(null)
  const dragStart = useRef<{ x: number; y: number; itemX: number; itemY: number } | null>(null)

  const [resizeState, setResizeState] = useState<{
    itemId: string
    itemType: "media" | "element" | "logic"
    handle: ResizeHandle
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startPosX: number
    startPosY: number
  } | null>(null)

  const startDrag = useCallback(
    (e: React.MouseEvent, itemId: string, itemType: "media" | "element" | "logic", itemX: number, itemY: number) => {
      e.stopPropagation()
      setDraggedItem(itemId)
      draggedItemType.current = itemType
      dragStart.current = { x: e.clientX, y: e.clientY, itemX, itemY }
    },
    [],
  )

  const startResize = useCallback(
    (
      e: React.MouseEvent,
      itemId: string,
      itemType: "media" | "element" | "logic",
      handle: ResizeHandle,
      width: number,
      height: number,
      x: number,
      y: number,
    ) => {
      e.stopPropagation()
      setResizeState({
        itemId,
        itemType,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: width,
        startHeight: height,
        startPosX: x,
        startPosY: y,
      })
    },
    [],
  )

  const handleMove = useCallback(
    (e: React.MouseEvent, resizeMode: "scale" | "resize" | null) => {
      if (resizeState) {
        const deltaX = (e.clientX - resizeState.startX) / scale
        const deltaY = (e.clientY - resizeState.startY) / scale
        let newWidth = resizeState.startWidth
        let newHeight = resizeState.startHeight
        let newX = resizeState.startPosX
        let newY = resizeState.startPosY
        const aspectRatio = resizeState.startWidth / resizeState.startHeight

        if (resizeMode === "scale") {
          if (resizeState.handle === "se") {
            newWidth = resizeState.startWidth + deltaX
            newHeight = newWidth / aspectRatio
          } else if (resizeState.handle === "sw") {
            newWidth = resizeState.startWidth - deltaX
            newHeight = newWidth / aspectRatio
            newX = resizeState.startPosX + deltaX
          } else if (resizeState.handle === "ne") {
            newWidth = resizeState.startWidth + deltaX
            newHeight = newWidth / aspectRatio
            newY = resizeState.startPosY - (newHeight - resizeState.startHeight)
          } else if (resizeState.handle === "nw") {
            newWidth = resizeState.startWidth - deltaX
            newHeight = newWidth / aspectRatio
            newX = resizeState.startPosX + deltaX
            newY = resizeState.startPosY - (newHeight - resizeState.startHeight)
          }
        } else if (resizeMode === "resize") {
          switch (resizeState.handle) {
            case "nw":
              newWidth = resizeState.startWidth - deltaX
              newHeight = resizeState.startHeight - deltaY
              newX = resizeState.startPosX + deltaX
              newY = resizeState.startPosY + deltaY
              break
            case "n":
              newHeight = resizeState.startHeight - deltaY
              newY = resizeState.startPosY + deltaY
              break
            case "ne":
              newWidth = resizeState.startWidth + deltaX
              newHeight = resizeState.startHeight - deltaY
              newY = resizeState.startPosY + deltaY
              break
            case "e":
              newWidth = resizeState.startWidth + deltaX
              break
            case "se":
              newWidth = resizeState.startWidth + deltaX
              newHeight = resizeState.startHeight + deltaY
              break
            case "s":
              newHeight = resizeState.startHeight + deltaY
              break
            case "sw":
              newWidth = resizeState.startWidth - deltaX
              newHeight = resizeState.startHeight + deltaY
              newX = resizeState.startPosX + deltaX
              break
            case "w":
              newWidth = resizeState.startWidth - deltaX
              newX = resizeState.startPosX + deltaX
              break
          }
        } else {
          if (resizeState.handle === "se") {
            newWidth = resizeState.startWidth + deltaX
            newHeight = newWidth / aspectRatio
          } else if (resizeState.handle === "sw") {
            newWidth = resizeState.startWidth - deltaX
            newHeight = newWidth / aspectRatio
            newX = resizeState.startPosX + deltaX
          } else if (resizeState.handle === "ne") {
            newWidth = resizeState.startWidth + deltaX
            newHeight = newWidth / aspectRatio
            newY = resizeState.startPosY - (newHeight - resizeState.startHeight)
          } else if (resizeState.handle === "nw") {
            newWidth = resizeState.startWidth - deltaX
            newHeight = newWidth / aspectRatio
            newX = resizeState.startPosX + deltaX
            newY = resizeState.startPosY - (newHeight - resizeState.startHeight)
          }
        }

        newWidth = Math.max(50, newWidth)
        newHeight = Math.max(50, newHeight)

        const el = document.getElementById(`${resizeState.itemType}-${resizeState.itemId}`)
        if (el) {
          el.style.width = `${newWidth}px`
          el.style.height = `${newHeight}px`
          el.style.left = `${newX}px`
          el.style.top = `${newY}px`
        }
      } else if (draggedItem && dragStart.current && draggedItemType.current) {
        const deltaX = (e.clientX - dragStart.current.x) / scale
        const deltaY = (e.clientY - dragStart.current.y) / scale
        const newX = dragStart.current.itemX + deltaX
        const newY = dragStart.current.itemY + deltaY

        const el = document.getElementById(`${draggedItemType.current}-${draggedItem}`)
        if (el) {
          el.style.left = `${newX}px`
          el.style.top = `${newY}px`
        }
      }
    },
    [resizeState, draggedItem, scale],
  )

  const endInteraction = useCallback(() => {
    if (resizeState) {
      const el = document.getElementById(`${resizeState.itemType}-${resizeState.itemId}`)
      if (el) {
        const newWidth = Number.parseInt(el.style.width) || resizeState.startWidth
        const newHeight = Number.parseInt(el.style.height) || resizeState.startHeight
        const newX = Number.parseInt(el.style.left) || resizeState.startPosX
        const newY = Number.parseInt(el.style.top) || resizeState.startPosY
        onSizeUpdate({ id: resizeState.itemId, type: resizeState.itemType }, newWidth, newHeight)
        onPositionUpdate({ id: resizeState.itemId, type: resizeState.itemType }, newX, newY)
      }
      setResizeState(null)
    } else if (draggedItem && dragStart.current && draggedItemType.current) {
      const el = document.getElementById(`${draggedItemType.current}-${draggedItem}`)
      if (el) {
        const newX = Number.parseInt(el.style.left) || dragStart.current.itemX
        const newY = Number.parseInt(el.style.top) || dragStart.current.itemY
        onPositionUpdate({ id: draggedItem, type: draggedItemType.current }, newX, newY)
      }
      setDraggedItem(null)
      draggedItemType.current = null
      dragStart.current = null
    }
  }, [resizeState, draggedItem, onPositionUpdate, onSizeUpdate])

  return { draggedItem, startDrag, startResize, handleMove, endInteraction }
}