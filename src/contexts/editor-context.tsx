"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
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

  // Update step with undo tracking (per-step)
  updateStep: (updater: (prev: Step) => Step, actionType?: string) => void

  // Dirty state (unsaved changes)
  isDirty: boolean

  // Undo functionality (per-step)
  canUndo: boolean
  undo: () => void
  undoStack: EditorAction[]

  // Save functionality (global - saves current step)
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
const UNDO_STACK_STORAGE_KEY = "editor-undo-stacks"
const STEP_STATE_STORAGE_KEY = "editor-step-states"

// Helper to load undo stack from localStorage
function loadUndoStack(stepId: string): EditorAction[] {
  try {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(UNDO_STACK_STORAGE_KEY)
    if (!stored) return []
    const allStacks = JSON.parse(stored) as Record<string, EditorAction[]>
    return allStacks[stepId] || []
  } catch {
    return []
  }
}

// Helper to save undo stack to localStorage
function saveUndoStackToStorage(stepId: string, stack: EditorAction[]) {
  try {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(UNDO_STACK_STORAGE_KEY) || "{}"
    const allStacks = JSON.parse(stored) as Record<string, EditorAction[]>
    allStacks[stepId] = stack
    localStorage.setItem(UNDO_STACK_STORAGE_KEY, JSON.stringify(allStacks))
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Helper to load edited step state from localStorage
function loadStepState(stepId: string, fallback: Step): Step {
  try {
    if (typeof window === "undefined") return fallback
    const stored = localStorage.getItem(STEP_STATE_STORAGE_KEY)
    if (!stored) return fallback
    const allStates = JSON.parse(stored) as Record<string, Step>
    return allStates[stepId] || fallback
  } catch {
    return fallback
  }
}

// Helper to save step state to localStorage
function saveStepStateToStorage(stepId: string, step: Step) {
  try {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STEP_STATE_STORAGE_KEY) || "{}"
    const allStates = JSON.parse(stored) as Record<string, Step>
    allStates[stepId] = step
    localStorage.setItem(STEP_STATE_STORAGE_KEY, JSON.stringify(allStates))
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function EditorProvider({ children, initialStep }: EditorProviderProps) {
  // Load the edited state from localStorage if it exists, otherwise use initialStep
  const [step, setStepState] = useState<Step>(() =>
    loadStepState(initialStep.id, initialStep)
  )
  const [originalStep, setOriginalStep] = useState<Step>(initialStep)
  // Load undo stack for this step from localStorage
  const [undoStack, setUndoStack] = useState<EditorAction[]>(() =>
    loadUndoStack(initialStep.id)
  )
  const [isSaving, setIsSaving] = useState(false)

  // Track if there are unsaved changes
  const isDirty = JSON.stringify(step) !== JSON.stringify(originalStep)
  const canUndo = undoStack.length > 0

  // Set step without tracking (used for navigation between steps)
  const setStep = useCallback((newStep: Step) => {
    // Only reset state if it's a different step
    if (newStep.id !== step.id) {
      // Load the edited state for the new step from localStorage
      const savedState = loadStepState(newStep.id, newStep)
      setStepState(savedState)
      setOriginalStep(newStep) // originalStep is the server version
      // Load the undo stack for the new step
      const newStack = loadUndoStack(newStep.id)
      setUndoStack(newStack)
    }
  }, [step.id])

  // Persist step state to localStorage whenever it changes
  useEffect(() => {
    saveStepStateToStorage(step.id, step)
  }, [step])

  // Persist undo stack to localStorage whenever it changes
  useEffect(() => {
    saveUndoStackToStorage(step.id, undoStack)
  }, [step.id, undoStack])

  // Update step with undo tracking (per-step)
  const updateStep = useCallback((updater: (prev: Step) => Step, actionType = "update") => {
    setStepState((prev) => {
      // Save current state to undo stack for this step
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

  // Undo last action (per-step)
  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack

      const lastAction = stack[stack.length - 1]
      setStepState(lastAction.previousState)

      return stack.slice(0, -1)
    })
  }, [])

  // Save all changes to database (global - saves current step)
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
        const data = await res.json()
        const savedStep = data.step

        // Update state with the saved step from database
        setStepState(savedStep)
        setOriginalStep(savedStep)
        // Clear undo stack for this step after successful save
        setUndoStack([])
        // Also clear from localStorage
        saveUndoStackToStorage(step.id, [])
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
