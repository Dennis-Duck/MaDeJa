"use client";

interface TriggerInspectorProps {
  logicId?: string;
}

export function TriggerInspector({ logicId }: TriggerInspectorProps) {
  if (!logicId) return null;

  return (
    <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Trigger Inspector</h2>
    </div>
  );
}