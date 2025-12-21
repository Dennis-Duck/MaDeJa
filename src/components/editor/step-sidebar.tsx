"use client";

import UploadPic from "@/components/editor/step-upload-media";
import { Step } from "@/types/step";

interface StepSidebarProps {
  stepId: string;
  onStepChange?: () => void; // callback to parent
}

export default function StepSidebar({ stepId, onStepChange }: StepSidebarProps) {
  return (
    <div className="p-2 border rounded shadow-sm">
      <h3 className="mb-3 font-semibold">Add to step</h3>
      <UploadPic stepId={stepId} onUploadComplete={onStepChange} />
    </div>
  );
}

