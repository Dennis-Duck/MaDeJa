export interface Element {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
  width?: number | null;
  height?: number | null;
  text?: string | null;
}