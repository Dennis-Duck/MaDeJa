"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Step } from "@/types/step";

import StepEditorLayout from "@/components/editor/step-editor-layout";
import StepSidebar from "@/components/editor/step-sidebar";
import StepContent from "@/components/editor/step-content";
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
  const [step, setStep] = useState<Step>(initialStep);
  const [totalStepsState, setTotalStepsState] = useState<number>(totalSteps);
  const router = useRouter();

  const isLastStep = step.order >= totalStepsState;

  const handleNext = async () => {
    const res = await fetch("/api/step/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flirtId: initialFlirtId,
        currentStepId: step.id,
      }),
    });

    if (!res.ok) return;

    const data = await res.json();
    setStep(data.step);
    setTotalStepsState(data.totalSteps);
  };

  const handlePrevious = async () => {
    const res = await fetch("/api/step/previous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flirtId: initialFlirtId,
        currentStepId: step.id,
      }),
    });

    if (!res.ok) return;

    const data = await res.json();
    setStep(data.step);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this step?")) return;

    const previousStepOrder = step.order - 1;
    let targetStepId: string | null = null;

    if (previousStepOrder > 0) {
      const resPrev = await fetch("/api/step/previous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flirtId: initialFlirtId,
          currentStepId: step.id,
        }),
      });

      if (resPrev.ok) {
        const data = await resPrev.json();
        targetStepId = data.step.id;
      }
    }

    const resDelete = await fetch("/api/step/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId: step.id }),
    });

    if (!resDelete.ok) {
      alert("Error while deleting step");
      return;
    }

    if (!targetStepId) {
      router.push("/");
      return;
    }

    const resStep = await fetch("/api/step/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flirtId: initialFlirtId,
        stepId: targetStepId,
      }),
    });

    if (resStep.ok) {
      const data = await resStep.json();
      setStep(data.step);
      setTotalStepsState(data.totalSteps);
    }
  };

  return (
    <StepEditorLayout
      sidebar={
        <StepSidebar
          stepId={step.id}
          onStepChange={async () => {
            // Refetch the current step from the API
            const res = await fetch("/api/step/get", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                flirtId: initialFlirtId,
                stepId: step.id,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setStep(data.step);
              setTotalStepsState(data.totalSteps);
            }
          }}
        />
      }
      content={<StepContent step={step} totalSteps={totalStepsState} />}
      footer={
        <StepNavigationFooter
          stepOrder={step.order}
          isLast={isLastStep}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onDelete={handleDelete}
          onHome={() => router.push("/")}
        />
      }
    />
  );
}
