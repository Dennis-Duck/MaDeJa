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
  } = useEditor();

  /**
   * Watch the structure layer for undo/redo changes.
   * If the current step disappears from the stepOrder (e.g. because the user
   * undid a "create step"), navigate to the last step in the order.
   */
  useEffect(() => {
    if (structureStepOrder.length === 0) return;
    if (structureStepOrder.includes(step.id)) return;

    // Current step is no longer in the structure order – navigate away
    const lastStepId = structureStepOrder[structureStepOrder.length - 1];
    if (lastStepId) {
      router.replace(`/flirts/${initialFlirtId}/steps/${lastStepId}`);
    }
  }, [structureStepOrder, step.id, initialFlirtId, router]);
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
  const currentIndex =
    structureHasOrder && structureStepOrder.includes(step.id)
      ? structureStepOrder.indexOf(step.id) + 1
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

  const fetchNextStep = async () => {
    // If we are currently on the last known step, create a TEMPORARY step
    // in the light flirt-structure layer (Layer 1) instead of hitting the DB.
    if (isLastStep) {
      // Generate a client-only temporary step id
      const tempStepId =
        (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
        `temp-${Math.random().toString(36).slice(2)}`;

      const nextOrder = derivedTotalSteps + 1;

      // Create a minimal new Step object for the editor (Layer 2)
      const newStep: Step = {
        id: tempStepId,
        flirtId: initialFlirtId,
        order: nextOrder,
        content: "",
        media: [],
        elements: [],
        logics: [],
      };

      // 1) Update the light flirt structure (Layer 1)
      createStepInStructure({
        stepId: tempStepId,
        isNew: true,
        insertAfterId: step.id,
      });

      // 2) Register the new step in the content editor state (Layer 2)
      addOrUpdateStep(newStep);
      setStep(newStep);

      // 3) Keep local totalSteps in sync (this is still only in-memory)
      setTotalStepsState(prev => prev + 1);

      // 4) Navigate to the new (temporary) step route
      router.push(`/flirts/${initialFlirtId}/steps/${tempStepId}`);

      return { step: newStep, totalSteps: totalStepsState + 1 };
    }

    // Non-last step: still use the existing DB-based navigation for now.
    try {
      // Prefer structure-driven navigation if possible (DB + temp)
      if (structureHasOrder && structureStepOrder.includes(step.id)) {
        const nextId = structureStepOrder[structureStepOrder.indexOf(step.id) + 1];
        if (nextId) {
          router.push(`/flirts/${initialFlirtId}/steps/${nextId}`);
          return { stepId: nextId };
        }
      }

      // Fallback: DB-based navigation
      const res = await fetch(`/api/step/${step.id}/next`, { method: "GET" });
      if (!res.ok) return null;
      const data = await res.json();

      createStepInStructure({ stepId: data.step.id, isNew: false, insertAfterId: step.id });

      if (data.totalSteps) setTotalStepsState(data.totalSteps);
      router.push(`/flirts/${initialFlirtId}/steps/${data.step.id}`);
      return data;
    } catch (err) {
      console.error("fetchNextStep error", err);
      return null;
    }
  };

  const fetchPreviousStep = async () => {
    try {
      // Prefer structure-driven navigation if possible (DB + temp)
      if (structureHasOrder && structureStepOrder.includes(step.id)) {
        const prevId = structureStepOrder[structureStepOrder.indexOf(step.id) - 1];
        if (prevId) {
          router.push(`/flirts/${initialFlirtId}/steps/${prevId}`);
          return { stepId: prevId };
        }
      }

      const res = await fetch(`/api/step/${step.id}/previous`, {
        method: "GET",
      });
      if (!res.ok) return null;
      const data = await res.json();
      router.push(`/flirts/${initialFlirtId}/steps/${data.step.id}`);
      return data;
    } catch (err) {
      console.error("fetchPreviousStep error", err);
      return null;
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this step?")) return;

    try {
      const order = structureStepOrder.length > 0 ? structureStepOrder : [step.id];
      const currentIndexInOrder = order.indexOf(step.id);
      const prevId = currentIndexInOrder > 0 ? order[currentIndexInOrder - 1] : null;
      const nextId = currentIndexInOrder >= 0 && currentIndexInOrder < order.length - 1 ? order[currentIndexInOrder + 1] : null;

      // Distinguish between TEMP steps (never saved) and DB-backed steps
      const isTempStep = !!flirtStructure?.newStepIds.includes(step.id);

      // Helper: navigate to neighbour or create a fresh temp step if none exist
      const navigateAfterDelete = async () => {
        const targetStepId = nextId || prevId;

        if (targetStepId) {
          router.replace(`/flirts/${initialFlirtId}/steps/${targetStepId}`);
          return;
        }

        // No steps left in structure → create a brand new TEMP base step
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

        createStepInStructure({
          stepId: tempStepId,
          isNew: true,
          insertAfterId: null,
        });

        addOrUpdateStep(newStep);
        setStep(newStep);
        setTotalStepsState(1);
        router.replace(`/flirts/${initialFlirtId}/steps/${tempStepId}`);
      };

      if (isTempStep) {
        // Purely client-side delete: only touch structure + in-memory step state
        deleteStepInStructure(step.id);
        removeStep(step.id);
        await navigateAfterDelete();
        return;
      }

      // DB-backed step: still call the API for now, but ALSO keep our own structure layer in sync.
      const resDelete = await fetch(`/api/step/${step.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!resDelete.ok) {
        throw new Error("Failed to delete step");
      }

      // We don't strictly need the body here; structure/order is driven by Layer 1.
      deleteStepInStructure(step.id);
      removeStep(step.id);
      setTotalStepsState((prev) => Math.max(prev - 1, 1));

      await navigateAfterDelete();
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
