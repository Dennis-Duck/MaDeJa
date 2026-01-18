"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import type { Flirt } from "@/types/flirt"
import { Canvas } from "./canvas/canvas"
import { MediaItem } from "./canvas/elements/media"
import { ContextMenu } from "./canvas/context-menu"
import { useCanvasScale } from "@/app/hooks/use-canvas-scale"
import { useCanvasInteraction } from "@/app/hooks/use-canvas-interaction"
import { useKeyboardNavigation } from "@/app/hooks/use-keyboard-navigation"
import { ButtonItem } from "./canvas/elements/button"
import { TriggerItem } from "./canvas/logics/trigger"
import { JumpItem } from "./canvas/logics/jump"
import { InspectorsOverlay } from "./canvas/inspector/inspectors-overlay"
import { TextItem } from "./canvas/elements/text"
import { useEditor } from "@/contexts/editor-context"
import { EditorToolbar } from "./canvas/editor-toolbar"

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

const COLLECTION_MAP = {
  media: "media",
  element: "elements",
  logic: "logics",
} as const

type CanvasItemType = keyof typeof COLLECTION_MAP

interface CanvasItemIdentifier {
  id: string
  type: CanvasItemType
  subtype?: string
}

interface StepContentProps {
  totalSteps: number
  flirt?: Flirt
}

export default function StepContent({
  totalSteps,
  flirt,
}: StepContentProps) {
  const { step, updateStep } = useEditor()

  const [selectedItem, setSelectedItem] = useState<CanvasItemIdentifier | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    z: number
    maxZ: number
    canBringToFront: boolean
    item: CanvasItemIdentifier
  } | null>(null)
  const [resizeMode, setResizeMode] = useState<{ [key: string]: "scale" | "resize" | null }>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const scale = useCanvasScale({
    containerRef,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  })

  useEffect(() => {
    // Empty effect for now - state is managed by EditorContext
  }, [])

  const updatePosition = useCallback(
    (item: CanvasItemIdentifier, x: number, y: number) => {
      const collectionKey = COLLECTION_MAP[item.type]
      updateStep(
        (prev) => ({
          ...prev,
          [collectionKey]: prev[collectionKey].map((i) => (i.id === item.id ? { ...i, x, y } : i)),
        }),
        "move",
      )
    },
    [updateStep],
  )

  const updateSize = useCallback(
    (item: CanvasItemIdentifier, width: number, height: number) => {
      const collectionKey = COLLECTION_MAP[item.type]
      updateStep(
        (prev) => ({
          ...prev,
          [collectionKey]: prev[collectionKey].map((i) => (i.id === item.id ? { ...i, width, height } : i)),
        }),
        "resize",
      )
    },
    [updateStep],
  )

  const updateLayer = useCallback(
    (item: CanvasItemIdentifier, action: "front" | "forward" | "backward" | "back") => {
      const collectionKey = COLLECTION_MAP[item.type]
      const allItems = step[collectionKey]
      const current = allItems.find((i) => i.id === item.id)
      if (!current) return

      const zValues = allItems.map((i) => i.z ?? 0)
      const minZ = Math.min(...zValues, 0)

      let newZ = current.z ?? 0
      switch (action) {
        case "front":
          const allZ = [...step.media, ...step.elements, ...step.logics].map(
            (i) => i.z ?? (i.type === "element" ? 1 : 0),
          )
          const maxZAll = Math.max(...allZ)
          newZ = maxZAll + 1
          break
        case "forward":
          newZ = (current.z ?? 0) + 1
          break
        case "backward":
          if (item.type === "element") {
            newZ = Math.max(1, (current.z ?? 1) - 1)
          } else {
            newZ = Math.max(0, (current.z ?? 0) - 1)
          }
          break
        case "back":
          if (item.type === "element") {
            newZ = 1
          } else {
            newZ = minZ
          }
          break
      }

      updateStep(
        (prev) => ({
          ...prev,
          [collectionKey]: prev[collectionKey].map((i) => (i.id === item.id ? { ...i, z: newZ } : i)),
        }),
        "layer",
      )
    },
    [step, updateStep],
  )

  const handleDelete = useCallback(
    (item: CanvasItemIdentifier) => {
      const collectionKey = COLLECTION_MAP[item.type]
      updateStep(
        (prev) => ({
          ...prev,
          [collectionKey]: prev[collectionKey].filter((i) => i.id !== item.id),
        }),
        "delete",
      )

      if (selectedItem?.id === item.id && selectedItem?.type === item.type) {
        setSelectedItem(null)
      }
    },
    [selectedItem, updateStep],
  )

  const { draggedItem, startDrag, startResize, handleMove, endInteraction } = useCanvasInteraction({
    scale,
    onPositionUpdate: updatePosition,
    onSizeUpdate: updateSize,
  })

  useKeyboardNavigation({
    selectedItem,
    items: [...step.media, ...step.elements, ...step.logics],
    onPositionUpdate: updatePosition,
  })

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: CanvasItemIdentifier) => {
      e.preventDefault()

      const collectionKey = COLLECTION_MAP[item.type]
      const source = step[collectionKey]
      const current = source.find((i) => i.id === item.id)

      const z = current?.z ?? (item.type === "element" ? 1 : 0)

      const allZ = [...step.media, ...step.elements, ...step.logics].map((i) => i.z ?? (i.type === "element" ? 1 : 0))
      const maxZ = Math.max(...allZ)

      const itemsAtMaxZ = [...step.media, ...step.elements, ...step.logics].filter(
        (i) => (i.z ?? (i.type === "element" ? 1 : 0)) === maxZ,
      ).length

      const canBringToFront = z < maxZ || (z === maxZ && itemsAtMaxZ > 1)

      setContextMenu({ x: e.clientX, y: e.clientY, item, z, maxZ, canBringToFront })
      setSelectedItem(item)
    },
    [step],
  )

  const toggleResizeMode = useCallback((itemId: string, mode: "scale" | "resize") => {
    setResizeMode((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === mode ? null : mode,
    }))
  }, [])

  return (
    <div className="relative">
      <p className="text-sm text-muted-foreground mb-4">
        Step {step.order}/{totalSteps}
      </p>

      <EditorToolbar />

      <Canvas
        ref={containerRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        scale={scale}
        onMouseMove={(e) => {
          let currentResizeMode: "scale" | "resize" | null = null
          for (const [, mode] of Object.entries(resizeMode)) {
            if (mode) {
              currentResizeMode = mode
              break
            }
          }
          handleMove(e, currentResizeMode)
        }}
        onMouseUp={endInteraction}
        onMouseDown={() => {
          setContextMenu(null)
          setResizeMode({})
          setSelectedItem(null)
        }}
      >
        {step.media
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((m) => {
            const itemIdentifier: CanvasItemIdentifier = { id: m.id, type: "media" }
            return (
              <MediaItem
                key={m.id}
                id={m.id}
                type={m.type}
                url={m.url}
                x={m.x ?? 0}
                y={m.y ?? 0}
                width={m.width ?? 300}
                height={m.height ?? 300}
                z={m.z ?? 0}
                isSelected={selectedItem?.id === m.id && selectedItem?.type === "media"}
                isDragging={draggedItem === m.id}
                resizeMode={resizeMode[m.id]}
                onMouseDown={(e) => {
                  const current = step.media.find((media) => media.id === m.id)
                  if (current) {
                    startDrag(e, m.id, "media", current.x ?? 0, current.y ?? 0)
                    setSelectedItem(itemIdentifier)
                  }
                }}
                onClick={() => {
                  setSelectedItem(itemIdentifier)
                }}
                onContextMenu={(e) => handleContextMenu(e, itemIdentifier)}
                onDelete={() => handleDelete(itemIdentifier)}
                onResizeStart={(e, handle) => {
                  const current = step.media.find((media) => media.id === m.id)
                  if (current) {
                    startResize(
                      e,
                      m.id,
                      "media",
                      handle,
                      current.width ?? 300,
                      current.height ?? 300,
                      current.x ?? 0,
                      current.y ?? 0,
                    )
                  }
                }}
              />
            )
          })}

        {step.elements
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((el) => {
            const itemIdentifier: CanvasItemIdentifier = { id: el.id, type: "element", subtype: el.type }

            switch (el.type) {
              case "BUTTON":
                return (
                  <ButtonItem
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width ?? 200}
                    height={el.height ?? 60}
                    z={el.z ?? 0}
                    label={el.text ?? "Button"}
                    isSelected={selectedItem?.id === el.id && selectedItem?.type === "element"}
                    isDragging={draggedItem === el.id}
                    resizeMode={resizeMode[el.id]}
                    onMouseDown={(e) => {
                      startDrag(e, el.id, "element", el.x, el.y)
                      setSelectedItem(itemIdentifier)
                    }}
                    onClick={() => {
                      setSelectedItem(itemIdentifier)
                    }}
                    onContextMenu={(e) => handleContextMenu(e, itemIdentifier)}
                    onDelete={() => handleDelete(itemIdentifier)}
                    onResizeStart={(e, handle) =>
                      startResize(e, el.id, "element", handle, el.width ?? 200, el.height ?? 60, el.x, el.y)
                    }
                  />
                )

              case "TEXT":
                return (
                  <TextItem
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width ?? 300}
                    height={el.height ?? 80}
                    z={el.z ?? 0}
                    text={el.text ?? undefined}
                    textSegments={el.textSegments}
                    isSelected={selectedItem?.id === el.id && selectedItem?.type === "element"}
                    isDragging={draggedItem === el.id}
                    resizeMode={resizeMode[el.id]}
                    mode="editor"
                    onMouseDown={(e) => {
                      startDrag(e, el.id, "element", el.x, el.y)
                      setSelectedItem(itemIdentifier)
                    }}
                    onClick={() => {
                      setSelectedItem(itemIdentifier)
                    }}
                    onContextMenu={(e) => handleContextMenu(e, itemIdentifier)}
                    onDelete={() => handleDelete(itemIdentifier)}
                    onResizeStart={(e, handle) =>
                      startResize(e, el.id, "element", handle, el.width ?? 300, el.height ?? 80, el.x, el.y)
                    }
                  />
                )

              default:
                return null
            }
          })}

        {step.logics
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((logic) => {
            const itemIdentifier: CanvasItemIdentifier = { id: logic.id, type: "logic", subtype: logic.type }

            switch (logic.type) {
              case "TRIGGER":
                return (
                  <TriggerItem
                    key={logic.id}
                    id={logic.id}
                    subtype={logic.subtype ?? undefined}
                    x={logic.x}
                    y={logic.y}
                    width={logic.width ?? 150}
                    height={logic.height ?? 50}
                    z={logic.z ?? 0}
                    isSelected={selectedItem?.id === logic.id && selectedItem?.type === "logic"}
                    isDragging={draggedItem === logic.id}
                    resizeMode={resizeMode[logic.id]}
                    onMouseDown={(e) => {
                      startDrag(e, logic.id, "logic", logic.x, logic.y)
                      setSelectedItem(itemIdentifier)
                    }}
                    onClick={() => setSelectedItem(itemIdentifier)}
                    onContextMenu={(e) => handleContextMenu(e, itemIdentifier)}
                    onDelete={() => handleDelete(itemIdentifier)}
                    onResizeStart={(e, handle) =>
                      startResize(
                        e,
                        logic.id,
                        "logic",
                        handle,
                        logic.width ?? 150,
                        logic.height ?? 50,
                        logic.x,
                        logic.y,
                      )
                    }
                  />
                )
              case "ACTION":
              case "CHECK":
              case "JUMP":
                return (
                  <JumpItem
                    key={logic.id}
                    id={logic.id}
                    x={logic.x}
                    y={logic.y}
                    width={logic.width ?? 150}
                    height={logic.height ?? 50}
                    z={logic.z ?? 0}
                    isSelected={selectedItem?.id === logic.id && selectedItem?.type === "logic"}
                    isDragging={draggedItem === logic.id}
                    resizeMode={resizeMode[logic.id]}
                    onMouseDown={(e) => {
                      startDrag(e, logic.id, "logic", logic.x, logic.y)
                      setSelectedItem(itemIdentifier)
                    }}
                    onClick={() => setSelectedItem(itemIdentifier)}
                    onContextMenu={(e) => handleContextMenu(e, itemIdentifier)}
                    onDelete={() => handleDelete(itemIdentifier)}
                    onResizeStart={(e, handle) =>
                      startResize(
                        e,
                        logic.id,
                        "logic",
                        handle,
                        logic.width ?? 150,
                        logic.height ?? 50,
                        logic.x,
                        logic.y,
                      )
                    }
                  />
                )
              default:
                return null
            }
          })}
      </Canvas>

      <InspectorsOverlay
        selectedItem={selectedItem}
        step={step}
        flirt={flirt}
      />

      <p className="text-xs text-muted-foreground mt-2" style={{ visibility: selectedItem ? "visible" : "hidden" }}>
        Use arrow keys to move the selected item
      </p>

      {contextMenu && (
        <ContextMenu
          itemType={contextMenu.item.type}
          x={contextMenu.x}
          y={contextMenu.y}
          z={(() => {
            const collectionKey = COLLECTION_MAP[contextMenu.item.type]
            const item = step[collectionKey].find((i) => i.id === contextMenu.item.id)
            return item?.z ?? (contextMenu.item.type === "element" ? 1 : 0)
          })()}
          maxZ={contextMenu.maxZ}
          canBringToFront={contextMenu.canBringToFront}
          resizeMode={resizeMode[contextMenu.item.id]}
          onDelete={() => handleDelete(contextMenu.item)}
          onToggleScale={() => toggleResizeMode(contextMenu.item.id, "scale")}
          onToggleResize={() => toggleResizeMode(contextMenu.item.id, "resize")}
          onLayer={(action) => updateLayer(contextMenu.item, action)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
