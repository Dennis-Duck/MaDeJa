"use client";

import { Flirt } from "@/types/flirt";
import { Step } from "@/types/step";
import { useEffect, useState } from "react";

interface JumpInspectorProps {
  logicId?: string;
  step?: Step;
  flirt?: Flirt;         
  onUpdateStep?: () => void;
}

export function JumpInspector({
  logicId,
  step,
  flirt,
  onUpdateStep,
}: JumpInspectorProps) {
  if (!logicId || !step) return null;

  const [parentLogicId, setParentLogicId] = useState<string>("");
  const [targetStepId, setTargetStepId] = useState<string>("");

  const parentCandidates = step.logics.filter(
    (l) => l.id !== logicId && l.type !== "JUMP"
  );

  useEffect(() => {
    const currentLogic = step.logics.find((l) => l.id === logicId);
    if (!currentLogic) return;

    if (currentLogic.parentId) {
      setParentLogicId(currentLogic.parentId);
    }

    if (currentLogic.config) {
      try {
        const cfg = JSON.parse(currentLogic.config);
        if (cfg.targetStepId) setTargetStepId(cfg.targetStepId);
      } catch {
        // ignore malformed JSON
      }
    }
  }, [step, logicId]);

  const handleSave = async () => {
    if (!logicId) return;

    const parentLogic = step.logics.find((l) => l.id === parentLogicId);
    if (!parentLogic) return;

    const config = JSON.stringify({ targetStepId });

    const res = await fetch(`/api/step/${step.id}/logics/${logicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId: parentLogic.id,
        parentType: parentLogic.type,
        config,
      }),
    });

    if (res.ok) onUpdateStep?.();
  };

  return (
    <div className="bg-background flex flex-col gap-2 p-4 rounded shadow">
      <h2 className="text-lg font-semibold">Jump Inspector</h2>

      <p className="text-sm text-foreground-muted mb-2">
        This jump will execute after the selected block and go to the chosen step.
      </p>

      {/* Parent block */}
      <label className="block text-foreground-muted mb-1">Triggered by</label>
      <select
        value={parentLogicId}
        onChange={(e) => setParentLogicId(e.target.value)}
        className="w-full p-2 rounded border bg-[var(--background-secondary)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="">Select a block</option>
        {parentCandidates.map((logic) => (
          <option key={logic.id} value={logic.id}>
            {logic.type}
            {logic.subtype ? `: ${logic.subtype}` : ""}
          </option>
        ))}
      </select>

      {/* Target step */}
      <label className="block text-foreground-muted mb-1 mt-2">Jump to Step</label>
      <select
        value={targetStepId}
        onChange={(e) => setTargetStepId(e.target.value)}
        className="w-full p-2 rounded border bg-[var(--background-secondary)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="">Select a step</option>
        {flirt?.steps.map((s) => (
          <option key={s.id} value={s.id}>
            {s.order}
          </option>
        ))}
      </select>

      <button
        onClick={handleSave}
        className="mt-4 py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
      >
        Save
      </button>
    </div>
  );
}
