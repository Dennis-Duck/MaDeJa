"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Step } from "@/types/step";
import { Canvas } from "./canvas/canvas";
import { MediaItem } from "./canvas/media-item";
import { ContextMenu } from "./canvas/context-menu";
import { useCanvasScale } from "@/app/hooks/use-canvas-scale";
import { useCanvasInteraction } from "@/app/hooks/use-canvas-interaction";
import { useKeyboardNavigation } from "@/app/hooks/use-keyboard-navigation";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

interface StepContentProps {
  step: Step;
  totalSteps: number;
  onStepContentChange?: () => void;
  initialFlirtId?: string;
}

export default function StepContent({
  step: initialStep,
  totalSteps,
  onStepContentChange,
  initialFlirtId,
}: StepContentProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mediaId: string;
  } | null>(null);
  const [resizeMode, setResizeMode] = useState<{ [key: string]: 'scale' | 'resize' | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const scale = useCanvasScale({
    containerRef,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  });

  // Refetch step on mount to ensure latest positions
  useEffect(() => {
    async function fetchStep() {
      const res = await fetch(`/api/step/${initialStep.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setStep(data.step);
      }
    }
    fetchStep();
  }, [initialFlirtId, initialStep.id]);

  // Keep local `step` state in sync when parent passes a new `initialStep` object
  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  // API calls
  const updatePosition = useCallback(async (mediaId: string, x: number, y: number) => {
    const res = await fetch(`/api/step/${step.id}/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });
    if (res.ok) {
      setStep((prev) => ({
        ...prev,
        media: prev.media.map((m) =>
          m.id === mediaId ? { ...m, x, y } : m
        ),
      }));
      onStepContentChange?.();
    }
  }, [step.id, onStepContentChange]);

  const updateSize = useCallback(async (mediaId: string, width: number, height: number) => {
    const res = await fetch(`/api/step/${step.id}/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ width, height }),
    });
    if (res.ok) {
      setStep((prev) => ({
        ...prev,
        media: prev.media.map((m) =>
          m.id === mediaId ? { ...m, width, height } : m
        ),
      }));
      onStepContentChange?.();
    }
  }, [step.id, onStepContentChange]);

  const updateLayer = useCallback(async (
    mediaId: string,
    action: "front" | "forward" | "backward" | "back"
  ) => {
    const current = step.media.find((m) => m.id === mediaId);
    if (!current) return;

    const zValues = step.media.map((m) => m.z ?? 0);
    const maxZ = Math.max(...zValues, 0);
    const minZ = Math.min(...zValues, 0);

    let newZ = current.z ?? 0;
    switch (action) {
      case "front":
        newZ = maxZ + 1;
        break;
      case "forward":
        newZ = (current.z ?? 0) + 1;
        break;
      case "backward":
        newZ = Math.max(0, (current.z ?? 0) - 1);
        break;
      case "back":
        newZ = Math.max(0, minZ - 1);
        break;
    }

    const res = await fetch(`/api/step/${step.id}/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ z: newZ }),
    });
    if (res.ok) {
      setStep((prev) => ({
        ...prev,
        media: prev.media.map((m) =>
          m.id === mediaId ? { ...m, z: newZ } : m
        ),
      }));
      onStepContentChange?.();
    }
  }, [step, onStepContentChange]);

  const handleDelete = useCallback(async (mediaId: string) => {
    const res = await fetch(`/api/step/${step.id}/media/${mediaId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setStep((prev) => ({
        ...prev,
        media: prev.media.filter((m) => m.id !== mediaId),
      }));
      onStepContentChange?.();
      if (selectedItem === mediaId) setSelectedItem(null);
    } else {
      console.error(data.error);
    }
  }, [step.id, selectedItem, onStepContentChange]);

  // Canvas interaction hook
  const {
    draggedItem,
    resizingItem,
    startDrag,
    startResize,
    handleMove,
    endInteraction,
  } = useCanvasInteraction({
    scale,
    onPositionUpdate: updatePosition,
    onSizeUpdate: updateSize,
  });

  // Keyboard navigation
  useKeyboardNavigation({
    selectedItem,
    items: step.media,
    onPositionUpdate: updatePosition,
  });

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, mediaId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, mediaId });
    setSelectedItem(mediaId);
  }, []);

  const toggleResizeMode = useCallback((mediaId: string, mode: 'scale' | 'resize') => {
    setResizeMode((prev) => ({
      ...prev,
      [mediaId]: prev[mediaId] === mode ? null : mode,
    }));
  }, []);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Step {step.order}/{totalSteps}
      </p>

      <Canvas
        ref={containerRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        scale={scale}
        onMouseMove={(e) => handleMove(e, contextMenu ? resizeMode[contextMenu.mediaId] : null)}
        onMouseUp={endInteraction}
        onClick={() => setContextMenu(null)}
      >
        {step.media
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((m) => (
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
              isSelected={selectedItem === m.id}
              isDragging={draggedItem === m.id}
              resizeMode={resizeMode[m.id]}
              onMouseDown={(e) => {
                const current = step.media.find((media) => media.id === m.id);
                if (current) {
                  startDrag(e, m.id, current.x ?? 0, current.y ?? 0);
                  setSelectedItem(m.id);
                }
              }}
              onClick={() => setSelectedItem(m.id)}
              onContextMenu={(e) => handleContextMenu(e, m.id)}
              onDelete={() => handleDelete(m.id)}
              onResizeStart={(e, handle) => {
                const current = step.media.find((media) => media.id === m.id);
                if (current) {
                  startResize(
                    e,
                    m.id,
                    handle,
                    current.width ?? 300,
                    current.height ?? 300,
                    current.x ?? 0,
                    current.y ?? 0
                  );
                }
              }}
            />
          ))}
      </Canvas>

      <p
        className="text-xs text-muted-foreground mt-2"
        style={{ visibility: selectedItem ? "visible" : "hidden" }}
      >
        Use arrow keys to move the selected image
      </p>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          resizeMode={resizeMode[contextMenu.mediaId]}
          onDelete={() => handleDelete(contextMenu.mediaId)}
          onToggleScale={() => toggleResizeMode(contextMenu.mediaId, 'scale')}
          onToggleResize={() => toggleResizeMode(contextMenu.mediaId, 'resize')}
          onLayer={(action) => updateLayer(contextMenu.mediaId, action)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}