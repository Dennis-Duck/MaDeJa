"use client";

import { TriggerInspector } from './trigger-inspector';
import { JumpInspector } from './jump-inspector';

interface LogicInspectorProps {
  logicId?: string;
  subtype?: string;
}

export function LogicInspector({ logicId, subtype }: LogicInspectorProps) {
  if (!logicId) return null;

  return (
    <div className="flex flex-col gap-2">
      {(!subtype || subtype === "TRIGGER") && <TriggerInspector logicId={logicId} />}
      {(!subtype || subtype === "JUMP") && <JumpInspector logicId={logicId} />}
    </div>
  );
}
