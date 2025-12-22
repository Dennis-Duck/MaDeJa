"use client";

import { useState, useRef, useEffect } from "react";
import type { Step, MediaType } from "@/types/step";

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

  const dragStartPos = useRef<{
    x: number;
    y: number;
    itemX: number;
    itemY: number;
  } | null>(null);

  // Refetch step on mount to ensure latest positions
  useEffect(() => {
    async function fetchStep() {
      const res = await fetch("/api/step/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, stepId: initialStep.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setStep(data.step);
      }
    }
    fetchStep();
  }, [initialFlirtId, initialStep.id]);

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

 

  // PATCH layer (z-index)
  async function updateLayer(mediaId: string, direction: "up" | "down") {
    const current = step.media.find((m) => m.id === mediaId);
    if (!current) return;
    const newZ = direction === "up" ? (current.z ?? 0) + 1 : Math.max(0, (current.z ?? 0) - 1);

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

  function handleMouseMove(e: React.MouseEvent) {
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
        className="relative w-full bg-muted/20 rounded-lg border border-border"
        style={{ height: "600px" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {step.media
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((m) => (
            <div
              key={m.id}
              id={`media-${m.id}`}
              className="absolute rounded-lg shadow-lg transition-shadow"
              style={{
                left: m.x ?? 0,
                top: m.y ?? 0,
                zIndex: m.z ?? 0,
                cursor: draggedItem === m.id ? "grabbing" : "grab",
                outline: selectedItem === m.id ? "2px solid #3b82f6" : "none",
                outlineOffset: "2px",
              }}
              onMouseDown={(e) => handleMouseDown(e, m.id)}
              onClick={() => setSelectedItem(m.id)}
            >
              {m.type === "IMAGE" ? (
                <>
                  <img
                    src={m.url || "/placeholder.svg"}
                    alt="Step media"
                    width={300}
                    className="rounded-lg object-cover block pointer-events-none select-none"
                    draggable={false}
                  />
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white font-bold"
                  >
                    ×
                  </button>
                </>
              ) : (
                <video
                  src={m.url}
                  width={300}
                  controls
                  className="rounded-lg block"
                />
              )}
            </div>
          ))}
      </div>

      {selectedItem && (
        <p className="text-xs text-muted-foreground mt-2">
          Use arrow keys to move the selected image
        </p>
      )}
    </div>
  );
}
