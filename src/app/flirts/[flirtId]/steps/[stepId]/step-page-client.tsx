"use client";

import type { Step } from "@/types/step";
import { useEditor } from "@/contexts/editor-context";
import { useEffect } from "react";

import { Flirt } from "@/types/flirt";
import StepPageClientInner from "./step-page-client-inner";

interface StepPageClientProps {
  initialFlirtId: string;
  initialStep: Step;
  totalSteps: number;
  flirt?: Flirt;
}

export default function StepPageClient({
  initialFlirtId,
  initialStep,
  totalSteps,
  flirt,
}: StepPageClientProps) {
  const { addOrUpdateStep, setStep } = useEditor();

  // When initialStep changes (navigation), update the context
  useEffect(() => {
    addOrUpdateStep(initialStep);
    setStep(initialStep);
  }, [initialStep, addOrUpdateStep, setStep]);

  return (
    <StepPageClientInner
      initialFlirtId={initialFlirtId}
      initialStep={initialStep}
      totalSteps={totalSteps}
      flirt={flirt}
    />
  );
}
