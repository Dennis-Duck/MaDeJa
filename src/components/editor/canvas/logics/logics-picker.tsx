"use client"

import { useEditor } from "@/contexts/editor-context"

const LOGICS = [
  { type: "TRIGGER", label: "Trigger" },
  { type: "JUMP", label: "Jump" },
  { type: "CHECK", label: "Check" },
  { type: "ACTION", label: "Action" },
]

export default function LogicsPicker() {
  const { updateStep, step } = useEditor()

  const addLogic = (type: string) => {
    const newLogic = {
      id: crypto.randomUUID(),
      stepId: step.id,
      type,
      subtype: null,
      config: null,
      parentId: null,
      parentType: null,
      x: 100,
      y: 100,
      z: 0,
      width: 150,
      height: 50,
    }

    updateStep(
      (prev) => ({
        ...prev,
        logics: [...prev.logics, newLogic as any],
      }),
      "add-logic",
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {LOGICS.map((logic) => (
        <button
          key={logic.type}
          onClick={() => addLogic(logic.type)}
          className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + {logic.label}
        </button>
      ))}
    </div>
  )
}
