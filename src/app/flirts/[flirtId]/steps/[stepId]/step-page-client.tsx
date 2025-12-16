"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Step } from "@/types/step";
import UploadPic from "@/components/upload-pic";

interface StepPageClientProps {
  initialFlirtId: string;
  initialStep: Step;
  totalSteps: number;
}

export default function StepPageClient({
  initialFlirtId,
  initialStep,
  totalSteps
}: StepPageClientProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [totalStepsState, setTotalStepsState] = useState<number>(totalSteps);
  const [nextButtonLabel, setNextButtonLabel] = useState("Next");
  const router = useRouter();

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

    if (data.step.order >= totalStepsState) {
      setNextButtonLabel("Create Step");
    } else {
      setNextButtonLabel("Next");
    }
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

    if (data.step.order > totalStepsState) {
      setNextButtonLabel("Create Step");
    } else {
      setNextButtonLabel("Next");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this step?")) return;

    const previousStepOrder = step.order - 1;

    let targetStepId = null;
    if (previousStepOrder > 0) {
      const resPrev = await fetch("/api/step/previous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, currentStepId: step.id }),
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

    if (!resDelete.ok) return alert("Error while deleting step");

    if (targetStepId) {
      const resStep = await fetch("/api/step/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, stepId: targetStepId }),
      });
      if (resStep.ok) {
        const data = await resStep.json();
        setStep(data.step);
        setTotalStepsState(data.totalSteps);
      }
    } else {
      router.push("/");
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <p style={{ fontWeight: "bold", marginBottom: 12 }}>
        Step: {step.order}/{totalStepsState}
      </p>

      <UploadPic stepId={step.id} />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
        {step.media.map((m) =>
          m.type === "IMAGE" ? (
            <img
              key={m.id}
              src={m.url}
              width={300}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
          ) : (
            <video
              key={m.id}
              src={m.url}
              width={300}
              controls
              style={{ borderRadius: 8 }}
            />
          )
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={handlePrevious}
          disabled={step.order === 1}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "1px solid #ccc",
            cursor: step.order === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          {nextButtonLabel}
        </button>

        <button
          onClick={handleDelete}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "1px solid #ccc",
            backgroundColor: "#ffe6e6",
            color: "red",
            cursor: "pointer",
          }}
        >
          Delete Step
        </button>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Home
        </button>
      </div>
    </div>
  );
}
