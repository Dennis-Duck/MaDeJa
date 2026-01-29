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
  const { step } = useEditor();
  const [totalStepsState, setTotalStepsState] = useState(totalSteps);
  const [selectedItem, setSelectedItem] = useState<CanvasItemIdentifier | null>(null);
  const isLastStep = step.order >= totalStepsState;

  const fetchNextStep = async () => {
    try {
      // First try to get the next step
      let res = await fetch(`/api/step/${step.id}/next`, {
        method: "GET",
      });

      if (res.status === 404) {
        // No next step, so create a new one
        res = await fetch(`/api/step/${step.id}/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }

      if (!res.ok) return null;
      const data = await res.json();
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
      let targetStepId: string | null = null;

      if (step.order < totalStepsState) {
        const resNext = await fetch(`/api/step/${step.id}/next`, {
          method: "GET",
        });
        if (resNext.ok) targetStepId = (await resNext.json()).step.id;
      }

      if (!targetStepId) {
        const resPrev = await fetch(`/api/step/${step.id}/previous`, {
          method: "GET",
        });
        if (resPrev.ok) targetStepId = (await resPrev.json()).step.id;
      }

      await fetch(`/api/step/${step.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (targetStepId) {
        router.replace(`/flirts/${initialFlirtId}/steps/${targetStepId}`);
      } else {
        router.push("/");
      }
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
          totalSteps={totalStepsState}
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
          stepOrder={step.order}
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
