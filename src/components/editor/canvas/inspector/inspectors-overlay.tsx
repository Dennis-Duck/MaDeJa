"use client";

import { useState } from "react";
import { DraggableInspector } from "./draggable-inspector";
import { LogicInspector } from './logics/logic-inspector';
import { VariableInspector } from './variables/variabele-inspector';
import { ElementInspector } from './elements/element-inspector';

interface SelectedItem {
  id: string;
  type: "logic" | "variable" | "element";
  subtype?: string; // bv "trigger", "jump", "button", "timer"
}

interface CanvasItemIdentifier {
  id: string;
  type: "logic" | "variable" | "element" | "media";
  subtype?: string; // bv "trigger", "jump", "button", "timer"
}

interface InspectorsOverlayProps {
  selectedItem: CanvasItemIdentifier | null;
}

function mapSelectedItem(item: CanvasItemIdentifier | null): SelectedItem | null {
  if (!item) return null;

  let type: "logic" | "variable" | "element";
  let subtype: string | undefined;

  switch (item.type) {
    case "logic":
      type = "logic";
      subtype = item.subtype; // bv "trigger", "jump"
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


export function InspectorsOverlay({ selectedItem }: InspectorsOverlayProps) {
  // Posities en groottes van de draggable inspectors
  const [logicPos, setLogicPos] = useState({ x: 20, y: 20, width: 320, height: 400 });
  const [variablePos, setVariablePos] = useState({ x: 1600, y: 20, width: 300, height: 400 });
  const [elementPos, setElementPos] = useState({ x: 800, y: 600, width: 350, height: 400 });

  // Map het geselecteerde item naar interne SelectedItem type
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
          <LogicInspector logicId={mappedItem.id} subtype={mappedItem.subtype} />
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
          <ElementInspector elementId={mappedItem.id} />
        </DraggableInspector>
      )}
    </>
  );
}
