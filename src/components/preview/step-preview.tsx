
"use client";

import type { Step } from "@/types/step";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface StepPreviewProps {
  step: Step;
}

// Vooraf ingestelde viewport groottes
const VIEWPORT_PRESETS = {
  mobile: { width: 375, height: 667, label: "Mobile (9:16)" },
  tablet: { width: 768, height: 1024, label: "Tablet (3:4)" },
  desktop: { width: 1920, height: 1080, label: "Desktop (16:9)" },
} as const;

type ViewportPreset = keyof typeof VIEWPORT_PRESETS;

// Canvas = "wereldruimte" van je editor (net zoals in Slideshow)
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export default function StepPreview({ step }: StepPreviewProps) {
  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>("desktop");
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const viewport = VIEWPORT_PRESETS[viewportPreset];

  // Bereken scale net zoals in Slideshow
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    const timer = setTimeout(updateScale, 100);
    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timer);
    };
  }, [viewportPreset]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] p-5 gap-5">
      {/* Viewport selector */}
      <div className="flex gap-3 flex-wrap justify-center">
        {(Object.keys(VIEWPORT_PRESETS) as ViewportPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => setViewportPreset(preset)}
            className={
              viewportPreset === preset
                ? "px-4 py-2 rounded-lg font-medium transition-all bg-[var(--accent)] text-[var(--foreground)] border-2 border-[var(--hover-border)]"
                : "px-4 py-2 rounded-lg font-medium transition-all bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)]"
            }
          >
            {VIEWPORT_PRESETS[preset].label}
          </button>
        ))}
      </div>

      {/* Viewport info */}
      <div className="text-[var(--foreground-muted)] text-sm text-center">
        Viewport: {viewport.width} × {viewport.height}px (Scale: {(scale * 100).toFixed(0)}%)
      </div>

      {/* Viewport container - net zoals in Slideshow */}
      <div
        ref={containerRef}
        className="relative rounded-xl shadow-2xl overflow-hidden border-4 border-[var(--border)] mx-auto bg-[var(--background-secondary)]"
        style={{
          width: viewport.width,
          height: viewport.height,
          maxWidth: "90vw",
          maxHeight: "80vh",
        }}
      >
        {/* Canvas container met scale transformatie */}
        <div
          className="absolute top-1/2 left-1/2 bg-[var(--background-secondary)]"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Media-items */}
          {step.media
            .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
            .map((m) => (
              <div
                key={m.id}
                className="absolute"
                style={{
                  left: m.x ?? 0,
                  top: m.y ?? 0,
                  width: m.width ?? 300,
                  height: m.height ?? 300,
                  zIndex: m.z ?? 0,
                }}
              >
                {m.type === "IMAGE" ? (
                  <Image
                    src={m.url}
                    alt="Step media"
                    fill
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    unoptimized={m.url?.startsWith("http")}
                  />
                ) : (
                  <video
                    src={m.url}
                    controls
                    className="absolute"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
            ))}

          {/* Text content */}
          {step.content && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                right: 20,
                textAlign: "center",
                color: "var(--foreground)",
                fontSize: 18,
                textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              {step.content}
            </div>
          )}
        </div>

        {/* Viewport indicator */}
        <div className="absolute top-2 left-2 rounded pointer-events-none z-50 text-xs px-2 py-1" style={{ background: "var(--hover-bg)", color: "var(--foreground)" }}>
          {viewport.width}×{viewport.height}
        </div>
      </div>
    </div>
  );
}
