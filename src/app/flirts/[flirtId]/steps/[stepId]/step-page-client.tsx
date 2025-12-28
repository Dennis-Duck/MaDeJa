"use client";

import { useRouter } from "next/navigation";
import type { Step } from "@/types/step";
import { useStepEditor } from "@/app/hooks/use-step-editor";

import StepEditorLayout from "@/components/editor/step-editor-layout";
import StepSidebar from "@/components/editor/step-sidebar";
import StepMediaManager from "@/components/editor/step-content";
import StepNavigationFooter from "@/components/editor/step-navigation-footer";

interface StepPageClientProps {
  initialFlirtId: string;
  initialStep: Step;
  totalSteps: number;
}

export default function StepPageClient({
  initialFlirtId,
  initialStep,
  totalSteps,
}: StepPageClientProps) {
  const router = useRouter();

  const {
    step,
    totalSteps: totalStepsState,
    isLastStep,
    fetchStep,
    next,
    previous,
    deleteStep,
  } = useStepEditor(initialFlirtId, initialStep, totalSteps);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this step?")) return;
    try {
      await deleteStep();
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
          onStepChange={() => fetchStep(step.id)}
        />
      }
      content={
        <StepMediaManager
          step={step}
          totalSteps={totalStepsState}
          onStepContentChange={() => fetchStep(step.id)}
        />
      }
      footer={
        <StepNavigationFooter
          stepOrder={step.order}
          isLast={isLastStep}
          onNext={() => next()}
          onPrevious={() => previous()}
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
