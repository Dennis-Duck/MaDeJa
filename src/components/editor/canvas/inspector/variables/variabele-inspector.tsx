"use client";

interface VariableInspectorProps {
  variableId?: string;
}

export function VariableInspector({ variableId }: VariableInspectorProps) {
  if (!variableId) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Variable Inspector</h2>
    </div>
  );
}
