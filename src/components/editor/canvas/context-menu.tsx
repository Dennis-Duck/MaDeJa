"use client";

interface ContextMenuProps {
  x: number;
  y: number;
  resizeMode: 'scale' | 'resize' | null;
  onDelete: () => void;
  onToggleScale: () => void;
  onToggleResize: () => void;
  onLayer: (action: "front" | "forward" | "backward" | "back") => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  resizeMode,
  onDelete,
  onToggleScale,
  onToggleResize,
  onLayer,
  onClose,
}: ContextMenuProps) {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      className="fixed bg-white border border-gray-300 shadow-lg z-[9999] rounded-md overflow-hidden"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="menuitem"
        onClick={() => handleAction(onDelete)}
        onMouseDown={(e) => e.preventDefault()}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      >
        Delete
      </div>

      <div
        role="menuitem"
        onClick={() => handleAction(onToggleScale)}
        onMouseDown={(e) => e.preventDefault()}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      >
        {resizeMode === 'scale' ? "✓ " : ""}Scale
      </div>

      <div
        role="menuitem"
        onClick={() => handleAction(onToggleResize)}
        onMouseDown={(e) => e.preventDefault()}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      >
        {resizeMode === 'resize' ? "✓ " : ""}Resize
      </div>

      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("front"))}
        onMouseDown={(e) => e.preventDefault()}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      >
        Bring to Front
      </div>

      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("forward"))}
        onMouseDown={(e) => e.preventDefault()}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      >
        Bring Forward
      </div>

      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("backward"))}
        onMouseDown={(e) => e.preventDefault()}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      >
        Send Backward
      </div>

      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("back"))}
        onMouseDown={(e) => e.preventDefault()}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm"
      >
        Send to Back
      </div>
    </div>
  );
}