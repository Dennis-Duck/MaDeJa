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
    try {
      const res = await fetch(`/api/step/${stepId}/elements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add element");
      }

      onElementAdded?.();
    } catch (err) {
      console.error("Error adding element:", err);
      alert("Failed to add element");
    }
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
