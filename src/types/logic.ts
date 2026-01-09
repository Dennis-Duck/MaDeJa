export interface Logic {
  id: string;
  stepId: string;

  type: string;
  subtype?: string | null; // "BUTTON_CLICK" | "TIMER" | "PAGE_LOAD"
  config?: string | null; // "TRIGGER" | "JUMP" | "CHECK" | "ACTION"

  parentId?: string | null;
  parentType?: string | null; //"TRIGGER" | "CHECK";

  x: number;
  y: number;
  z: number;
  width?: number | null;
  height?: number | null;
}
