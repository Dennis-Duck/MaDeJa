interface StepContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onBringToFront: () => void;
  onClose: () => void;
}

export default function StepContextMenu({
  x,
  y,
  onDelete,
  onBringToFront,
  onClose,
}: StepContextMenuProps) {
  return (
    <div
      className="fixed bg-white border border-gray-300 shadow-lg z-[9999] rounded-md overflow-hidden"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="menuitem"
        onClick={onDelete}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm border-b"
      >
        Delete
      </div>

      <div
        role="menuitem"
        onClick={onBringToFront}
        className="cursor-pointer px-4 py-2 text-gray-900 font-medium hover:bg-gray-100 text-sm"
      >
        Bring to Front
      </div>
    </div>
  );
}
