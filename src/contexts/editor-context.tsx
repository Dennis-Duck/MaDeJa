"use client"

import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from "react"
import type { Step } from "@/types/step"

/**
 * ============================================================
 * LAYER 2 – STEP CONTENT STATE (EXISTING)
 * ------------------------------------------------------------
 * - Per-step editor state (elements, media, logics, etc.)
 * - Per-step undo/redo (already implemented and working)
 * - Persisted in localStorage per stepId
 *
 * This layer remains unchanged in behaviour – we only
 * refactor the file to clearly separate it from the new
 * "Layer 1 – Flirt structure state" further below.
 * ============================================================
 */

// Action types for per-step undo tracking
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
  /**
   * ============================================================
   * LAYER 2 – STEP CONTENT API (EXISTING)
   * ============================================================
   */

  // Get current step (content layer)
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

  /**
   * ============================================================
   * LAYER 1 – FLIRT STRUCTURE API (NEW)
   * ------------------------------------------------------------
   * Light-weight description of the flirt:
   * - Which steps exist
   * - In which order
   * - Which are newly created / deleted (not yet synced)
   *
   * This is deliberately small so we can:
   * - Persist it cheaply in localStorage (per flirtId)
   * - Add a separate "undo structure" without touching
   *   the heavy step content / undo machinery.
   * ============================================================
   */

  // Current flirt identifier for this editor session (if available)
  flirtId: string | null

  // Read-only structure state (lightweight, safe to inspect in UI)
  flirtStructure: FlirtStructureState | null

  // Convenience getters for structure parts
  structureStepOrder: string[]
  structureDeletedStepIds: string[]
  structureNewStepIds: string[]

  // Mutations on flirt structure (do NOT hit the database)
  createStepInStructure: (options: { stepId: string; isNew?: boolean; insertAfterId?: string | null }) => void
  deleteStepInStructure: (stepId: string) => void
  reorderStepsInStructure: (stepOrder: string[]) => void

  // Undo/redo for flirt structure (separate from step content undo/redo)
  canUndoStructure: boolean
  canRedoStructure: boolean
  undoStructure: () => void
  redoStructure: () => void

  // Initialize / reconcile flirt structure from DB steps (safe to call repeatedly)
  initFlirtStructureFromDb: (payload: {
    flirtId: string
    dbSteps: Array<{ id: string; order: number }>
  }) => void
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

/**
 * ============================================================
 * LAYER 1 – FLIRT STRUCTURE STATE (NEW)
 * ============================================================
 */

// Single snapshot of the light flirt structure (no undo history inside)
type FlirtStructureSnapshot = {
  // All known step ids for this flirt (DB + temporary)
  stepIds: string[]
  // Ordered list of step ids (this is what the UI should use)
  stepOrder: string[]
  // Steps marked as deleted but not yet persisted to the DB
  deletedStepIds: string[]
  // Steps created in this session and not yet persisted
  newStepIds: string[]
}

// Full flirt structure state including its own undo/redo history
export type FlirtStructureState = FlirtStructureSnapshot & {
  undoStack: FlirtStructureSnapshot[]
  redoStack: FlirtStructureSnapshot[]
}

const FLIRT_STRUCTURE_STORAGE_KEY = "editor-flirt-structure"
const MAX_STRUCTURE_UNDO_STACK = 100

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

/**
 * ============================================================
 * LAYER 1 – FLIRT STRUCTURE LOCALSTORAGE HELPERS (NEW)
 * ============================================================
 */

// Load flirt structure for a given flirtId from localStorage.
// If nothing exists yet, fall back to the provided initial snapshot.
function loadFlirtStructureFromStorage(
  flirtId: string,
  initialSnapshot: FlirtStructureSnapshot
): FlirtStructureState {
  try {
    if (typeof window === "undefined") {
      return {
        ...initialSnapshot,
        undoStack: [],
        redoStack: [],
      }
    }

    const stored = localStorage.getItem(FLIRT_STRUCTURE_STORAGE_KEY)
    if (!stored) {
      return {
        ...initialSnapshot,
        undoStack: [],
        redoStack: [],
      }
    }

    const allStructures = JSON.parse(stored) as Record<string, FlirtStructureState>
    const existing = allStructures[flirtId]

    if (!existing) {
      return {
        ...initialSnapshot,
        undoStack: [],
        redoStack: [],
      }
    }

    return existing
  } catch {
    // If anything goes wrong, fall back to a clean initial state
    return {
      ...initialSnapshot,
      undoStack: [],
      redoStack: [],
    }
  }
}

// Save flirt structure for a given flirtId to localStorage
function saveFlirtStructureToStorage(flirtId: string, structure: FlirtStructureState | null) {
  try {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(FLIRT_STRUCTURE_STORAGE_KEY) || "{}"
    const allStructures = JSON.parse(stored) as Record<string, FlirtStructureState>

    if (structure) {
      allStructures[flirtId] = structure
    } else {
      delete allStructures[flirtId]
    }

    localStorage.setItem(FLIRT_STRUCTURE_STORAGE_KEY, JSON.stringify(allStructures))
  } catch {
    // Silently fail if localStorage is not available
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

  /**
   * ============================================================
   * LAYER 1 – FLIRT STRUCTURE STATE (NEW)
   * ------------------------------------------------------------
   * This sits alongside the heavy step content state.
   * It is intentionally light and safe to persist as-is.
   * ============================================================
   */
  // Current flirt id (if known)
  flirtId: string | null
  // Light-weight description of steps for this flirt
  flirtStructure: FlirtStructureState | null
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
  // Flirt structure – init + structural mutations
  | { type: "INIT_FLIRT_STRUCTURE"; flirtId: string; structure: FlirtStructureState }
  | {
      type: "STRUCTURE_CREATE_STEP"
      payload: { stepId: string; isNew?: boolean; insertAfterId?: string | null }
    }
  | { type: "STRUCTURE_DELETE_STEP"; payload: { stepId: string } }
  | { type: "STRUCTURE_REORDER_STEPS"; payload: { stepOrder: string[] } }
  | { type: "STRUCTURE_UNDO" }
  | { type: "STRUCTURE_REDO" }
  | {
      type: "STRUCTURE_INIT_FROM_DB"
      payload: { flirtId: string; dbSteps: Array<{ id: string; order: number }> }
    }
  | { type: "STRUCTURE_COMMIT" }

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
        if (savedStep && newSteps[savedStep.id]) {
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

    /**
     * ============================================================
     * LAYER 1 – FLIRT STRUCTURE REDUCER CASES (NEW)
     * ============================================================
     */

    case "INIT_FLIRT_STRUCTURE": {
      return {
        ...state,
        flirtId: action.flirtId,
        flirtStructure: action.structure,
      }
    }

    case "STRUCTURE_CREATE_STEP": {
      if (!state.flirtStructure) return state

      const { stepId, isNew = true, insertAfterId = null } = action.payload
      if (state.flirtStructure.stepIds.includes(stepId)) {
        // Already known – do not duplicate
        return state
      }

      const snapshot: FlirtStructureSnapshot = {
        stepIds: state.flirtStructure.stepIds,
        stepOrder: state.flirtStructure.stepOrder,
        deletedStepIds: state.flirtStructure.deletedStepIds,
        newStepIds: state.flirtStructure.newStepIds,
      }

      const nextUndoStack = [...state.flirtStructure.undoStack, snapshot].slice(-MAX_STRUCTURE_UNDO_STACK)

      const stepIds = [...state.flirtStructure.stepIds, stepId]

      let stepOrder: string[]
      if (insertAfterId) {
        const index = state.flirtStructure.stepOrder.indexOf(insertAfterId)
        if (index === -1) {
          stepOrder = [...state.flirtStructure.stepOrder, stepId]
        } else {
          stepOrder = [
            ...state.flirtStructure.stepOrder.slice(0, index + 1),
            stepId,
            ...state.flirtStructure.stepOrder.slice(index + 1),
          ]
        }
      } else {
        // Default: append at the end
        stepOrder = [...state.flirtStructure.stepOrder, stepId]
      }

      const deletedStepIds = state.flirtStructure.deletedStepIds.filter(id => id !== stepId)

      const newStepIds = isNew
        ? [...new Set([...state.flirtStructure.newStepIds, stepId])]
        : state.flirtStructure.newStepIds.filter(id => id !== stepId)

      return {
        ...state,
        flirtStructure: {
          stepIds,
          stepOrder,
          deletedStepIds,
          newStepIds,
          undoStack: nextUndoStack,
          redoStack: [],
        },
      }
    }

    case "STRUCTURE_DELETE_STEP": {
      if (!state.flirtStructure) return state

      const { stepId } = action.payload
      if (!state.flirtStructure.stepIds.includes(stepId)) return state

      const snapshot: FlirtStructureSnapshot = {
        stepIds: state.flirtStructure.stepIds,
        stepOrder: state.flirtStructure.stepOrder,
        deletedStepIds: state.flirtStructure.deletedStepIds,
        newStepIds: state.flirtStructure.newStepIds,
      }

      const nextUndoStack = [...state.flirtStructure.undoStack, snapshot].slice(-MAX_STRUCTURE_UNDO_STACK)

      const stepIds = state.flirtStructure.stepIds.filter(id => id !== stepId)
      const stepOrder = state.flirtStructure.stepOrder.filter(id => id !== stepId)

      const deletedStepIds = [...new Set([...state.flirtStructure.deletedStepIds, stepId])]
      const newStepIds = state.flirtStructure.newStepIds.filter(id => id !== stepId)

      return {
        ...state,
        flirtStructure: {
          stepIds,
          stepOrder,
          deletedStepIds,
          newStepIds,
          undoStack: nextUndoStack,
          redoStack: [],
        },
      }
    }

    case "STRUCTURE_REORDER_STEPS": {
      if (!state.flirtStructure) return state

      const { stepOrder } = action.payload

      // If the order is identical, skip
      if (JSON.stringify(stepOrder) === JSON.stringify(state.flirtStructure.stepOrder)) {
        return state
      }

      const snapshot: FlirtStructureSnapshot = {
        stepIds: state.flirtStructure.stepIds,
        stepOrder: state.flirtStructure.stepOrder,
        deletedStepIds: state.flirtStructure.deletedStepIds,
        newStepIds: state.flirtStructure.newStepIds,
      }

      const nextUndoStack = [...state.flirtStructure.undoStack, snapshot].slice(-MAX_STRUCTURE_UNDO_STACK)

      return {
        ...state,
        flirtStructure: {
          ...state.flirtStructure,
          stepOrder,
          undoStack: nextUndoStack,
          redoStack: [],
        },
      }
    }

    case "STRUCTURE_UNDO": {
      if (!state.flirtStructure || state.flirtStructure.undoStack.length === 0) return state

      const previous = state.flirtStructure.undoStack[state.flirtStructure.undoStack.length - 1]
      const remainingUndo = state.flirtStructure.undoStack.slice(0, -1)

      const currentSnapshot: FlirtStructureSnapshot = {
        stepIds: state.flirtStructure.stepIds,
        stepOrder: state.flirtStructure.stepOrder,
        deletedStepIds: state.flirtStructure.deletedStepIds,
        newStepIds: state.flirtStructure.newStepIds,
      }

      const nextRedoStack = [...state.flirtStructure.redoStack, currentSnapshot].slice(-MAX_STRUCTURE_UNDO_STACK)

      return {
        ...state,
        flirtStructure: {
          stepIds: previous.stepIds,
          stepOrder: previous.stepOrder,
          deletedStepIds: previous.deletedStepIds,
          newStepIds: previous.newStepIds,
          undoStack: remainingUndo,
          redoStack: nextRedoStack,
        },
      }
    }

    case "STRUCTURE_REDO": {
      if (!state.flirtStructure || state.flirtStructure.redoStack.length === 0) return state

      const next = state.flirtStructure.redoStack[state.flirtStructure.redoStack.length - 1]
      const remainingRedo = state.flirtStructure.redoStack.slice(0, -1)

      const currentSnapshot: FlirtStructureSnapshot = {
        stepIds: state.flirtStructure.stepIds,
        stepOrder: state.flirtStructure.stepOrder,
        deletedStepIds: state.flirtStructure.deletedStepIds,
        newStepIds: state.flirtStructure.newStepIds,
      }

      const nextUndoStack = [...state.flirtStructure.undoStack, currentSnapshot].slice(-MAX_STRUCTURE_UNDO_STACK)

      return {
        ...state,
        flirtStructure: {
          stepIds: next.stepIds,
          stepOrder: next.stepOrder,
          deletedStepIds: next.deletedStepIds,
          newStepIds: next.newStepIds,
          undoStack: nextUndoStack,
          redoStack: remainingRedo,
        },
      }
    }

    case "STRUCTURE_INIT_FROM_DB": {
      const { flirtId, dbSteps } = action.payload

      // Normalize the DB order
      const dbOrderedIds = [...dbSteps]
        .sort((a, b) => a.order - b.order)
        .map(s => s.id)

      const baseSnapshot: FlirtStructureSnapshot = {
        stepIds: dbOrderedIds,
        stepOrder: dbOrderedIds,
        deletedStepIds: [],
        newStepIds: [],
      }

      // If we have no structure yet, load from storage (or fall back to DB)
      if (!state.flirtStructure || state.flirtId !== flirtId) {
        const loaded = loadFlirtStructureFromStorage(flirtId, baseSnapshot)
        return {
          ...state,
          flirtId,
          flirtStructure: loaded,
        }
      }

      // We already have a structure for this flirt.
      // The current in-memory structure is authoritative (it may have been
      // modified by undo/redo or other user actions). We do NOT blindly
      // merge DB steps back in because that would undo any structural
      // undo operations the user just performed.
      //
      // Only if the structure's stepOrder is completely empty (fresh init)
      // do we fall back to the DB order.
      const existing = state.flirtStructure

      if (existing.stepOrder.length === 0) {
        // Empty structure – seed from DB
        return {
          ...state,
          flirtId,
          flirtStructure: {
            ...existing,
            stepIds: dbOrderedIds,
            stepOrder: dbOrderedIds,
          },
        }
      }

      // Otherwise keep the current structure untouched – it is the source
      // of truth until the next save.
      return state
    }

    case "STRUCTURE_COMMIT": {
      if (!state.flirtStructure) return state

      // Remove deleted steps from the in-memory steps map – they no longer
      // exist in the DB after the structure save.
      const cleanedSteps = { ...state.steps }
      for (const deletedId of state.flirtStructure.deletedStepIds) {
        delete cleanedSteps[deletedId]
      }

      return {
        ...state,
        steps: cleanedSteps,
        flirtStructure: {
          ...state.flirtStructure,
          deletedStepIds: [],
          newStepIds: [],
          // Commit is a logical boundary: the DB state has changed so
          // old undo snapshots (which reference pre-save newStepIds /
          // deletedStepIds / stepOrder) are no longer valid.
          // Clearing the stacks prevents impossible reconciliation bugs
          // where undoing after a save would restore a stale snapshot
          // that conflicts with the now-authoritative DB state.
          undoStack: [],
          redoStack: [],
        },
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
    flirtId: initialStep?.flirtId || null,
    flirtStructure: null,
  })

  // Load state from localStorage after hydration (client-side only)
  // Initialize first step if provided
  useEffect(() => {
    if (!initialStep) return

    // Layer 2 – initialise step content + its undo/redo state
    dispatch({ type: "INITIALIZE_STEP", step: initialStep })

    // Layer 1 – initialise flirt structure (READ-ONLY from DB + temp)
    // For now we only know a single initial step from the server.
    // Later we can extend this to accept a full structure payload.
    const baseSnapshot: FlirtStructureSnapshot = {
      stepIds: [initialStep.id],
      stepOrder: [initialStep.id],
      deletedStepIds: [],
      newStepIds: [],
    }

    const structure = loadFlirtStructureFromStorage(initialStep.flirtId, baseSnapshot)

    dispatch({
      type: "INIT_FLIRT_STRUCTURE",
      flirtId: initialStep.flirtId,
      structure,
    })
  }, [initialStep])

  // Get current step state
  const currentStepState = state.steps[state.currentStepId]
  const step = currentStepState?.step || initialStep || EMPTY_STEP

  // Computed: global isDirty (ANY step has changes OR structure has unsaved changes)
  const hasStructureChanges =
    !!state.flirtStructure &&
    (state.flirtStructure.newStepIds.length > 0 || state.flirtStructure.deletedStepIds.length > 0)

  const isDirty =
    hasStructureChanges ||
    Object.values(state.steps).some(
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

  // Persist flirt structure to localStorage whenever it changes
  useEffect(() => {
    if (!state.flirtId) return
    saveFlirtStructureToStorage(state.flirtId, state.flirtStructure)
  }, [state.flirtId, state.flirtStructure])

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

  /**
   * ============================================================
   * LAYER 1 – FLIRT STRUCTURE DISPATCH HELPERS (NEW)
   * ------------------------------------------------------------
   * These functions only manipulate the light structure state:
   * - No network calls
   * - No database writes
   * - Safe to call freely from the UI
   *
   * Actual persistence of step order / creation / deletion to
   * the database should happen later via a dedicated "Save"
   * routine that reads from this structure layer.
   * ============================================================
   */

  const createStepInStructure = useCallback(
    (options: { stepId: string; isNew?: boolean; insertAfterId?: string | null }) => {
      dispatch({ type: "STRUCTURE_CREATE_STEP", payload: options })
    },
    []
  )

  const deleteStepInStructure = useCallback((stepId: string) => {
    dispatch({ type: "STRUCTURE_DELETE_STEP", payload: { stepId } })
  }, [])

  const reorderStepsInStructure = useCallback((stepOrder: string[]) => {
    dispatch({ type: "STRUCTURE_REORDER_STEPS", payload: { stepOrder } })
  }, [])

  const undoStructure = useCallback(() => {
    dispatch({ type: "STRUCTURE_UNDO" })
  }, [])

  const redoStructure = useCallback(() => {
    dispatch({ type: "STRUCTURE_REDO" })
  }, [])

  const initFlirtStructureFromDb = useCallback(
    (payload: { flirtId: string; dbSteps: Array<{ id: string; order: number }> }) => {
      dispatch({ type: "STRUCTURE_INIT_FROM_DB", payload })
    },
    []
  )

  const flirtStructure = state.flirtStructure

  const structureStepOrder = flirtStructure?.stepOrder ?? []
  const structureDeletedStepIds = flirtStructure?.deletedStepIds ?? []
  const structureNewStepIds = flirtStructure?.newStepIds ?? []

  const canUndoStructure = !!flirtStructure && flirtStructure.undoStack.length > 0
  const canRedoStructure = !!flirtStructure && flirtStructure.redoStack.length > 0

  // Global save: save ALL dirty steps in parallel
  const save = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "SAVE_START" })

    try {
      // 1) Persist flirt structure (step order + temp / deleted steps) if we have it
      if (state.flirtId && flirtStructure) {
        const structurePayload = {
          stepOrder: flirtStructure.stepOrder,
          deletedStepIds: flirtStructure.deletedStepIds,
          newStepIds: flirtStructure.newStepIds,
        }

        const res = await fetch(`/api/flirts/${state.flirtId}/structure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(structurePayload),
        })

        if (!res.ok) {
          throw new Error("Failed to save flirt structure")
        }

        const data = await res.json()
        const updatedOrders = (data?.updatedSteps ?? []) as Array<{ id: string; order: number }>

        // Align local step.order / originalStep.order with DB, and clear new/deleted flags
        if (updatedOrders.length > 0) {
          dispatch({ type: "SYNC_STEP_ORDERS", updatedOrders })
        }

        dispatch({ type: "STRUCTURE_COMMIT" })
      }

      // 2) Persist all dirty step contents (elements, media, logics, ...)
      if (!isDirty) {
        dispatch({ type: "SAVE_SUCCESS", savedSteps: [] })
        return true
      }

      // Get all dirty steps, excluding any steps that were just deleted from
      // the structure (they no longer exist in the DB after the structure save).
      const deletedIds = new Set(flirtStructure?.deletedStepIds ?? [])
      const dirtySteps = Object.values(state.steps).filter(
        stepState =>
          !deletedIds.has(stepState.step.id) &&
          JSON.stringify(stepState.step) !== JSON.stringify(stepState.originalStep)
      )

      if (dirtySteps.length === 0) {
        // No step content changes – structure was already saved above
        dispatch({ type: "SAVE_SUCCESS", savedSteps: [] })
        return true
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
  }, [state.steps, state.flirtId, flirtStructure, isDirty])

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
        // Layer 1 – flirt structure
        flirtId: state.flirtId,
        flirtStructure,
        structureStepOrder,
        structureDeletedStepIds,
        structureNewStepIds,
        createStepInStructure,
        deleteStepInStructure,
        reorderStepsInStructure,
        canUndoStructure,
        canRedoStructure,
        undoStructure,
        redoStructure,
        initFlirtStructureFromDb,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}
