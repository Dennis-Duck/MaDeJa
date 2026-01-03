import { useState, useRef, useCallback } from "react";

interface DragState {
  x: number;
  y: number;
  itemX: number;
  itemY: number;
}

interface ResizeState {
  x: number;
  y: number;
  initialWidth: number;
  initialHeight: number;
  initialX: number;
  initialY: number;
}

interface UseCanvasInteractionProps {
  scale: number;
  onPositionUpdate: (id: string, x: number, y: number) => Promise<void>;
  onSizeUpdate: (id: string, width: number, height: number) => Promise<void>;
}

export function useCanvasInteraction({
  scale,
  onPositionUpdate,
  onSizeUpdate,
}: UseCanvasInteractionProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  
  const dragStartPos = useRef<DragState | null>(null);
  const resizeStartPos = useRef<ResizeState | null>(null);

  const startDrag = useCallback((
    e: React.MouseEvent,
    itemId: string,
    currentX: number,
    currentY: number
  ) => {
    setDraggedItem(itemId);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      itemX: currentX,
      itemY: currentY,
    };
  }, []);

  const startResize = useCallback((
    e: React.MouseEvent,
    itemId: string,
    handle: string,
    currentWidth: number,
    currentHeight: number,
    currentX: number,
    currentY: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingItem(itemId);
    setResizeHandle(handle);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialWidth: currentWidth,
      initialHeight: currentHeight,
      initialX: currentX,
      initialY: currentY,
    };
  }, []);

  const handleMove = useCallback((
    e: React.MouseEvent,
    resizeMode: 'scale' | 'resize' | null
  ) => {
    if (resizingItem && resizeHandle && resizeStartPos.current) {
      const deltaX = (e.clientX - resizeStartPos.current.x) / scale;
      const deltaY = (e.clientY - resizeStartPos.current.y) / scale;
      let newWidth = resizeStartPos.current.initialWidth;
      let newHeight = resizeStartPos.current.initialHeight;
      let newX = resizeStartPos.current.initialX;
      let newY = resizeStartPos.current.initialY;

      if (resizeMode === 'scale') {
        const aspectRatio = resizeStartPos.current.initialWidth / resizeStartPos.current.initialHeight;
        const delta = Math.max(deltaX, deltaY);
        newWidth = Math.max(50, resizeStartPos.current.initialWidth + delta);
        newHeight = Math.max(50, newWidth / aspectRatio);
        
        if (resizeHandle === "nw" || resizeHandle === "ne") {
          newY = resizeStartPos.current.initialY + (resizeStartPos.current.initialHeight - newHeight);
        }
        if (resizeHandle === "nw" || resizeHandle === "sw") {
          newX = resizeStartPos.current.initialX + (resizeStartPos.current.initialWidth - newWidth);
        }
      } else {
        switch (resizeHandle) {
          case "nw":
            newWidth = Math.max(50, resizeStartPos.current.initialWidth - deltaX);
            newHeight = Math.max(50, resizeStartPos.current.initialHeight - deltaY);
            newX = resizeStartPos.current.initialX + deltaX;
            newY = resizeStartPos.current.initialY + deltaY;
            break;
          case "n":
            newHeight = Math.max(50, resizeStartPos.current.initialHeight - deltaY);
            newY = resizeStartPos.current.initialY + deltaY;
            break;
          case "ne":
            newWidth = Math.max(50, resizeStartPos.current.initialWidth + deltaX);
            newHeight = Math.max(50, resizeStartPos.current.initialHeight - deltaY);
            newY = resizeStartPos.current.initialY + deltaY;
            break;
          case "e":
            newWidth = Math.max(50, resizeStartPos.current.initialWidth + deltaX);
            break;
          case "se":
            newWidth = Math.max(50, resizeStartPos.current.initialWidth + deltaX);
            newHeight = Math.max(50, resizeStartPos.current.initialHeight + deltaY);
            break;
          case "s":
            newHeight = Math.max(50, resizeStartPos.current.initialHeight + deltaY);
            break;
          case "sw":
            newWidth = Math.max(50, resizeStartPos.current.initialWidth - deltaX);
            newHeight = Math.max(50, resizeStartPos.current.initialHeight + deltaY);
            newX = resizeStartPos.current.initialX + deltaX;
            break;
          case "w":
            newWidth = Math.max(50, resizeStartPos.current.initialWidth - deltaX);
            newX = resizeStartPos.current.initialX + deltaX;
            break;
        }
      }

      const el = document.getElementById(`media-${resizingItem}`);
      if (el) {
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    } else if (draggedItem && dragStartPos.current) {
      const deltaX = (e.clientX - dragStartPos.current.x) / scale;
      const deltaY = (e.clientY - dragStartPos.current.y) / scale;
      const newX = dragStartPos.current.itemX + deltaX;
      const newY = dragStartPos.current.itemY + deltaY;

      const el = document.getElementById(`media-${draggedItem}`);
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    }
  }, [resizingItem, resizeHandle, draggedItem, scale]);

  const endInteraction = useCallback(async () => {
    if (resizingItem && resizeStartPos.current) {
      const el = document.getElementById(`media-${resizingItem}`);
      if (el) {
        const newWidth = parseInt(el.style.width) || resizeStartPos.current.initialWidth;
        const newHeight = parseInt(el.style.height) || resizeStartPos.current.initialHeight;
        const newX = parseInt(el.style.left) || resizeStartPos.current.initialX;
        const newY = parseInt(el.style.top) || resizeStartPos.current.initialY;

        await onSizeUpdate(resizingItem, newWidth, newHeight);
        await onPositionUpdate(resizingItem, newX, newY);
      }
      setResizingItem(null);
      setResizeHandle(null);
      resizeStartPos.current = null;
    } else if (draggedItem && dragStartPos.current) {
      const el = document.getElementById(`media-${draggedItem}`);
      if (el) {
        const newX = parseInt(el.style.left);
        const newY = parseInt(el.style.top);
        await onPositionUpdate(draggedItem, newX, newY);
      }
      setDraggedItem(null);
      dragStartPos.current = null;
    }
  }, [resizingItem, draggedItem, onPositionUpdate, onSizeUpdate]);

  return {
    draggedItem,
    resizingItem,
    startDrag,
    startResize,
    handleMove,
    endInteraction,
  };
}