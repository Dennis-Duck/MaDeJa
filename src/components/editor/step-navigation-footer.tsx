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
  const { canUndoStructure, undoStructure, flirtStructure, step } = useEditor();
  const structureUndoCount = flirtStructure?.undoStack.length ?? 0;

  const isCurrentStepTemp = flirtStructure?.newStepIds.includes(step.id) ?? false;

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

      {/* Temporary Step Warning */}
      {isCurrentStepTemp && (
        <div className="px-3 py-2 rounded bg-orange-500/10 text-orange-600 border border-orange-500/30 text-sm flex items-center gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Unsaved step</span>
        </div>
      )}

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
