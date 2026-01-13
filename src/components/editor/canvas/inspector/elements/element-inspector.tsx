"use client";

import { Step } from "@/types/step";
import { ButtonInspector } from "./button-inspector";
import { TextInspector } from "./text-inspector";

interface ElementInspectorProps {
  elementId?: string;
  subtype?: string;
  step?: Step;
  onUpdateStep?: () => void;
}

export function ElementInspector({ elementId, subtype, step, onUpdateStep }: ElementInspectorProps) {
  if (!elementId) return null;

  return (
    <div className="flex flex-col gap-2">
      {(!subtype || subtype === "BUTTON") && (
        <ButtonInspector
          buttonId={elementId}
          step={step}
          onUpdateStep={onUpdateStep}
        />
      )}

       {(!subtype || subtype === "TEXT") && (
        <TextInspector
          textId={elementId}
          step={step}
          onUpdateStep={onUpdateStep}
        />
      )}
    </div>
  );
}

