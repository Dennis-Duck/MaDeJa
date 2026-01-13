"use client"

import { useEffect, useState } from "react"
import { Step } from "@/types/step"

interface TextInspectorProps {
  textId?: string
  step?: Step
  onUpdateStep?: () => void
}

export function TextInspector({ textId, step, onUpdateStep }: TextInspectorProps) {
  if (!textId || !step) return null

  const textElement = step.elements.find(
    (el) => el.id === textId && el.type === "TEXT"
  )

  const [text, setText] = useState(textElement?.text ?? "")

  useEffect(() => {
    setText(textElement?.text ?? "")
  }, [textElement?.text])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
  }

  const handleSave = async () => {
    if (!textElement) return

    const res = await fetch(`/api/step/${step.id}/elements/${textElement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    if (res.ok) {
      onUpdateStep?.()
    }
  }

  return (
    <div className="bg-background flex flex-col gap-2 p-4 rounded shadow">
      <h2 className="text-lg font-semibold">Text Inspector</h2>

      <label className="block text-foreground-muted">Text content</label>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        className="w-full p-2 rounded border bg-[var(--background-secondary)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <button
        onClick={handleSave}
        className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
      >
        Save
      </button>
    </div>
  )
}
