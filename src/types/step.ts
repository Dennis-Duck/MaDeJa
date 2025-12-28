import { Media } from "./media";

export interface Step {
  id: string;
  flirtId: string;
  order: number;
  content: string;
  media: Media[];
}
