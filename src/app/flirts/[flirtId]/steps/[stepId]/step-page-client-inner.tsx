"use client";

import { useRouter } from "next/navigation";
import type { Step } from "@/types/step";
import { useEditor } from "@/contexts/editor-context";
import { useState } from "react";

import StepEditorLayout from "@/components/editor/step-editor-layout";
import StepSidebar from "@/components/editor/step-sidebar";
import StepContent from "@/components/editor/step-content";
import StepNavigationFooter from "@/components/editor/step-navigation-footer";
import { InspectorsOverlay } from "@/components/editor/canvas/inspector/inspectors-overlay";
import { Flirt } from "@/types/flirt";
import { useEffect } from "react";

interface CanvasItemIdentifier {
  id: string
  type: "media" | "element" | "logic"
  subtype?: string
}

interface StepPageClientInnerProps {
  initialFlirtId: string;
  initialStep: Step;
  totalSteps: number;
  flirt?: Flirt;
}

export default function StepPageClientInner({
  initialFlirtId,
  totalSteps,
  flirt,
}: StepPageClientInnerProps) {
  const router = useRouter();
  const {
    step,
    setStep,
    addOrUpdateStep,
    removeStep,
    createStepInStructure,
    structureStepOrder,
    flirtStructure,
    initFlirtStructureFromDb,
    deleteStepInStructure,
    getStepState,
  } = useEditor();

  // NOTE:
  // We keep this as a fallback for DB-only sessions, but the UI should
  // prefer the light structure layer (Layer 1) whenever possible.
  const [totalStepsState, setTotalStepsState] = useState(totalSteps);
  const [selectedItem, setSelectedItem] = useState<CanvasItemIdentifier | null>(null);

  /**
   * ============================================================
   * LAYER 1 DRIVEN NAVIGATION (NEW)
   * ------------------------------------------------------------
   * The UI should use the structure layer as the source of truth
   * for:
   * - the order of steps
   * - how many steps exist (DB + temp)
   *
   * This prevents impossible states like "3/2".
   * ============================================================
   */
  const structureHasOrder = structureStepOrder.length > 0;
  const stepInOrder = structureHasOrder && structureStepOrder.includes(step.id);

  const currentIndex = stepInOrder
    ? structureStepOrder.indexOf(step.id) + 1
    : structureHasOrder
      ? structureStepOrder.length   // show last position (navigation target)
      : step.order || 1;
  const derivedTotalSteps = structureHasOrder ? structureStepOrder.length : totalStepsState;
  const isLastStep = currentIndex >= derivedTotalSteps;

  // On first render (and whenever the DB flirt payload changes), seed Layer 1
  // with the DB steps order. This is critical because the EditorProvider is
  // mounted at app root and does not receive an initialStep prop there.
  useEffect(() => {
    if (!flirt?.steps || flirt.steps.length === 0) return

    initFlirtStructureFromDb({
      flirtId: initialFlirtId,
      dbSteps: flirt.steps.map(s => ({ id: s.id, order: s.order })),
    })
  }, [flirt?.steps, initialFlirtId, initFlirtStructureFromDb])

  if (process.env.NODE_ENV !== "production") {
    // Helpful debugging for verifying the structure layer
    console.log("[Editor][Structure] stepId:", step.id);
    console.log("[Editor][Structure] order:", structureStepOrder);
    console.log("[Editor][Structure] newStepIds:", flirtStructure?.newStepIds ?? []);
    console.log("[Editor][Structure] deletedStepIds:", flirtStructure?.deletedStepIds ?? []);
    console.log("[Editor][UI] currentIndex/total:", currentIndex, "/", derivedTotalSteps);
  }

  const fetchNextStep = () => {
    // If we are currently on the last known step, create a TEMPORARY step
    if (isLastStep) {
      const tempStepId =
        (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
        `temp-${Math.random().toString(36).slice(2)}`;

      const nextOrder = derivedTotalSteps + 1;

      const newStep: Step = {
        id: tempStepId,
        flirtId: initialFlirtId,
        order: nextOrder,
        content: "",
        media: [],
        elements: [],
        logics: [],
      };

      createStepInStructure({
        stepId: tempStepId,
        isNew: true,
        insertAfterId: step.id,
      });

      addOrUpdateStep(newStep);
      setStep(newStep);
      setTotalStepsState(prev => prev + 1);
      router.push(`/flirts/${initialFlirtId}/steps/${tempStepId}`);

      return { step: newStep, totalSteps: totalStepsState + 1 };
    }

    // Structure-driven navigation
    if (structureHasOrder && structureStepOrder.includes(step.id)) {
      const currentIdx = structureStepOrder.indexOf(step.id);
      const nextId = structureStepOrder[currentIdx + 1];

      if (nextId) {
        router.push(`/flirts/${initialFlirtId}/steps/${nextId}`);
        return { stepId: nextId };
      }
    }

    // Graceful fallback: if step not in structure or no next step exists
    // This can happen after undo operations or during transitions
    console.warn("Cannot navigate to next step: step not in structure or no next step available");
    return null;
  };

  const fetchPreviousStep = () => {
    // Structure-driven navigation
    if (structureHasOrder && structureStepOrder.includes(step.id)) {
      const currentIdx = structureStepOrder.indexOf(step.id);
      const prevId = structureStepOrder[currentIdx - 1];

      if (prevId) {
        router.push(`/flirts/${initialFlirtId}/steps/${prevId}`);
        return { stepId: prevId };
      }
    }

    // Graceful fallback: if step not in structure or no previous step exists
    // This can happen after undo operations or during transitions
    console.warn("Cannot navigate to previous step: step not in structure or no previous step available");
    return null;
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this step?")) return;

    try {
      const order = structureStepOrder.length > 0 ? structureStepOrder : [step.id];
      const currentIndexInOrder = order.indexOf(step.id);

      // Determine navigation target before any mutations
      const newOrderAfterDelete = order.filter(id => id !== step.id);
      const targetIndex = Math.min(currentIndexInOrder, newOrderAfterDelete.length - 1);
      const targetStepId = targetIndex >= 0 ? newOrderAfterDelete[targetIndex] : null;

      const isTempStep = !!flirtStructure?.newStepIds.includes(step.id);
      const stepIdToDelete = step.id;

      // Navigation strategy: sync state BEFORE structure mutation to prevent UI flicker
      if (targetStepId) {
        // Get target step from editor context
        const targetStepState = getStepState(targetStepId);

        if (targetStepState) {
          // Synchronously update current step in context to match navigation target
          // This ensures currentIndex calculation uses the new step.id immediately
          setStep(targetStepState.step);
        }

        // Start navigation (async, but state is already synced)
        router.replace(`/flirts/${initialFlirtId}/steps/${targetStepId}`);

        // Now safe to mutate structure - currentIndex will be correct
        deleteStepInStructure(stepIdToDelete);

        // Cleanup step state (temp or DB-backed)
        if (isTempStep) {
          removeStep(stepIdToDelete);
        } else {
          // DB-backed: keep in memory until save, just marked as deleted in structure
          removeStep(stepIdToDelete);
        }

        setTotalStepsState((prev) => Math.max(prev - 1, 1));
        return;
      }

      // Edge case: no steps left after deletion → create fresh temp step
      const tempStepId =
        (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
        `temp-${Math.random().toString(36).slice(2)}`;

      const newStep: Step = {
        id: tempStepId,
        flirtId: initialFlirtId,
        order: 1,
        content: "",
        media: [],
        elements: [],
        logics: [],
      };

      // Delete old step from structure
      deleteStepInStructure(stepIdToDelete);
      removeStep(stepIdToDelete);

      // Create and navigate to new temp step
      createStepInStructure({
        stepId: tempStepId,
        isNew: true,
        insertAfterId: null,
      });

      addOrUpdateStep(newStep);
      setStep(newStep);
      setTotalStepsState(1);
      router.replace(`/flirts/${initialFlirtId}/steps/${tempStepId}`);

    } catch (err) {
      console.error("Failed to delete step", err);
      alert("Error while deleting step");
    }
  };

  return (
    <StepEditorLayout
      sidebar={
        <StepSidebar
          stepId={step.id}
        />
      }
      content={
        <StepContent
          totalSteps={derivedTotalSteps}
          stepNumber={currentIndex}
          flirt={flirt}
          selectedItem={selectedItem}
          onSelectedItemChange={setSelectedItem}
        />
      }
      overlay={
        <InspectorsOverlay
          selectedItem={selectedItem}
          step={step}
          flirt={flirt}
        />
      }
      footer={
        <StepNavigationFooter
          stepOrder={currentIndex}
          isLast={isLastStep}
          onNext={fetchNextStep}
          onPrevious={fetchPreviousStep}
          onDelete={handleDelete}
          onHome={() => router.push("/")}
          onPreview={() =>
            router.push(
              `/flirts/${initialFlirtId}/steps/${step.id}/preview`
            )
          }
        />
      }
    />
  );
}
