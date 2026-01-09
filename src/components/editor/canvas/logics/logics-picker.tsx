"use client";

interface LogicsPickerProps {
  stepId: string;
  onLogicAdded?: () => void;
}

const LOGICS = [
  { type: "TRIGGER", label: "Trigger" },
  { type: "JUMP", label: "Jump" },
  { type: "CHECK", label: "Check" },
  { type: "ACTION", label: "Action" },
];

export default function LogicsPicker({ stepId, onLogicAdded }: LogicsPickerProps) {

  const addLogic = async (type: string) => {
    try {
      const res = await fetch(`/api/step/${stepId}/logics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add logic block");
      }

      onLogicAdded?.();
    } catch (err) {
      console.error("Error adding logic block:", err);
      alert("Failed to add logic block");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {LOGICS.map(logic => (
        <button
          key={logic.type}
          onClick={() => addLogic(logic.type)}
          className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + {logic.label}
        </button>
      ))}
    </div>
  );
}
