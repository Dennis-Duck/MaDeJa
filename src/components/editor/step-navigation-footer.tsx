
"use client";

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
  return (
    <div className="flex gap-2">
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
    </div>
  );
}
