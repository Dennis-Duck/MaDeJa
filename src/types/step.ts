import { Media } from "./media";
import type { Element } from "./element"

export interface Step {
  id: string;
  flirtId: string;
  order: number;
  content: string;
  media: Media[];
  elements: Element[];
}
