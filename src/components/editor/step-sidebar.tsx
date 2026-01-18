"use client";

import UploadPic from "@/components/editor/step-upload-media";
import ElementsPicker from "./canvas/elements/elements-picker";
import LogicsPicker from "./canvas/logics/logics-picker";

interface StepSidebarProps {
  stepId: string;
}

export default function StepSidebar({ stepId }: StepSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="p-2 border rounded shadow-sm">
        <h3 className="mb-3 font-semibold">Add media</h3>
        <UploadPic stepId={stepId} />
      </div>

      <div className="p-2 border rounded shadow-sm">
        <h3 className="mb-3 font-semibold">Add element</h3>
        <ElementsPicker
          stepId={stepId}
        />
      </div>

       <div className="p-2 border rounded shadow-sm">
        <h3 className="mb-3 font-semibold">Add logic
        </h3>
        <LogicsPicker
          stepId={stepId}
        />
      </div>
    </div>
  );
}

