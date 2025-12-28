"use client";

import { useState, useRef, useEffect } from "react";
import type { Step, MediaType } from "@/types/step";
import StepContextMenu from "./step-context-menu";
import Image from "next/image";

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
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mediaId: string;
  } | null>(null);
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState<{ [key: string]: 'scale' | 'resize' | null }>({});

  const dragStartPos = useRef<{
    x: number;
    y: number;
    itemX: number;
    itemY: number;
  } | null>(null);
  const resizeStartPos = useRef<{
    x: number;
    y: number;
    initialWidth: number;
    initialHeight: number;
    initialX: number;
    initialY: number;
  } | null>(null);

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


  // PATCH position
  async function updatePosition(mediaId: string, x: number, y: number) {
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
  }

  // PATCH size
  async function updateSize(mediaId: string, width: number, height: number) {
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
  }

  // Arrow keys move selected item
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedItem) return;
      const current = step.media.find((m) => m.id === selectedItem);
      if (!current) return;

      let newX = current.x ?? 0;
      let newY = current.y ?? 0;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newY -= 10;
          break;
        case "ArrowDown":
          e.preventDefault();
          newY += 10;
          break;
        case "ArrowLeft":
          e.preventDefault();
          newX -= 10;
          break;
        case "ArrowRight":
          e.preventDefault();
          newX += 10;
          break;
        default:
          return;
      }

      updatePosition(current.id, newX, newY);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, step]);

  // DELETE media
  async function handleDelete(mediaId: string) {
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
  }

  function handleResizeStart(
    e: React.MouseEvent,
    mediaId: string,
    handle: string
  ) {
    e.preventDefault();
    e.stopPropagation();
    const current = step.media.find((m) => m.id === mediaId);
    if (!current) return;

    setResizingItem(mediaId);
    setResizeHandle(handle);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialWidth: current.width || 300,
      initialHeight: current.height || 300,
      initialX: current.x || 0,
      initialY: current.y || 0,
    };
  }

  function handleResizeMove(e: React.MouseEvent) {
    if (!resizingItem || !resizeHandle || !resizeStartPos.current) return;

    const current = step.media.find((m) => m.id === resizingItem);
    if (!current) return;

    const mode = resizeMode[resizingItem] || 'resize';
    const deltaX = e.clientX - resizeStartPos.current.x;
    const deltaY = e.clientY - resizeStartPos.current.y;
    let newWidth = resizeStartPos.current.initialWidth;
    let newHeight = resizeStartPos.current.initialHeight;
    let newX = resizeStartPos.current.initialX;
    let newY = resizeStartPos.current.initialY;

    if (mode === 'scale') {
      // Scale mode: maintain aspect ratio
      const aspectRatio = resizeStartPos.current.initialWidth / resizeStartPos.current.initialHeight;

      switch (resizeHandle) {
        case "nw": // top-left
        case "ne": // top-right
        case "sw": // bottom-left
        case "se": // bottom-right
          const delta = Math.max(deltaX, deltaY);
          newWidth = Math.max(50, resizeStartPos.current.initialWidth + delta);
          newHeight = Math.max(50, newWidth / aspectRatio);
          if (resizeHandle === "nw" || resizeHandle === "ne") {
            newY = resizeStartPos.current.initialY + (resizeStartPos.current.initialHeight - newHeight);
          }
          if (resizeHandle === "nw" || resizeHandle === "sw") {
            newX = resizeStartPos.current.initialX + (resizeStartPos.current.initialWidth - newWidth);
          }
          break;
      }
    } else {
      // Resize mode: free sizing
      switch (resizeHandle) {
        case "nw": // top-left
          newWidth = Math.max(50, resizeStartPos.current.initialWidth - deltaX);
          newHeight = Math.max(50, resizeStartPos.current.initialHeight - deltaY);
          newX = resizeStartPos.current.initialX + deltaX;
          newY = resizeStartPos.current.initialY + deltaY;
          break;
        case "n": // top
          newHeight = Math.max(50, resizeStartPos.current.initialHeight - deltaY);
          newY = resizeStartPos.current.initialY + deltaY;
          break;
        case "ne": // top-right
          newWidth = Math.max(50, resizeStartPos.current.initialWidth + deltaX);
          newHeight = Math.max(50, resizeStartPos.current.initialHeight - deltaY);
          newY = resizeStartPos.current.initialY + deltaY;
          break;
        case "e": // right
          newWidth = Math.max(50, resizeStartPos.current.initialWidth + deltaX);
          break;
        case "se": // bottom-right
          newWidth = Math.max(50, resizeStartPos.current.initialWidth + deltaX);
          newHeight = Math.max(50, resizeStartPos.current.initialHeight + deltaY);
          break;
        case "s": // bottom
          newHeight = Math.max(50, resizeStartPos.current.initialHeight + deltaY);
          break;
        case "sw": // bottom-left
          newWidth = Math.max(50, resizeStartPos.current.initialWidth - deltaX);
          newHeight = Math.max(50, resizeStartPos.current.initialHeight + deltaY);
          newX = resizeStartPos.current.initialX + deltaX;
          break;
        case "w": // left
          newWidth = Math.max(50, resizeStartPos.current.initialWidth - deltaX);
          newX = resizeStartPos.current.initialX + deltaX;
          break;
      }
    }

    const el = document.getElementById(`media-${resizingItem}`);
    if (el) {
      el.style.width = `${newWidth}px`;
      el.style.height = `${newHeight}px`;
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    }
  }

  async function handleResizeEnd() {
    if (!resizingItem || !resizeStartPos.current) return;
    const el = document.getElementById(`media-${resizingItem}`);
    if (el) {
      // Parse values with fallback to initial values
      const newWidth = parseInt(el.style.width) || resizeStartPos.current.initialWidth;
      const newHeight = parseInt(el.style.height) || resizeStartPos.current.initialHeight;
      const newX = parseInt(el.style.left) || resizeStartPos.current.initialX;
      const newY = parseInt(el.style.top) || resizeStartPos.current.initialY;

      // Update state immediately for UI feedback
      setStep((prev) => ({
        ...prev,
        media: prev.media.map((m) =>
          m.id === resizingItem ? { ...m, width: newWidth, height: newHeight, x: newX, y: newY } : m
        ),
      }));

      // Persist to database - don't call onStepContentChange until both updates complete
      // This prevents the state from being overwritten by a fetchStep call
      await updateSize(resizingItem, newWidth, newHeight);
      await updatePosition(resizingItem, newX, newY);
    }
    setResizingItem(null);
    setResizeHandle(null);
    resizeStartPos.current = null;
  }

  // PATCH layer (z-index)
  async function updateLayer(
    mediaId: string,
    action: "front" | "forward" | "backward" | "back"
  ) {
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
  }

  // Drag handlers
  function handleMouseDown(e: React.MouseEvent, mediaId: string) {
    const current = step.media.find((m) => m.id === mediaId);
    if (!current) return;
    setDraggedItem(mediaId);
    setSelectedItem(mediaId);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      itemX: current.x ?? 0,
      itemY: current.y ?? 0,
    };
  }

  function handleContextMenu(
    e: React.MouseEvent,
    mediaId: string
  ) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, mediaId });
    setSelectedItem(mediaId);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (resizingItem) {
      handleResizeMove(e);
      return;
    }
    if (!draggedItem || !dragStartPos.current) return;
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    const newX = dragStartPos.current.itemX + deltaX;
    const newY = dragStartPos.current.itemY + deltaY;

    const el = document.getElementById(`media-${draggedItem}`);
    if (el) {
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    }
  }

  async function handleMouseUp() {
    if (resizingItem) {
      handleResizeEnd();
      return;
    }
    if (!draggedItem || !dragStartPos.current) return;
    const el = document.getElementById(`media-${draggedItem}`);
    if (el) {
      const newX = parseInt(el.style.left);
      const newY = parseInt(el.style.top);
      await updatePosition(draggedItem, newX, newY);
    }
    setDraggedItem(null);
    dragStartPos.current = null;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Step {step.order}/{totalSteps}
      </p>

      <div
        className="relative bg-muted/20 rounded-lg border border-border mx-auto"
        style={{
    width: "1920px",
    height: "1080px",
    maxWidth: "90vw",
    maxHeight: "80vh",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          setContextMenu(null);
        }}
      >
        {step.media
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((m) => (
            <div
              key={m.id}
              id={`media-${m.id}`}
              className="absolute rounded-lg shadow-lg"
              style={{
                left: m.x ?? 0,
                top: m.y ?? 0,
                width: m.width ?? 300,
                height: m.height ?? 300,
                zIndex: m.z ?? 0,
                cursor: draggedItem === m.id ? "grabbing" : "grab",
                outline: selectedItem === m.id ? "2px solid #3b82f6" : "none",
                outlineOffset: "2px",
              }}
              onMouseDown={(e) => handleMouseDown(e, m.id)}
              onClick={() => setSelectedItem(m.id)}
              onContextMenu={(e) => handleContextMenu(e, m.id)}
            >
              {m.type === "IMAGE" ? (
                <>
                  <Image
                    src={m.url || "/placeholder.svg"}
                    alt="Step media"
                    fill
                    className="rounded-lg object-cover pointer-events-none select-none"
                    draggable={false}
                    unoptimized={m.url?.startsWith('http')} // Als externe URLs
                  />
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white font-bold"
                  >
                    ×
                  </button>

                  {/* Resize handles */}
                  {selectedItem === m.id && resizeMode[m.id] && (
                    <>
                      {resizeMode[m.id] === 'resize' && (
                        <>
                          {/* Top-left corner */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, m.id, "nw")}
                            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 cursor-nwse-resize rounded-full"
                            style={{ pointerEvents: "auto" }}
                          />
                          {/* Top center */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, m.id, "n")}
                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 cursor-ns-resize rounded-full"
                            style={{ pointerEvents: "auto" }}
                          />
                          {/* Top-right corner */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, m.id, "ne")}
                            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 cursor-nesw-resize rounded-full"
                            style={{ pointerEvents: "auto" }}
                          />
                          {/* Right center */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, m.id, "e")}
                            className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-blue-500 cursor-ew-resize rounded-full"
                            style={{ pointerEvents: "auto" }}
                          />
                          {/* Bottom center */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, m.id, "s")}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 cursor-ns-resize rounded-full"
                            style={{ pointerEvents: "auto" }}
                          />
                          {/* Bottom-left corner */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, m.id, "sw")}
                            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 cursor-sw-resize rounded-full"
                            style={{ pointerEvents: "auto" }}
                          />
                          {/* Left center */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, m.id, "w")}
                            className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-blue-500 cursor-ew-resize rounded-full"
                            style={{ pointerEvents: "auto" }}
                          />
                        </>
                      )}
                      {/* Bottom-right corner - visible in both modes */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, m.id, "se")}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 cursor-se-resize rounded-full"
                        style={{ pointerEvents: "auto" }}
                      />
                    </>
                  )}
                </>
              ) : (
                <video
                  src={m.url}
                  controls
                  className="w-full h-full rounded-lg block"
                />
              )}

              {/* z-value badge */}
              <div className="absolute left-1 top-1 bg-black/60 text-white text-xs px-1 rounded">
                Z: {m.z ?? 0}
              </div>
            </div>
          ))}
      </div>

      {selectedItem && (
        <p className="text-xs text-muted-foreground mt-2">
          Use arrow keys to move the selected image
        </p>
      )}

      {contextMenu && (
        <div style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x }} className="z-[9999] min-w-[160px] rounded-md overflow-hidden">
          <div style={{ background: "#0f1724", border: "1px solid #374151", boxShadow: "0 6px 18px rgba(2,6,23,0.6)" }}>
            <button
              onClick={() => {
                handleDelete(contextMenu.mediaId);
                setContextMenu(null);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/5 border-b border-slate-700"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setResizeMode((prev) => ({
                  ...prev,
                  [contextMenu.mediaId]: prev[contextMenu.mediaId] === 'scale' ? null : 'scale',
                }));
                setContextMenu(null); // <-- voeg dit toe
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/5 border-b border-slate-700"
            >
              {resizeMode[contextMenu.mediaId] === 'scale' ? "✓ " : ""}Scale
            </button>

            <button
              onClick={() => {
                setResizeMode((prev) => ({
                  ...prev,
                  [contextMenu.mediaId]: prev[contextMenu.mediaId] === 'resize' ? null : 'resize',
                }));
                setContextMenu(null); // <-- voeg dit toe
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/5 border-b border-slate-700"
            >
              {resizeMode[contextMenu.mediaId] === 'resize' ? "✓ " : ""}Resize
            </button>

            <button
              onClick={() => {
                updateLayer(contextMenu.mediaId, "front");
                setContextMenu(null);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/5"
            >
              Bring to Front
            </button>
            <button
              onClick={() => {
                updateLayer(contextMenu.mediaId, "forward");
                setContextMenu(null);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/5"
            >
              Bring Forward
            </button>
            <button
              onClick={() => {
                updateLayer(contextMenu.mediaId, "backward");
                setContextMenu(null);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/5"
            >
              Send Backward
            </button>
            <button
              onClick={() => {
                updateLayer(contextMenu.mediaId, "back");
                setContextMenu(null);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/5"
            >
              Send to Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
