"use client"

import { useEditor } from "@/contexts/editor-context"
import { Z } from "@/lib/z-index"

export function EditorToolbar() {
  const { canUndo, undo, undoStack } = useEditor()

  return (
    <div style={{ zIndex: Z.UI }}>
      {/* Undo button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        title={canUndo ? `Undo (${undoStack.length} actions)` : "Nothing to undo"}
      >
        <span className="text-sm font-medium">Undo</span>

        {canUndo && (
          <span className="text-xs bg-[var(--accent)] text-[var(--foreground)] px-1.5 py-0.5 rounded-full">
            {undoStack.length}
          </span>
        )}
      </button>
    </div>
  )
}
