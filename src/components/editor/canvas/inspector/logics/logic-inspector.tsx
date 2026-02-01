"use client";

import { TriggerInspector } from './trigger-inspector';
import { JumpInspector } from './jump-inspector';
import { Step } from '@/types/step';
import { Flirt } from '@/types/flirt';

interface LogicInspectorProps {
  logicId?: string;
  subtype?: string;
  step?: Step;
  flirt?: Flirt;
}

export function LogicInspector({ logicId, subtype, step, flirt }: LogicInspectorProps) {
  if (!logicId) return null;

  return (
    <div className="flex flex-col gap-2">
      {(!subtype || subtype === "TRIGGER") && <TriggerInspector logicId={logicId} step={step} />}
      {(!subtype || subtype === "JUMP") && <JumpInspector logicId={logicId} step={step} flirt={flirt} />}
    </div>
  );
}
