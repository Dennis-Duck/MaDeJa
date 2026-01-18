"use client"

import type { Step } from "@/types/step"
import { useEffect, useState } from "react"
import { useEditor } from "@/contexts/editor-context"

interface TriggerInspectorProps {
  logicId?: string
  step?: Step
  onUpdateStep?: () => void
}

export function TriggerInspector({ logicId, step, onUpdateStep }: TriggerInspectorProps) {
  const { updateStep } = useEditor()
  const [triggerType, setTriggerType] = useState<"BUTTON_CLICK" | "STEP_LOAD" | "">("")
  const [targetButton, setTargetButton] = useState("")
  const availableButtons = step?.elements.filter((e) => e.type === "BUTTON") || []

  const logic = step?.logics.find((l) => l.id === logicId)

  useEffect(() => {
    if (!logic) return

    setTriggerType((logic.subtype as any) ?? "")

    if (logic.subtype === "BUTTON_CLICK") {
      setTargetButton(logic.parentId ?? "")
    } else {
      setTargetButton("")
    }
  }, [logicId, logic])

  const handleSave = () => {
    if (!triggerType) return

    let parentId: string | null = null
    let parentType: string | null = null

    if (triggerType === "BUTTON_CLICK") {
      if (!targetButton) return
      parentId = targetButton
      parentType = "ELEMENT"
    }

    updateStep(
      (prev) => ({
        ...prev,
        logics: prev.logics.map((l) => (l.id === logicId ? { ...l, subtype: triggerType, parentId, parentType } : l)),
      }),
      "update-trigger",
    )

    onUpdateStep?.()
  }

  if (!logicId || !step) return null

  return (
    <div className="bg-background flex flex-col gap-2 p-4">
      <h2 className="text-lg font-semibold">Trigger Inspector</h2>

      <label className="block text-foreground-muted">Trigger Type</label>
      <select
        value={triggerType}
        onChange={(e) => setTriggerType(e.target.value as any)}
        className="w-full p-2 rounded border bg-[var(--background-secondary)]"
      >
        <option value="">Select trigger type</option>
        <option value="BUTTON_CLICK">Button Click</option>
        <option value="STEP_LOAD">Step Load</option>
      </select>

      {triggerType === "BUTTON_CLICK" && (
        <>
          <label className="block text-foreground-muted mt-2">Target Button</label>
          <select
            value={targetButton}
            onChange={(e) => setTargetButton(e.target.value)}
            className="w-full p-2 rounded border bg-[var(--background-secondary)]"
          >
            <option value="">Select target button</option>
            {availableButtons.map((btn) => (
              <option key={btn.id} value={btn.id}>
                {btn.text}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        onClick={handleSave}
        className="mt-2 py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
      >
        Apply
      </button>
    </div>
  )
}
