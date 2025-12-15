"use client";

import { useState } from "react";
import type { Step } from "@/types/step";
import UploadPic from "@/components/upload-pic";

interface StepPageClientProps {
  initialFlirtId: string;
  initialStep: Step;
}

export default function StepPageClient({
  initialFlirtId,
  initialStep,
}: StepPageClientProps) {
  const [step, setStep] = useState<Step>(initialStep);

  const handleNext = async () => {
    const res = await fetch("/api/step/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flirtId: initialFlirtId,
        currentStepId: step.id,
      }),
    });

    const data = await res.json();
    if (res.ok) setStep(data.step);
  };

  return (
    <div>
      <p>Step: {step.order}</p>
       <UploadPic stepId={step.id} />
      <button onClick={handleNext}>Next</button>
    </div>
  );
}
