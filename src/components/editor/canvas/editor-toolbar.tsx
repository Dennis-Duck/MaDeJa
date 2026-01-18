"use client"

import { useEditor } from "@/contexts/editor-context"

export function EditorToolbar() {
  const { isDirty, canUndo, undo, save, isSaving, undoStack } = useEditor()

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
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

      {/* Save button */}
      <button
        onClick={save}
        disabled={!isDirty || isSaving}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 shadow-sm ${
          isDirty
            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--foreground)] hover:opacity-90"
            : "bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground)] opacity-60"
        } disabled:cursor-not-allowed`}
        title={isDirty ? "Save changes" : "No changes to save"}
      >
        <span className="text-sm font-medium">
          {isSaving ? "Saving…" : "Save"}
        </span>

        {isDirty && !isSaving && (
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </button>
    </div>
  )
}
