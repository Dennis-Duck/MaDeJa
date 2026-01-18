"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Step } from "@/types/step"

// Action types for undo tracking
type EditorAction = {
  type: string
  previousState: Step
  timestamp: number
}

interface EditorContextType {
  // Current step state (in memory)
  step: Step
  setStep: (step: Step) => void

  // Update step with undo tracking
  updateStep: (updater: (prev: Step) => Step, actionType?: string) => void

  // Dirty state (unsaved changes)
  isDirty: boolean

  // Undo functionality
  canUndo: boolean
  undo: () => void
  undoStack: EditorAction[]

  // Save functionality
  save: () => Promise<boolean>
  isSaving: boolean

  // Original step (last saved state)
  originalStep: Step
  setOriginalStep: (step: Step) => void
}

const EditorContext = createContext<EditorContextType | null>(null)

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider")
  }
  return context
}

interface EditorProviderProps {
  children: ReactNode
  initialStep: Step
}

const MAX_UNDO_STACK = 50

export function EditorProvider({ children, initialStep }: EditorProviderProps) {
  const [step, setStepState] = useState<Step>(initialStep)
  const [originalStep, setOriginalStep] = useState<Step>(initialStep)
  const [undoStack, setUndoStack] = useState<EditorAction[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Track if there are unsaved changes
  const isDirty = JSON.stringify(step) !== JSON.stringify(originalStep)
  const canUndo = undoStack.length > 0

  // Set step without tracking (used for initial load)
  const setStep = useCallback((newStep: Step) => {
    setStepState(newStep)
  }, [])

  // Update step with undo tracking
  const updateStep = useCallback((updater: (prev: Step) => Step, actionType = "update") => {
    setStepState((prev) => {
      // Save current state to undo stack
      setUndoStack((stack) => {
        const newStack = [
          ...stack,
          {
            type: actionType,
            previousState: prev,
            timestamp: Date.now(),
          },
        ]
        // Limit stack size
        return newStack.slice(-MAX_UNDO_STACK)
      })

      return updater(prev)
    })
  }, [])

  // Undo last action
  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack

      const lastAction = stack[stack.length - 1]
      setStepState(lastAction.previousState)

      return stack.slice(0, -1)
    })
  }, [])

  // Save all changes to database
  const save = useCallback(async (): Promise<boolean> => {
    if (!isDirty) return true

    setIsSaving(true)

    try {
      // Save the entire step state
      const res = await fetch(`/api/step/${step.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step),
      })

      if (res.ok) {
        // Update original step to current state
        setOriginalStep(step)
        // Clear undo stack after successful save
        setUndoStack([])
        return true
      }

      console.error("Failed to save step")
      return false
    } catch (error) {
      console.error("Error saving step:", error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [step, isDirty])

  return (
    <EditorContext.Provider
      value={{
        step,
        setStep,
        updateStep,
        isDirty,
        canUndo,
        undo,
        undoStack,
        save,
        isSaving,
        originalStep,
        setOriginalStep,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}
