export interface Element {
  id: string;
  stepId: string;
  type: string;
  x: number;
  y: number;
  z: number;
  width?: number | null;
  height?: number | null;
  text?: string | null;
}