
"use client";

import { useState, useRef, useEffect } from "react";
import { Media } from "@/types/media";
import Image from "next/image";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

interface SlideshowProps {
  steps: Media[][]; // elke step bevat meerdere media
  maxHeight?: string;
  topStrip?: number; // hoogte van de bovenrand (px) die zichtbaar blijft
}

export default function Slideshow({ steps, maxHeight, topStrip = 40 }: SlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % steps.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + steps.length) % steps.length);

  const effectiveTopStrip = isFullscreen ? 0 : topStrip;

  const enterFullscreen = () => {
    if (!containerRef.current) return;
    if (containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Scale gebaseerd op beschikbare ruimte, met topStrip "window" hoogte
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const availableHeight = Math.max(containerHeight - topStrip, 0); // ruimte voor canvas window
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = availableHeight / CANVAS_HEIGHT;
      setScale(Math.min(scaleX, scaleY)); // contain: geen cropping
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    const timer = setTimeout(updateScale, 100);
    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timer);
    };
  }, [topStrip]);

  const startX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    if (startX.current - endX > 50) nextSlide();
    else if (endX - startX.current > 50) prevSlide();
  };

  if (steps.length === 0) {
    return (
      <div
        className="relative w-full rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--background)]"
        style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`, maxHeight: maxHeight || "100vh" }}
      >
        <p className="text-[var(--foreground-muted)]">Geen media beschikbaar</p>
      </div>
    );
  }

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

      {/* Window: neemt de beschikbare hoogte (containerHeight - topStrip) en ligt onderaan */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          height: `calc(100% - ${effectiveTopStrip}px)`,
          background: "var(--background-secondary)",
        }}
      >
        {/* Canvas: onderaan uitlijnen en horizontaal centreren, met contain-scale */}
        <div
          className="absolute left-1/2 bottom-0"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "bottom center",
            background: "transparent",
          }}
        >
          {steps.map((stepMedia, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${index === current ? "opacity-100" : "opacity-0"}`}
            >
              {[...stepMedia]
  .sort((a: Media, b: Media) => (a.z ?? 0) - (b.z ?? 0))
  .map((m: Media) => 

                  m.type === "IMAGE" ? (
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
                      <Image
                        src={m.url}
                        alt=""
                        fill
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        unoptimized={m.url.startsWith("http")}
                      />
                    </div>
                  ) : (
                    <video
                      key={m.id}
                      src={m.url}
                      controls
                      className="absolute"
                      style={{
                        left: m.x ?? 0,
                        top: m.y ?? 0,
                        width: m.width ?? 300,
                        height: m.height ?? 300,
                        zIndex: m.z ?? 0,
                        objectFit: "cover",
                      }}
                    />
                  )
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigatie pijlen (blijven op container, dus ook zichtbaar over de bovenrand) */}
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
  );
}
