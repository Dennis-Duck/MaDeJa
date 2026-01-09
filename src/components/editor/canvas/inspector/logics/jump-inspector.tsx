"use client";

interface JumpInspectorProps {
  logicId?: string;
}

export function JumpInspector({ logicId }: JumpInspectorProps) {
  if (!logicId) return null;

  return (
    <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Jump Inspector</h2>
    </div>
  );
}