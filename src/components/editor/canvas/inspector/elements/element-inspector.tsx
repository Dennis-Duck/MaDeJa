"use client";

import { ButtonInspector } from "./button-inspector";

interface ElementInspectorProps {
  elementId?: string;
  subtype?: string;
}

export function ElementInspector({ elementId, subtype }: ElementInspectorProps) {
  if (!elementId) return null;

  return (
    <div className="flex flex-col gap-2">
      {(!subtype || subtype === "BUTTON") && <ButtonInspector buttonId={elementId} />}
    </div>
  );
}
