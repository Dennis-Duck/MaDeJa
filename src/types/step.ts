export interface Step {
  id: string;
  flirtId: string;
  order: number;
  content: string;
  media: { id: string; url: string; type: string }[];
}