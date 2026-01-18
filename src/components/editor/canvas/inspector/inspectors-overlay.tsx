"use client";

import { useState } from "react";
import { DraggableInspector } from "./draggable-inspector";
import { LogicInspector } from './logics/logic-inspector';
import { VariableInspector } from './variables/variabele-inspector';
import { ElementInspector } from './elements/element-inspector';
import { Step } from "@/types/step";
import { Flirt } from "@/types/flirt";

interface SelectedItem {
  id: string;
  type: "logic" | "variable" | "element";
  subtype?: string;
}

interface CanvasItemIdentifier {
  id: string;
  type: "logic" | "variable" | "element" | "media";
  subtype?: string;
}

interface InspectorsOverlayProps {
  selectedItem: CanvasItemIdentifier | null;
  step?: Step;
  flirt?: Flirt;
}

function mapSelectedItem(item: CanvasItemIdentifier | null): SelectedItem | null {
  if (!item) return null;

  let type: "logic" | "variable" | "element";
  let subtype: string | undefined;

  switch (item.type) {
    case "logic":
      type = "logic";
      subtype = item.subtype;
      break;
    case "variable":
      type = "variable";
      break;
    case "element":
      type = "element";
      subtype = item.subtype; // bv "button", "timer"
      break;
    default:
      return null;
  }

  return { id: item.id, type, subtype };
}

export function InspectorsOverlay({ selectedItem, step, flirt }: InspectorsOverlayProps) {
  const [logicPos, setLogicPos] = useState({ x: 1100, y: 50, width: 350, height: 400 });
  const [variablePos, setVariablePos] = useState({ x: 700, y: 500, width: 300, height: 400 });
  const [elementPos, setElementPos] = useState({ x: 200, y: 200, width: 320, height: 400 });

  const mappedItem = mapSelectedItem(selectedItem);

  return (
    <>
      {/* Logic Inspector */}
      {mappedItem?.type === "logic" && (
        <DraggableInspector
          position={logicPos}
          onPositionChange={(pos) =>
            setLogicPos((prev) => ({ ...prev, x: pos.x, y: pos.y }))
          }
          onSizeChange={(size) =>
            setLogicPos((prev) => ({ ...prev, ...size }))
          }
        >
          <LogicInspector
            logicId={mappedItem.id}
            subtype={mappedItem.subtype}
            step={step}
            flirt={flirt}
          />
        </DraggableInspector>
      )}

      {/* Variable Inspector */}
      {mappedItem?.type === "variable" && (
        <DraggableInspector
          position={variablePos}
          onPositionChange={(pos) =>
            setVariablePos((prev) => ({ ...prev, x: pos.x, y: pos.y }))
          }
          onSizeChange={(size) =>
            setVariablePos((prev) => ({ ...prev, ...size }))
          }
        >
          <VariableInspector variableId={mappedItem.id} />
        </DraggableInspector>
      )}

      {/* Element Inspector */}
      {mappedItem?.type === "element" && (
        <DraggableInspector
          position={elementPos}
          onPositionChange={(pos) =>
            setElementPos((prev) => ({ ...prev, x: pos.x, y: pos.y }))
          }
          onSizeChange={(size) =>
            setElementPos((prev) => ({ ...prev, ...size }))
          }
        >
          <ElementInspector
            elementId={mappedItem.id}
            subtype={mappedItem.subtype}
            step={step}
          />

        </DraggableInspector>
      )}
    </>
  );
}
