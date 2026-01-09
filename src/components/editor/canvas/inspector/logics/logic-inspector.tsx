"use client";

import { TriggerInspector } from './trigger-inspector';
import { JumpInspector } from './jump-inspector';
import { Step } from '@/types/step';

interface LogicInspectorProps {
  logicId?: string;
  subtype?: string;
  step?: Step;
  onUpdateStep?: () => void;
}

export function LogicInspector({ logicId, subtype, step, onUpdateStep }: LogicInspectorProps) {
  if (!logicId) return null;

  return (
    <div className="flex flex-col gap-2">
      {(!subtype || subtype === "TRIGGER") && <TriggerInspector logicId={logicId} step={step} onUpdateStep={onUpdateStep} />}
      {(!subtype || subtype === "JUMP") && <JumpInspector logicId={logicId} />}
    </div>
  );
}
