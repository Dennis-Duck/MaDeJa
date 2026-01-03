"use client";

interface ElementsPickerProps {
  stepId: string;
  onElementAdded?: () => void;
}

const ELEMENTS = [
  { type: "BUTTON", label: "Button" },
  { type: "TEXT", label: "Text" },
  { type: "TIMER", label: "Timer" },
];

export default function ElementsPicker({
  stepId,
  onElementAdded,
}: ElementsPickerProps) {

  const addElement = async (type: string) => {
    await fetch("/api/step-elements", {
      method: "POST",
      body: JSON.stringify({
        stepId,
        type,
      }),
    });

    onElementAdded?.();
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {ELEMENTS.map(el => (
        <button
          key={el.type}
          onClick={() => addElement(el.type)}
          className="border rounded-md px-2 py-2 text-sm hover:bg-muted transition"
        >
          + {el.label}
        </button>
      ))}
    </div>
  );
}
