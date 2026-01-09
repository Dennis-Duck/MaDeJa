"use client";

import { useState, useEffect } from "react";
import { Step} from "@/types/step";

interface ButtonInspectorProps {
  buttonId?: string;
  step?: Step;
  onUpdateStep?: () => void;
}

export function ButtonInspector({ buttonId, step, onUpdateStep }: ButtonInspectorProps) {
  if (!buttonId || !step) return null;

  const button = step.elements.find((el) => el.id === buttonId && el.type === "BUTTON");
  const [text, setText] = useState(button?.text ?? "");

  useEffect(() => {
    setText(button?.text ?? "");
  }, [button?.text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleSave = async () => {
    if (!button) return;

    const res = await fetch(`/api/step/${step.id}/elements/${button.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      onUpdateStep?.();
    }
  };

  return (
    <div className="bg-background flex flex-col gap-2 p-4 rounded shadow">
      <h2 className="text-lg font-semibold">Button Inspector</h2>

      <label className="block text-foreground-muted">Button Text</label>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        className="w-full p-2 rounded border bg-[var(--background-secondary)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <button
        onClick={handleSave}
        className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
      >
        Save
      </button>
    </div>
  );
}
