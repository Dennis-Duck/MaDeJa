export interface Step {
  id: string;
  flirtId: string;
  order: number;
  content: string;
  media: Media[];
}

export interface Media {
  id: string;
  url: string;
  type: string; // "IMAGE" | "VIDEO"
  x?: number;   // optioneel voor position
  y?: number;
  z?: number;
}

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}