"use client";

import type { Step } from "@/types/step";
import { EditorProvider } from "@/contexts/editor-context";

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
  return (
    <EditorProvider initialStep={initialStep}>
      <StepPageClientInner
        initialFlirtId={initialFlirtId}
        initialStep={initialStep}
        totalSteps={totalSteps}
        flirt={flirt}
      />
    </EditorProvider>
  );
}
