"use client"

import type { Step } from "@/types/step"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"

interface StepPreviewProps {
  step: Step
}

// Vooraf ingestelde viewport groottes
const VIEWPORT_PRESETS = {
  mobile: { width: 375, height: 667, label: "Mobile (9:16)" },
  tablet: { width: 768, height: 1024, label: "Tablet (3:4)" },
  desktop: { width: 1920, height: 1080, label: "Desktop (16:9)" },
} as const

type ViewportPreset = keyof typeof VIEWPORT_PRESETS

// Canvas = "wereldruimte" van je editor (net zoals in Slideshow)
const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

export default function StepPreview({ step }: StepPreviewProps) {
  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>("desktop")
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const viewport = VIEWPORT_PRESETS[viewportPreset]

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight

      // Scale the canvas (1920x1080) to fit the viewport
      const scaleX = containerWidth / CANVAS_WIDTH
      const scaleY = containerHeight / CANVAS_HEIGHT
      setScale(Math.min(scaleX, scaleY))
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    const timer = setTimeout(updateScale, 100)
    return () => {
      window.removeEventListener("resize", updateScale)
      clearTimeout(timer)
    }
  }, [viewportPreset])

  const scaledWidth = CANVAS_WIDTH * scale
  const scaledHeight = CANVAS_HEIGHT * scale

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
        Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px (Scale: {(scale * 100).toFixed(0)}%)
      </div>

      <div
        ref={containerRef}
        className="relative bg-transparent rounded-xl overflow-hidden"
        style={{
          width: `${viewport.width}px`,
          height: `${viewport.height}px`,
          maxWidth: "90vw",
          maxHeight: "80vh",
        }}
      >
        <div
          className="absolute bg-[var(--background-secondary)] border-4 border-[var(--border)]"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            overflow: "hidden",
          }}
        >
          {/* MEDIA */}
          {step.media
            .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
            .map((m) => {
              const leftPercent = ((m.x ?? 0) / CANVAS_WIDTH) * 100
              const topPercent = ((m.y ?? 0) / CANVAS_HEIGHT) * 100
              const widthPercent = ((m.width ?? 300) / CANVAS_WIDTH) * 100
              const heightPercent = ((m.height ?? 300) / CANVAS_HEIGHT) * 100

              return (
                <div
                  key={m.id}
                  className="absolute"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                    zIndex: m.z ?? 0,
                  }}
                >
                  {m.type === "IMAGE" ? (
                    <Image
                      src={m.url || "/placeholder.svg"}
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
              )
            })}

          {/* ELEMENTS */}
          {step.elements
            .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
            .map((el) => {
              const leftPercent = ((el.x ?? 0) / CANVAS_WIDTH) * 100
              const topPercent = ((el.y ?? 0) / CANVAS_HEIGHT) * 100
              const widthPercent = ((el.width ?? 200) / CANVAS_WIDTH) * 100
              const heightPercent = ((el.height ?? 60) / CANVAS_HEIGHT) * 100

              switch (el.type) {
                case "BUTTON":
                  return (
                    <button
                      key={el.id}
                      className="absolute px-3 py-1 rounded bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                        zIndex: el.z ?? 0,
                        fontSize: "clamp(0.75rem, 2vw, 1rem)",
                      }}
                    >
                      {el.text ?? "Button"}
                    </button>
                  )

                // Voeg hier toekomstige element types toe:
                // case "TEXT":
                //   return <div key={el.id}>...</div>
                // case "TIMER":
                //   return <div key={el.id}>...</div>

                default:
                  return null
              }
            })}

          {/* Text content (legacy) */}
          {step.content && (
            <div
              style={{
                position: "absolute",
                bottom: "2%",
                left: "2%",
                right: "2%",
                textAlign: "center",
                color: "var(--foreground)",
                fontSize: "1.125rem",
                textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              {step.content}
            </div>
          )}

          <div className="absolute top-2 left-2 rounded pointer-events-none z-50 text-xs px-2 py-1 bg-[var(--hover-bg)] text-[var(--foreground)]">
            {viewport.width}×{viewport.height}
          </div>
        </div>
      </div>
    </div>
  )
}