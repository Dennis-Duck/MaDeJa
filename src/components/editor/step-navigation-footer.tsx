"use client";

import { useEditor } from "@/contexts/editor-context";

interface Props {
  stepOrder: number;
  isLast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onDelete: () => void;
  onHome: () => void;
  onPreview: () => void;
}

export default function StepNavigationFooter({
  stepOrder,
  isLast,
  onNext,
  onPrevious,
  onDelete,
  onHome,
  onPreview,
}: Props) {
  // Use the LIGHT flirt-structure undo from the editor context (Layer 1)
  // This is meant for undoing step-level operations like create/delete/reorder,
  // separate from the heavy per-step content undo in the toolbar.
  const { canUndoStructure, undoStructure, flirtStructure } = useEditor();
  const structureUndoCount = flirtStructure?.undoStack.length ?? 0;

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Previous */}
      <button
        onClick={onPrevious}
        disabled={stepOrder === 1}
        className="px-3 py-1 rounded bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        Previous
      </button>

      {/* Next / Create */}
      <button
        onClick={onNext}
        className="px-3 py-1 rounded bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isLast ? "Create new Step" : "Next"}
      </button>

      {/* Delete Step */}
      <button
        onClick={onDelete}
        className="px-3 py-1 rounded border bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors duration-150"
      >
        Delete Step
      </button>

      {/* Preview Step */}
      <button
        onClick={onPreview}
        className="px-3 py-1 rounded bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] transition-colors duration-150"
      >
        Preview Step
      </button>

      {/* Home */}
      <button
        onClick={onHome}
        className="px-3 py-1 rounded bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] transition-colors duration-150"
      >
        Home
      </button>

      {/* Undo (flirt structure: step create/delete/reorder) */}
      <button
        onClick={undoStructure}
        disabled={!canUndoStructure}
        className="ml-auto px-3 py-1 rounded bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
        title={
          canUndoStructure
            ? "Undo last structural change (step created/deleted/reordered)"
            : "Nothing to undo on flirt structure"
        }
      >
        <span>Undo</span>
        {canUndoStructure && (
          <span className="text-xs bg-[var(--accent)] text-[var(--foreground)] px-1.5 py-0.5 rounded-full">
            {structureUndoCount}
          </span>
        )}
      </button>
    </div>
  );
}
