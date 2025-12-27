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
  type: string; 
  x?: number;  
  y?: number;
  z?: number;
  width?: number; 
  height?: number;
}

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}