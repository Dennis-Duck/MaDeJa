"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Step } from "@/types/step";

export function useStepEditor(
  initialFlirtId: string,
  initialStep: Step,
  initialTotalSteps: number
) {
  const [step, setStep] = useState<Step>(initialStep);
  const [totalSteps, setTotalSteps] = useState(initialTotalSteps);
  const router = useRouter();

  const isLastStep = step.order >= totalSteps;

  const fetchStep = async (stepId: string) => {
    try {
      const res = await fetch("/api/step/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, stepId }),
      });
      if (!res.ok) throw new Error("Failed to fetch step");
      const data = await res.json();
      setStep(data.step);
      setTotalSteps(data.totalSteps);
      return data;
    } catch (err) {
      console.error("useStepEditor.fetchStep", err);
      throw err;
    }
  };

  const next = async () => {
    try {
      const res = await fetch("/api/step/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, currentStepId: step.id }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setStep(data.step);
      setTotalSteps(data.totalSteps);
      return data;
    } catch (err) {
      console.error("useStepEditor.next", err);
      return null;
    }
  };

  const previous = async () => {
    try {
      const res = await fetch("/api/step/previous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, currentStepId: step.id }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setStep(data.step);
      return data;
    } catch (err) {
      console.error("useStepEditor.previous", err);
      return null;
    }
  };

  const deleteStep = async () => {
    let targetStepId: string | null = null;

    if (step.order < totalSteps) {
      const resNext = await fetch("/api/step/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, currentStepId: step.id }),
      });
      if (resNext.ok) targetStepId = (await resNext.json()).step.id;
    }

    if (!targetStepId) {
      const resPrev = await fetch("/api/step/previous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId, currentStepId: step.id }),
      });
      if (resPrev.ok) targetStepId = (await resPrev.json()).step.id;
    }

    await fetch("/api/step/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId: step.id }),
    });

    if (targetStepId) {
      await fetchStep(targetStepId);
      router.replace(`/flirts/${initialFlirtId}/steps/${targetStepId}`);
    } else {
      const resCreate = await fetch("/api/step/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flirtId: initialFlirtId }),
      });
      const data = await resCreate.json();
      setStep(data.step);
      setTotalSteps(1);
      router.replace(`/flirts/${initialFlirtId}/steps/${data.step.id}`);
    }
  };

  return {
    step,
    totalSteps,
    isLastStep,
    fetchStep,
    next,
    previous,
    deleteStep,
    setStep,
    setTotalSteps,
  };
}
