import { useEffect } from "react";

interface UseKeyboardNavigationProps {
  selectedItem: string | null;
  items: Array<{ id: string; x?: number; y?: number }>;
  onPositionUpdate: (id: string, x: number, y: number) => Promise<void>;
}

export function useKeyboardNavigation({
  selectedItem,
  items,
  onPositionUpdate,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedItem) return;
      const current = items.find((m) => m.id === selectedItem);
      if (!current) return;

      let newX = current.x ?? 0;
      let newY = current.y ?? 0;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newY -= 10;
          break;
        case "ArrowDown":
          e.preventDefault();
          newY += 10;
          break;
        case "ArrowLeft":
          e.preventDefault();
          newX -= 10;
          break;
        case "ArrowRight":
          e.preventDefault();
          newX += 10;
          break;
        default:
          return;
      }

      onPositionUpdate(selectedItem, newX, newY);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, items, onPositionUpdate]);
}
