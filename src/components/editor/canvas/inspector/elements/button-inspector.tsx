"use client";

interface ButtonInspectorProps {
  buttonId?: string;
}

export function ButtonInspector({ buttonId }: ButtonInspectorProps) {
  if (!buttonId) return null;

  return (
    <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Button Inspector</h2>
    </div>
  );
}