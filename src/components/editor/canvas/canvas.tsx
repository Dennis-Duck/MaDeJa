"use client";

import { ReactNode, forwardRef } from "react";

interface CanvasProps {
  width: number;
  height: number;
  scale: number;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onClick: () => void;
  children: ReactNode;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(
  ({ width, height, scale, onMouseMove, onMouseUp, onClick, children }, ref) => {
    return (
      <div
        ref={ref}
        className="relative bg-muted/20 rounded-lg border border-border mx-auto overflow-hidden"
        style={{
          aspectRatio: `${width}/${height}`,
          maxHeight: "80vh",
          width: "100%",
          maxWidth: "90vw",
        }}
        onClick={onClick}
      >
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            width,
            height,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {children}
        </div>
      </div>
    );
  }
);

Canvas.displayName = "Canvas";