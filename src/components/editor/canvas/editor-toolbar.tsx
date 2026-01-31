"use client"

import { useEditor } from "@/contexts/editor-context"
import { Z } from "@/lib/z-index"

export function EditorToolbar() {
  const { isDirty, isSaving, canUndo, save, undo, undoStack, canRedo, redo, redoStack } = useEditor()

  return (
    <div style={{ zIndex: Z.UI }} className="flex items-center gap-2">
      {/* Save button */}
      <button
        onClick={save}
        disabled={!isDirty || isSaving}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        title={isSaving ? "Saving..." : isDirty ? "Save all steps in this flirt" : "No changes to save"}
      >
        <span className="text-sm font-medium">
          {isSaving ? "Saving…" : "Save Flirt"}
        </span>

        {isDirty && !isSaving && (
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Undo button */}
      <button
        onClick={undo}
        disabled={!canUndo || isSaving}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        title={canUndo && !isSaving ? `Undo (${undoStack.length} actions)` : isSaving ? "Saving..." : "Nothing to undo"}
      >
        <span className="text-sm font-medium">⟲</span>

        {canUndo && !isSaving && (
          <span className="text-xs bg-[var(--accent)] text-[var(--foreground)] px-1.5 py-0.5 rounded-full">
            {undoStack.length}
          </span>
        )}
      </button>

      {/* Redo button */}
      <button
        onClick={redo}
        disabled={!canRedo || isSaving}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        title={canRedo && !isSaving ? `Redo (${redoStack.length} actions)` : isSaving ? "Saving..." : "Nothing to redo"}
      >
        <span className="text-sm font-medium">⟳</span>

        {canRedo && !isSaving && (
          <span className="text-xs bg-[var(--accent)] text-[var(--foreground)] px-1.5 py-0.5 rounded-full">
            {redoStack.length}
          </span>
        )}
      </button>
    </div>
  )
}
