import { useState, useEffect, RefObject } from "react";

interface UseCanvasScaleProps {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasWidth: number;
  canvasHeight: number;
}

export function useCanvasScale({
  containerRef,
  canvasWidth,
  canvasHeight,
}: UseCanvasScaleProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    const timer = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timer);
    };
  }, [containerRef, canvasWidth, canvasHeight]);

  return scale;
}
