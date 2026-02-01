"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Step } from "@/types/step"
import { useEditor } from "@/contexts/editor-context"

interface ButtonInspectorProps {
  buttonId?: string
  step?: Step
}

export function ButtonInspector({ buttonId, step}: ButtonInspectorProps) {
  const { updateStep } = useEditor()
  const [text, setText] = useState("")
  const button = step?.elements.find((el) => el.id === buttonId && el.type === "BUTTON")

  useEffect(() => {
    if (button) {
      setText(button.text ?? "")
    }
  }, [button])

  if (!buttonId || !step || !button) return null

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
  }

  const handleSave = () => {
    updateStep(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === button.id ? { ...el, text } : el)),
      }),
      "update-button-text",
    )
  }

  return (
    <div className="bg-background flex flex-col gap-2 p-4 rounded shadow">
      <h2 className="text-lg font-semibold">Button Inspector</h2>

      <label className="block text-foreground-muted">Button Text</label>
      <input
        type="text"
        value={text}
        placeholder="Type your text here…"
        onChange={handleTextChange}
        className="w-full p-2 rounded border bg-[var(--background-secondary)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <button
        onClick={handleSave}
        className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
      >
        Apply
      </button>
    </div>
  )
}
