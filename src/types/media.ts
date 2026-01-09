export interface Media {
  id: string;
  url: string;
  type: string; 
  x: number;  
  y: number;
  z: number;
  width?: number | null; 
  height?: number | null;
}
