"use client";

interface Props {
  stepOrder: number;
  isLast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onDelete: () => void;
  onHome: () => void;
}

export default function StepNavigationFooter({
  stepOrder,
  isLast,
  onNext,
  onPrevious,
  onDelete,
  onHome,
}: Props) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onPrevious} disabled={stepOrder === 1}>
        Previous
      </button>

      <button onClick={onNext}>
        {isLast ? "Create new Step" : "Next"}
      </button>

      <button onClick={onDelete} style={{ color: "red" }}>
        Delete Step
      </button>

      <button onClick={onHome}>
        Home
      </button>
    </div>
  );
}
