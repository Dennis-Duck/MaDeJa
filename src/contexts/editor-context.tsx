"use client"

import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from "react"
import type { Step } from "@/types/step"

// Action types for undo tracking
type EditorAction = {
  type: string
  previousState: Step
  timestamp: number
}

// Per-step state
type StepEditorState = {
  step: Step
  originalStep: Step
  undoStack: EditorAction[]
  redoStack: EditorAction[]
}

// Multi-step context type
interface EditorContextType {
  // Get current step
  step: Step

  // Set current step (navigate between steps)
  setStep: (step: Step) => void

  // Update step with undo tracking (affects current step)
  updateStep: (updater: (prev: Step) => Step, actionType?: string) => void

  // Global dirty state (true if ANY step has unsaved changes)
  isDirty: boolean

  // Per-step dirty state
  isStepDirty: (stepId: string) => boolean

  // Undo functionality (per-step)
  canUndo: boolean
  undo: () => void
  undoStack: EditorAction[]

  // Redo functionality (per-step)
  canRedo: boolean
  redo: () => void
  redoStack: EditorAction[]

  // Global save (saves ALL dirty steps in parallel)
  save: () => Promise<boolean>
  isSaving: boolean

  // Add or update a step in context
  addOrUpdateStep: (step: Step) => void

  // Get step state for a specific step ID
  getStepState: (stepId: string) => StepEditorState | undefined

  // Remove a step (cleanup state + storage)
  removeStep: (stepId: string) => void

  // Sync order changes after deletion (updates all steps with new orders from DB)
  syncStepOrders: (updatedOrders: Array<{ id: string; order: number }>) => void
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
  initialStep: Step | null
}

const MAX_UNDO_STACK = 50
const UNDO_STACK_STORAGE_KEY = "editor-undo-stacks"
const REDO_STACK_STORAGE_KEY = "editor-redo-stacks"
const STEP_STATE_STORAGE_KEY = "editor-step-states"

// Default empty step
const EMPTY_STEP: Step = {
  id: "",
  flirtId: "",
  order: 0,
  content: "",
  media: [],
  elements: [],
  logics: [],
}

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

// Helper to load redo stack from localStorage
function loadRedoStack(stepId: string): EditorAction[] {
  try {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(REDO_STACK_STORAGE_KEY)
    if (!stored) return []
    const allStacks = JSON.parse(stored) as Record<string, EditorAction[]>
    return allStacks[stepId] || []
  } catch {
    return []
  }
}

// Helper to save redo stack to localStorage
function saveRedoStackToStorage(stepId: string, stack: EditorAction[]) {
  try {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(REDO_STACK_STORAGE_KEY) || "{}"
    const allStacks = JSON.parse(stored) as Record<string, EditorAction[]>
    allStacks[stepId] = stack
    localStorage.setItem(REDO_STACK_STORAGE_KEY, JSON.stringify(allStacks))
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

// Helper to remove step state + undo/redo stacks from localStorage
function removeStepStateFromStorage(stepId: string) {
  try {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STEP_STATE_STORAGE_KEY) || "{}"
    const allStates = JSON.parse(stored) as Record<string, Step>
    if (allStates[stepId]) {
      delete allStates[stepId]
      localStorage.setItem(STEP_STATE_STORAGE_KEY, JSON.stringify(allStates))
    }
  } catch {
    // Silently fail
  }
}

function removeUndoStackFromStorage(stepId: string) {
  try {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(UNDO_STACK_STORAGE_KEY) || "{}"
    const allStacks = JSON.parse(stored) as Record<string, EditorAction[]>
    if (allStacks[stepId]) {
      delete allStacks[stepId]
      localStorage.setItem(UNDO_STACK_STORAGE_KEY, JSON.stringify(allStacks))
    }
  } catch {
    // Silently fail
  }
}

function removeRedoStackFromStorage(stepId: string) {
  try {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(REDO_STACK_STORAGE_KEY) || "{}"
    const allStacks = JSON.parse(stored) as Record<string, EditorAction[]>
    if (allStacks[stepId]) {
      delete allStacks[stepId]
      localStorage.setItem(REDO_STACK_STORAGE_KEY, JSON.stringify(allStacks))
    }
  } catch {
    // Silently fail
  }
}

// Reducer state type - holds ALL steps
type EditorState = {
  // All steps keyed by stepId
  steps: Record<string, StepEditorState>
  // Currently active step ID
  currentStepId: string
  // Global saving state
  isSaving: boolean
}

// Reducer action types
type EditorReducerAction =
  | { type: "INITIALIZE_STEP"; step: Step }
  | { type: "ADD_OR_UPDATE_STEP"; step: Step }
  | { type: "SET_CURRENT_STEP"; stepId: string }
  | { type: "UPDATE_STEP"; stepId: string; updater: (prev: Step) => Step; actionType: string }
  | { type: "UNDO"; stepId: string }
  | { type: "REDO"; stepId: string }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; savedSteps: Step[] }
  | { type: "SAVE_ERROR" }
  | { type: "REMOVE_STEP"; stepId: string }
  | { type: "SYNC_STEP_ORDERS"; updatedOrders: Array<{ id: string; order: number }> }

// Reducer function - all state updates are atomic
function editorReducer(state: EditorState, action: EditorReducerAction): EditorState {
  switch (action.type) {
    case "INITIALIZE_STEP": {
      // Load saved state for this step from localStorage
      const savedState = loadStepState(action.step.id, action.step)
      const savedStack = loadUndoStack(action.step.id)
      const savedRedoStack = loadRedoStack(action.step.id)

      const stepEditorState: StepEditorState = {
        step: savedState,
        originalStep: action.step,
        undoStack: savedStack,
        redoStack: savedRedoStack,
      }

      return {
        ...state,
        steps: {
          ...state.steps,
          [action.step.id]: stepEditorState,
        },
        currentStepId: action.step.id,
      }
    }

    case "ADD_OR_UPDATE_STEP": {
      const existing = state.steps[action.step.id]
      if (existing) {
        // Keep existing edits, just update originalStep
        const updated: StepEditorState = {
          step: existing.step,
          originalStep: action.step,
          undoStack: existing.undoStack,
          redoStack: existing.redoStack,
        }
        return {
          ...state,
          steps: {
            ...state.steps,
            [action.step.id]: updated,
          },
        }
      } else {
        // New step - create with defaults
        const newStep: StepEditorState = {
          step: action.step,
          originalStep: action.step,
          undoStack: [],
          redoStack: [],
        }
        return {
          ...state,
          steps: {
            ...state.steps,
            [action.step.id]: newStep,
          },
        }
      }
    }

    case "SET_CURRENT_STEP": {
      return {
        ...state,
        currentStepId: action.stepId,
      }
    }

    case "UPDATE_STEP": {
      const stepState = state.steps[action.stepId]
      if (!stepState) return state

      const newStep = action.updater(stepState.step)

      // Check if state actually changed
      if (JSON.stringify(stepState.step) === JSON.stringify(newStep)) {
        return state
      }

      // Create new undo entry
      const newUndoStack = [
        ...stepState.undoStack,
        {
          type: action.actionType,
          previousState: stepState.step,
          timestamp: Date.now(),
        },
      ].slice(-MAX_UNDO_STACK)

      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: {
            ...stepState,
            step: newStep,
            undoStack: newUndoStack,
            redoStack: [], // Clear redo stack when new action is made
          },
        },
      }
    }

    case "UNDO": {
      const stepState = state.steps[action.stepId]
      if (!stepState || stepState.undoStack.length === 0) return state

      const lastAction = stepState.undoStack[stepState.undoStack.length - 1]

      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: {
            ...stepState,
            step: lastAction.previousState,
            undoStack: stepState.undoStack.slice(0, -1),
            redoStack: [
              ...stepState.redoStack,
              {
                type: lastAction.type,
                previousState: stepState.step,
                timestamp: Date.now(),
              },
            ].slice(-MAX_UNDO_STACK),
          },
        },
      }
    }

    case "REDO": {
      const stepState = state.steps[action.stepId]
      if (!stepState || stepState.redoStack.length === 0) return state

      const lastRedo = stepState.redoStack[stepState.redoStack.length - 1]

      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: {
            ...stepState,
            step: lastRedo.previousState,
            redoStack: stepState.redoStack.slice(0, -1),
            undoStack: [
              ...stepState.undoStack,
              {
                type: lastRedo.type,
                previousState: stepState.step,
                timestamp: Date.now(),
              },
            ].slice(-MAX_UNDO_STACK),
          },
        },
      }
    }

    case "SAVE_START": {
      return {
        ...state,
        isSaving: true,
      }
    }

    case "SAVE_SUCCESS": {
      const newSteps = { ...state.steps }

      // Update originalStep for all saved steps, but KEEP undo stacks
      for (const savedStep of action.savedSteps) {
        if (newSteps[savedStep.id]) {
          newSteps[savedStep.id] = {
            ...newSteps[savedStep.id],
            step: savedStep,
            originalStep: savedStep,
            // Undo stack is preserved!
            // Redo stack is also preserved!
          }
        }
      }

      return {
        ...state,
        steps: newSteps,
        isSaving: false,
      }
    }

    case "SAVE_ERROR": {
      return {
        ...state,
        isSaving: false,
      }
    }

    case "REMOVE_STEP": {
      const newSteps = { ...state.steps }
      delete newSteps[action.stepId]

      const newCurrent = state.currentStepId === action.stepId ? "" : state.currentStepId

      return {
        ...state,
        steps: newSteps,
        currentStepId: newCurrent,
      }
    }

    case "SYNC_STEP_ORDERS": {
      const newSteps = { ...state.steps }

      // Update orders for all steps based on DB response
      for (const { id, order } of action.updatedOrders) {
        if (newSteps[id]) {
          newSteps[id] = {
            ...newSteps[id],
            step: {
              ...newSteps[id].step,
              order,
            },
            originalStep: {
              ...newSteps[id].originalStep,
              order,
            },
          }
        }
      }

      return {
        ...state,
        steps: newSteps,
      }
    }

    default:
      return state
  }
}

export function EditorProvider({ children, initialStep }: EditorProviderProps) {
  // Initialize with empty state
  const [state, dispatch] = useReducer(editorReducer, {
    steps: {},
    currentStepId: initialStep?.id || "",
    isSaving: false,
  })

  // Load state from localStorage after hydration (client-side only)
  // Initialize first step if provided
  useEffect(() => {
    if (initialStep) {
      dispatch({ type: "INITIALIZE_STEP", step: initialStep })
    }
  }, [initialStep])

  // Get current step state
  const currentStepState = state.steps[state.currentStepId]
  const step = currentStepState?.step || initialStep || EMPTY_STEP

  // Computed: global isDirty (ANY step has changes)
  const isDirty = Object.values(state.steps).some(
    stepState => JSON.stringify(stepState.step) !== JSON.stringify(stepState.originalStep)
  )

  // Computed: global canUndo (current step)
  const canUndo = currentStepState?.undoStack.length > 0 || false
  const undoStack = currentStepState?.undoStack || []

  // Computed: global canRedo (current step)
  const canRedo = currentStepState?.redoStack.length > 0 || false
  const redoStack = currentStepState?.redoStack || []

  // Persist all steps to localStorage whenever they change
  useEffect(() => {
    Object.entries(state.steps).forEach(([stepId, stepState]) => {
      saveStepStateToStorage(stepId, stepState.step)
      saveUndoStackToStorage(stepId, stepState.undoStack)
      saveRedoStackToStorage(stepId, stepState.redoStack)
    })
  }, [state.steps])

  // Set current step (navigation between steps)
  const setStep = useCallback((newStep: Step) => {
    dispatch({ type: "SET_CURRENT_STEP", stepId: newStep.id })
    dispatch({ type: "ADD_OR_UPDATE_STEP", step: newStep })
  }, [])

  // Update current step with undo tracking
  const updateStep = useCallback((updater: (prev: Step) => Step, actionType = "update") => {
    dispatch({ type: "UPDATE_STEP", stepId: state.currentStepId, updater, actionType })
  }, [state.currentStepId])

  // Undo in current step
  const undo = useCallback(() => {
    dispatch({ type: "UNDO", stepId: state.currentStepId })
  }, [state.currentStepId])

  // Redo in current step
  const redo = useCallback(() => {
    dispatch({ type: "REDO", stepId: state.currentStepId })
  }, [state.currentStepId])

  // Add or update a step
  const addOrUpdateStep = useCallback((step: Step) => {
    dispatch({ type: "ADD_OR_UPDATE_STEP", step })
  }, [])

  // Get step state for a specific step
  const getStepState = useCallback((stepId: string) => {
    return state.steps[stepId]
  }, [state.steps])

  // Check if a specific step is dirty
  const isStepDirty = useCallback((stepId: string) => {
    const stepState = state.steps[stepId]
    if (!stepState) return false
    return JSON.stringify(stepState.step) !== JSON.stringify(stepState.originalStep)
  }, [state.steps])

  // Remove a step (cleanup in-memory + localStorage)
  const removeStep = useCallback((stepId: string) => {
    dispatch({ type: "REMOVE_STEP", stepId })
    removeStepStateFromStorage(stepId)
    removeUndoStackFromStorage(stepId)
    removeRedoStackFromStorage(stepId)
  }, [])

  // Sync step orders from DB (called after deletion)
  const syncStepOrders = useCallback((updatedOrders: Array<{ id: string; order: number }>) => {
    dispatch({ type: "SYNC_STEP_ORDERS", updatedOrders })
  }, [])

  // Global save: save ALL dirty steps in parallel
  const save = useCallback(async (): Promise<boolean> => {
    if (!isDirty) return true

    dispatch({ type: "SAVE_START" })

    try {
      // Get all dirty steps
      const dirtySteps = Object.values(state.steps).filter(
        stepState => JSON.stringify(stepState.step) !== JSON.stringify(stepState.originalStep)
      )

      if (dirtySteps.length === 0) {
        dispatch({ type: "SAVE_ERROR" })
        return false
      }

      // Save all dirty steps in parallel
      const results = await Promise.all(
        dirtySteps.map(stepState =>
          fetch(`/api/step/${stepState.step.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stepState.step),
          })
            .then(res => {
              if (!res.ok) throw new Error(`Failed to save step ${stepState.step.id}`)
              return res.json()
            })
            .then(data => data.step as Step)
        )
      )

      // All saves successful
      dispatch({ type: "SAVE_SUCCESS", savedSteps: results })

      // Clear undo stacks in localStorage for all saved steps
      dirtySteps.forEach(stepState => {
        saveUndoStackToStorage(stepState.step.id, [])
      })

      return true
    } catch (error) {
      console.error("Error saving steps:", error)
      dispatch({ type: "SAVE_ERROR" })
      return false
    }
  }, [state.steps, isDirty])

  return (
    <EditorContext.Provider
      value={{
        step,
        setStep,
        updateStep,
        isDirty,
        isStepDirty,
        canUndo,
        undo,
        undoStack,
        canRedo,
        redo,
        redoStack,
        save,
        isSaving: state.isSaving,
        addOrUpdateStep,
        getStepState,
        removeStep,
        syncStepOrders,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}