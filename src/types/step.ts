import { Media } from "./media";
import type { Element } from "./element"
import type { Logic } from "./logic"

export interface Step {
  id: string;
  flirtId: string;
  order: number;
  content: string;
  media: Media[];
  elements: Element[];
  logics: Logic[];
}
