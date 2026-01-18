"use client"

import { useEffect, useState } from "react"
import type { Step } from "@/types/step"
import type { TextSegment } from "@/types/text-segment"
import { useEditor } from "@/contexts/editor-context"

interface TextInspectorProps {
  textId?: string
  step?: Step
  onUpdateStep?: () => void
}

export function TextInspector({ textId, step, onUpdateStep }: TextInspectorProps) {
  const { updateStep } = useEditor()
  const [segments, setSegments] = useState<TextSegment[]>([])
  const [newSegmentText, setNewSegmentText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  useEffect(() => {
    if (!textId || !step) return

    const textElement = step.elements.find((el) => el.id === textId && el.type === "TEXT")

    if (!textElement) return

    setSegments(textElement.textSegments || [])
  }, [textId, step])

  const handleAddSegment = () => {
    if (!newSegmentText.trim()) return

    const newSegment: TextSegment = {
      id: crypto.randomUUID(),
      elementId: textId!,
      order: segments.length,
      text: newSegmentText,
    }

    const updatedSegments = [...segments, newSegment]
    setSegments(updatedSegments)
    setNewSegmentText("")

    updateStep(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === textId ? { ...el, textSegments: updatedSegments } : el)),
      }),
      "add-text-segment",
    )

    onUpdateStep?.()
  }

  const handleUpdateSegment = (segmentId: string) => {
    if (!editText.trim()) return

    const updatedSegments = segments.map((s) => (s.id === segmentId ? { ...s, text: editText } : s))
    setSegments(updatedSegments)
    setEditingId(null)
    setEditText("")

    updateStep(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === textId ? { ...el, textSegments: updatedSegments } : el)),
      }),
      "update-text-segment",
    )

    onUpdateStep?.()
  }

  const handleDeleteSegment = (segmentId: string) => {
    const updatedSegments = segments.filter((s) => s.id !== segmentId)
    setSegments(updatedSegments)

    updateStep(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === textId ? { ...el, textSegments: updatedSegments } : el)),
      }),
      "delete-text-segment",
    )

    onUpdateStep?.()
  }

  const startEdit = (segment: TextSegment) => {
    setEditingId(segment.id)
    setEditText(segment.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const handleAutoAdvanceChange = (checked: boolean) => {
    updateStep(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === textId ? { ...el, autoAdvance: checked } : el)),
      }),
      "toggle-auto-advance",
    )

    onUpdateStep?.()
  }

  const handleAutoAdvanceDelayChange = (delay: number) => {
    updateStep(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === textId ? { ...el, autoAdvanceDelay: delay } : el)),
      }),
      "update-auto-advance-delay",
    )

    onUpdateStep?.()
  }

  return (
    <div className="bg-background flex flex-col gap-4 p-4 rounded shadow max-h-[80vh] overflow-hidden">
      <h2 className="text-lg font-semibold">Text Segments</h2>

      {/* Segments lijst - scrollbaar */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-2">
        {segments.length === 0 && (
          <p className="text-foreground-muted text-sm italic">No text segments yet. Add one!</p>
        )}

        {segments.map((segment, index) => (
          <div
            key={segment.id}
            className="bg-[var(--background-secondary)] p-3 rounded border border-[var(--hover-border)] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted font-mono">Segment {index + 1}</span>
              <div className="flex gap-1">
                {editingId === segment.id ? (
                  <>
                    <button
                      onClick={() => handleUpdateSegment(segment.id)}
                      className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs px-2 py-1 rounded bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(segment)}
                      className="text-xs px-2 py-1 rounded bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSegment(segment.id)}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === segment.id ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 rounded border bg-[var(--background)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
              />
            ) : (
              <p className="text-foreground text-sm whitespace-pre-wrap">{segment.text}</p>
            )}
          </div>
        ))}
      </div>

      {/* Add nieuwe segment */}
      <div className="border-t border-[var(--hover-border)] pt-4 flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Add new segment</label>
        <textarea
          value={newSegmentText}
          onChange={(e) => setNewSegmentText(e.target.value)}
          placeholder="Type your text here…"
          className="w-full p-2 rounded border bg-[var(--background-secondary)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          rows={3}
        />
        <button
          onClick={handleAddSegment}
          disabled={!newSegmentText.trim()}
          className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add segment
        </button>
      </div>

      <div className="border-t border-[var(--hover-border)] pt-4 flex flex-col gap-4">
        <h3 className="text-md font-semibold">Auto Advance Settings</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-foreground">Enable Auto Advance</label>
          <input
            type="checkbox"
            checked={step?.elements.find((el) => el.id === textId)?.autoAdvance || false}
            onChange={(e) => handleAutoAdvanceChange(e.target.checked)}
          />
        </div>

        {step?.elements.find((el) => el.id === textId)?.autoAdvance && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-foreground">Delay (seconds)</label>
            <input
              type="number"
              min={1}
              value={step?.elements.find((el) => el.id === textId)?.autoAdvanceDelay || 3}
              onChange={(e) => handleAutoAdvanceDelayChange(Number.parseInt(e.target.value))}
              className="w-16 p-1 rounded border bg-[var(--background-secondary)] text-foreground"
            />
          </div>
        )}
      </div>
    </div>
  )
}
