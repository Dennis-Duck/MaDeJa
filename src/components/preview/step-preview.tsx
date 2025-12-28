"use client"

import type { Step } from "@/types/step"
import Image from "next/image"
import { useState } from "react"

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

// Canvas = "wereldruimte" van je editor
const CANVAS_SIZE = { width: 1920, height: 1080 }

export default function StepPreview({ step }: StepPreviewProps) {
  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>("mobile")
  const viewport = VIEWPORT_PRESETS[viewportPreset]

  // Schaal factor om canvas volledig in viewport te fitten
  const scaleX = viewport.width / CANVAS_SIZE.width
  const scaleY = viewport.height / CANVAS_SIZE.height
  const scale = Math.min(scaleX, scaleY)

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-5 gap-5">
      {/* Viewport selector */}
      <div className="flex gap-3 flex-wrap justify-center">
        {(Object.keys(VIEWPORT_PRESETS) as ViewportPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => setViewportPreset(preset)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewportPreset === preset
                ? "bg-blue-600 text-white border-2 border-blue-500"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {VIEWPORT_PRESETS[preset].label}
          </button>
        ))}
      </div>

      {/* Viewport info */}
      <div className="text-gray-600 text-sm text-center">
        Viewport: {viewport.width} × {viewport.height}px (Scale: {(scale * 100).toFixed(0)}%)
      </div>

      {/* Viewport container */}
      <div
        className="relative bg-black rounded-xl shadow-2xl overflow-hidden border-4 border-gray-900"
        style={{
          width: viewport.width,
          height: viewport.height,
          maxWidth: "90vw",
          maxHeight: "80vh",
        }}
      >
        {/* Canvas = world space */}
        <div
          className="absolute top-0 left-0 bg-black"
          style={{
            width: CANVAS_SIZE.width,
            height: CANVAS_SIZE.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Media-items */}
         {step.media
  .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
  .map((m) => {
    const x = m.x ?? 0
    const y = m.y ?? 0
    const width = m.width ?? 300
    const height = m.height ?? 300

    return (
      <div
        key={m.id}
        className="absolute"
        style={{
          left: `${(x / CANVAS_SIZE.width) * 100}%`,
          top: `${(y / CANVAS_SIZE.height) * 100}%`,
          width: `${(width / CANVAS_SIZE.width) * 100}%`,
          height: `${(height / CANVAS_SIZE.height) * 100}%`,
          zIndex: m.z ?? 0,
        }}
      >
        {m.type === "IMAGE" ? (
          <Image
            src={m.url}
            alt="Step media"
            fill
            className="rounded-lg object-cover pointer-events-none select-none"
            style={{ objectFit: "cover" }}
            unoptimized={m.url?.startsWith("http")}
          />
        ) : (
          <video
            src={m.url}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
            controls
          />
        )}
      </div>
    )
  })}

          {/* Text content */}
          {step.content && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                right: 20,
                textAlign: "center",
                color: "white",
                fontSize: 18,
                textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              {step.content}
            </div>
          )}
        </div>

        {/* Viewport indicator */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none z-50">
          {viewport.width}×{viewport.height}
        </div>
      </div>
    </div>
  )
}
