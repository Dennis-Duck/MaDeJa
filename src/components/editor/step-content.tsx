"use client";

import type { Step } from "@/types/step";

export default function StepContent({
  step,
  totalSteps,
}: {
  step: Step;
  totalSteps: number;
}) {
  return (
    <div>
      <p>
        Step {step.order}/{totalSteps}
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
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
    </div>
  );
}
