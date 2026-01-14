import { TextSegment } from "./text-segment";

export interface Element {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
  width?: number | null;
  height?: number | null;
  text?: string | null;
  textSegments?: TextSegment[];
  
  // Auto-advance (voor toekomst)
  autoAdvance?: boolean | null;
  autoAdvanceDelay?: number | null;
}