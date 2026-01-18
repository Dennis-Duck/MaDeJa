"use client"

import { useEditor } from "@/contexts/editor-context"

const ELEMENTS = [
  { type: "BUTTON", label: "Button" },
  { type: "TEXT", label: "Text" },
  { type: "TIMER", label: "Timer" },
]

export default function ElementsPicker() {
  const { updateStep } = useEditor()

  const addElement = (type: string) => {
    updateStep(
      (prev) => ({
        ...prev,
        elements: [
          ...prev.elements,
          {
            id: crypto.randomUUID(),
            stepId: prev.id,
            type,
            x: 100,
            y: 100,
            z: 1,
            width: type === "BUTTON" ? 200 : 300,
            height: type === "BUTTON" ? 60 : 80,
            text: type === "BUTTON" ? "Button" : null,
            textSegments: [],
            autoAdvance: false,
            autoAdvanceDelay: null,
          },
        ],
      }),
      "add-element",
    )
  }


  return (
    <div className="grid grid-cols-2 gap-2">
      {ELEMENTS.map((el) => (
        <button
          key={el.type}
          onClick={() => addElement(el.type)}
          className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + {el.label}
        </button>
      ))}
    </div>
  )
}
