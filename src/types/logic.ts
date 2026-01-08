// Hoofdtypes van logic
export type LogicType = "TRIGGER" | "JUMP" | "CHECK" | "ACTION";

// Subtypes per type
export type TriggerSubtype = "BUTTON_CLICK" | "TIMER" | "PAGE_LOAD";
export type JumpSubtype = "STEP" | "URL";
export type CheckSubtype = "CONDITION" | "VALIDATION";
export type ActionSubtype = "NAVIGATE" | "SHOW_MESSAGE" | "API_CALL";

// Algemene Logic interface
export interface Logic {
  id: string;
  stepId: string;

  type: LogicType;
  subtype?: TriggerSubtype | JumpSubtype | CheckSubtype | ActionSubtype;
  config?: string; 

  parentId?: string;
  parentType?: "TRIGGER" | "CHECK";

  x: number;
  y: number;
  z: number;
  width?: number;
  height?: number;
}
