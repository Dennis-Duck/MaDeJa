"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { Media } from "@/types/media"
import type { Element } from "@/types/element"
import Image from "next/image"
import type { Logic } from "@/types/logic"
import { TextItem } from "../editor/canvas/elements/text"

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

interface SlideshowStep {
  id?: string
  order?: number
  media: Media[]
  elements: Element[]
  logics?: Logic[]
}

interface SlideshowProps {
  steps: SlideshowStep[]
  maxHeight?: string
  topStrip?: number
}

export default function Slideshow({ steps, maxHeight, topStrip = 0 }: SlideshowProps) {
  const [current, setCurrent] = useState(0)
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const nextSlide = () => setCurrent((prev) => (prev + 1) % steps.length)
  const prevSlide = () => setCurrent((prev) => (prev - 1 + steps.length) % steps.length)

  const effectiveTopStrip = isFullscreen ? 0 : topStrip

  const enterFullscreen = () => {
    if (!containerRef.current) return
    if (containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen()
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  const executeLogicChain = (triggerLogicId: string) => {
    const step = steps[current]
    if (!step?.logics) return

    const jumps = step.logics.filter((l: Logic) => l.type === "JUMP" && l.parentId === triggerLogicId)

    jumps.forEach((jump: Logic) => {
      if (!jump.config) return

      try {
        const cfg = JSON.parse(jump.config)
        if (cfg.targetStepOrder === undefined) return

        const targetIndex = steps.findIndex((s) => s.order === cfg.targetStepOrder)

        if (targetIndex !== -1) {
          setCurrent(targetIndex)
        }
      } catch {
        console.warn("Invalid jump config", jump.id)
      }
    })
  }

  const handleButtonClick = (buttonId: string) => {
    const step = steps[current]
    if (!step?.logics) return

    const triggers = step.logics.filter(
      (l: Logic) => l.type === "TRIGGER" && l.subtype === "BUTTON_CLICK" && l.parentId === buttonId,
    )

    triggers.forEach((trigger: Logic) => {
      executeLogicChain(trigger.id)
    })
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight
      const availableHeight = Math.max(containerHeight - effectiveTopStrip, 0)
      const scaleX = containerWidth / CANVAS_WIDTH
      const scaleY = availableHeight / CANVAS_HEIGHT
      setScale(Math.min(scaleX, scaleY))
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    const timer = setTimeout(updateScale, 100)
    return () => {
      window.removeEventListener("resize", updateScale)
      clearTimeout(timer)
    }
  }, [effectiveTopStrip, isFullscreen])

  const startX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX
    if (startX.current - endX > 50) nextSlide()
    else if (endX - startX.current > 50) prevSlide()
  }

  useEffect(() => {
    const step = steps[current]
    if (!step?.logics) return

    const stepLoadTriggers = step.logics.filter((l: Logic) => l.type === "TRIGGER" && l.subtype === "STEP_LOAD")

    stepLoadTriggers.forEach((trigger: Logic) => {
      executeLogicChain(trigger.id)
    })
  }, [current])

  if (steps.length === 0) {
    return (
      <div
        className="relative w-full rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--background)]"
        style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`, maxHeight: maxHeight || "100vh" }}
      >
        <p className="text-[var(--foreground-muted)]">Geen media beschikbaar</p>
      </div>
    )
  }

  const scaledWidth = CANVAS_WIDTH * scale
  const scaledHeight = CANVAS_HEIGHT * scale

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden mx-auto bg-[var(--background)]"
      style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`, maxHeight: maxHeight || "100vh" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fullscreen toggle */}
      <button
        onClick={isFullscreen ? exitFullscreen : enterFullscreen}
        className="absolute top-2 right-2 z-20 px-3 py-1 rounded transition-colors bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
        aria-label="Fullscreen"
      >
        {isFullscreen ? "⤫" : "⛶"}
      </button>

      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          transform: "translate(-50%, -50%)",
          background: "var(--background-secondary)",
          overflow: "hidden",
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            background: "transparent",
          }}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${index === current ? "opacity-100" : "opacity-0"}`}
            >
              {/* MEDIA */}
              {step.media
                .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
                .map((m) =>
                  m.type === "IMAGE" ? (
                    <div
                      key={m.id}
                      className="absolute"
                      style={{
                        left: `${((m.x ?? 0) / CANVAS_WIDTH) * 100}%`,
                        top: `${((m.y ?? 0) / CANVAS_HEIGHT) * 100}%`,
                        width: `${((m.width ?? 300) / CANVAS_WIDTH) * 100}%`,
                        height: `${((m.height ?? 300) / CANVAS_HEIGHT) * 100}%`,
                        zIndex: m.z ?? 0,
                      }}
                    >
                      <Image src={m.url || "/placeholder.svg"} alt="" fill style={{ objectFit: "cover" }} />
                    </div>
                  ) : (
                    <video
                      key={m.id}
                      src={m.url}
                      controls
                      className="absolute"
                      style={{
                        left: `${((m.x ?? 0) / CANVAS_WIDTH) * 100}%`,
                        top: `${((m.y ?? 0) / CANVAS_HEIGHT) * 100}%`,
                        width: `${((m.width ?? 300) / CANVAS_WIDTH) * 100}%`,
                        height: `${((m.height ?? 300) / CANVAS_HEIGHT) * 100}%`,
                        zIndex: m.z ?? 0,
                        objectFit: "cover",
                      }}
                    />
                  ),
                )}

              {/* ELEMENT BUTTONS */}
              {step.elements
                .filter((el) => el.type === "BUTTON")
                .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
                .map((el) => {
                  return (
                    <button
                      key={el.id}
                      onClick={() => handleButtonClick(el.id)}
                      className="font-semibold rounded shadow-lg absolute bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150 cursor-pointer active:scale-95 flex items-center justify-center"
                      style={{
                        left: `${((el.x ?? 0) / CANVAS_WIDTH) * 100}%`,
                        top: `${((el.y ?? 0) / CANVAS_HEIGHT) * 100}%`,
                        width: `${((el.width ?? 200) / CANVAS_WIDTH) * 100}%`,
                        height: `${((el.height ?? 50) / CANVAS_HEIGHT) * 100}%`,
                        zIndex: el.z ?? 0,
                        fontSize: `${Math.min(
                          (((el.width ?? 300) / CANVAS_WIDTH) * scaledWidth) / 10,
                          (((el.height ?? 80) / CANVAS_HEIGHT) * scaledHeight) / 3,
                        )}px`,
                        padding: 0,
                      }}
                    >
                      {el.text ?? "Button"}
                    </button>
                  )
                })}

              {/* ELEMENT TEXT */}
              {step.elements
                .filter((el) => el.type === "TEXT")
                .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
                .map((el) => {
                  return (
                    <TextItem
                      key={el.id}
                      id={el.id}
                      x={(el.x / CANVAS_WIDTH) * scaledWidth}
                      y={(el.y / CANVAS_HEIGHT) * scaledHeight}
                      width={((el.width ?? 300) / CANVAS_WIDTH) * scaledWidth}
                      height={((el.height ?? 80) / CANVAS_HEIGHT) * scaledHeight}
                      z={el.z ?? 0}
                      text={el.text ?? undefined}
                      textSegments={el.textSegments}
                      isSelected={false}
                      isDragging={false}
                      resizeMode={null}
                      mode="preview"
                      autoAdvance={el.autoAdvance ?? false}
                      autoAdvanceDelay={el.autoAdvanceDelay ?? 3}
                    />
                  )
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Navigatie pijlen */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded z-10 transition-colors bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
      >
        ◀
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded z-10 transition-colors bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
      >
        ▶
      </button>

      {/* Slide indicators */}
      {steps.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`rounded-full transition-all ${index === current ? "w-8 h-2 bg-[var(--accent)]" : "w-2 h-2 bg-[var(--foreground-muted)] hover:bg-[var(--accent)]"}`}
              aria-label={`Ga naar slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
