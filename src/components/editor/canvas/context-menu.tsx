"use client";

interface ContextMenuProps {
  itemType: "media" | "element" | "logic";
  x: number;
  y: number;
  z: number;
  maxZ: number;
  canBringToFront: boolean;
  resizeMode: 'scale' | 'resize' | null;
  onDelete: () => void;
  onToggleScale: () => void;
  onToggleResize: () => void;
  onLayer: (action: "front" | "forward" | "backward" | "back") => void;
  onClose: () => void;
}

export function ContextMenu({
  itemType,
  x,
  y,
  z,
  maxZ,
  canBringToFront,
  resizeMode,
  onDelete,
  onToggleScale,
  onToggleResize,
  onLayer,
  onClose,
}: ContextMenuProps) {
  const handleAction = (action: () => void, disabled = false) => {
    if (disabled) return;
    action();
    onClose();
  };

  const minZ = itemType === "element" ? 1 : 0;
  const canSendBackward = z > minZ;
  const canSendBack = z > minZ;
  const canSendFront = canBringToFront;

  
const itemClass = (enabled: boolean) =>
    enabled
      ? "cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      : "cursor-not-allowed px-4 py-2 text-sm font-medium text-gray-400 bg-gray-50 border-b";

  return (
    <div
      className="fixed bg-white border border-gray-300 shadow-lg z-[9999] rounded-md overflow-hidden"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Delete */}
      <div
        role="menuitem"
        onClick={() => handleAction(onDelete)}
        onMouseDown={(e) => e.preventDefault()}
        className={itemClass(true)}
        aria-disabled={false}
      >
        Delete
      </div>

      {/* Scale */}
      <div
        role="menuitem"
        onClick={() => handleAction(onToggleScale)}
        onMouseDown={(e) => e.preventDefault()}
        className={itemClass(true)}
        aria-disabled={false}
      >
        {resizeMode === 'scale' ? "✓ " : ""}Scale
      </div>

      {/* Resize */}
      <div
        role="menuitem"
        onClick={() => handleAction(onToggleResize)}
        onMouseDown={(e) => e.preventDefault()}
        className={itemClass(true)}
        aria-disabled={false}
      >
        {resizeMode === 'resize' ? "✓ " : ""}Resize
      </div>

      {/* Bring to Front */}
      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("front"), !canSendFront)}
        onMouseDown={(e) => e.preventDefault()}
        className={itemClass(canSendFront)}
        aria-disabled={!canSendFront}
      >
        Bring to Front
      </div>

      {/* Bring Forward */}
      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("forward"), !canSendFront)}
        onMouseDown={(e) => e.preventDefault()}
        className={itemClass(canSendFront)}
        aria-disabled={!canSendFront}
      >
        Bring Forward
      </div>

      {/* Send Backward */}
      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("backward"), !canSendBackward)}
        onMouseDown={(e) => e.preventDefault()}
        className={itemClass(canSendBackward)}
        aria-disabled={!canSendBackward}
      >
        Send Backward
      </div>

      {/* Send to Back */}
      <div
        role="menuitem"
        onClick={() => handleAction(() => onLayer("back"), !canSendBack)}
        onMouseDown={(e) => e.preventDefault()}
        className={itemClass(canSendBack)}
        aria-disabled={!canSendBack}
      >
        Send to Back
      </div>
    </div>
  );
}