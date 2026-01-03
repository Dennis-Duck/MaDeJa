"use client";

interface ResizeHandlesProps {
  resizeMode: 'scale' | 'resize';
  onResizeStart: (e: React.MouseEvent, handle: string) => void;
}

export function ResizeHandles({ resizeMode, onResizeStart }: ResizeHandlesProps) {
  const handleClass = "absolute w-4 h-4 bg-blue-500 rounded-full";
  const handleStyle = { pointerEvents: "auto" as const };

  return (
    <>
      {resizeMode === 'resize' && (
        <>
          <div
            onMouseDown={(e) => onResizeStart(e, "nw")}
            className={`${handleClass} -top-2 -left-2 cursor-nwse-resize`}
            style={handleStyle}
          />
          <div
            onMouseDown={(e) => onResizeStart(e, "n")}
            className={`${handleClass} -top-2 left-1/2 -translate-x-1/2 cursor-ns-resize`}
            style={handleStyle}
          />
          <div
            onMouseDown={(e) => onResizeStart(e, "ne")}
            className={`${handleClass} -top-2 -right-2 cursor-nesw-resize`}
            style={handleStyle}
          />
          <div
            onMouseDown={(e) => onResizeStart(e, "e")}
            className={`${handleClass} top-1/2 -right-2 -translate-y-1/2 cursor-ew-resize`}
            style={handleStyle}
          />
          <div
            onMouseDown={(e) => onResizeStart(e, "s")}
            className={`${handleClass} -bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize`}
            style={handleStyle}
          />
          <div
            onMouseDown={(e) => onResizeStart(e, "sw")}
            className={`${handleClass} -bottom-2 -left-2 cursor-sw-resize`}
            style={handleStyle}
          />
          <div
            onMouseDown={(e) => onResizeStart(e, "w")}
            className={`${handleClass} top-1/2 -left-2 -translate-y-1/2 cursor-ew-resize`}
            style={handleStyle}
          />
        </>
      )}
      <div
        onMouseDown={(e) => onResizeStart(e, "se")}
        className={`${handleClass} -bottom-2 -right-2 cursor-se-resize`}
        style={handleStyle}
      />
    </>
  );
}