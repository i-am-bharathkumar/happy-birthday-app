export interface Point {
    x: number;
    y: number;
  }
  
  export interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface CropData {
    cropArea: Area;
    rotation: number;
    flip: {
      horizontal: boolean;
      vertical: boolean;
    };
    zoom: number;
  }
  
  export interface AspectRatioOption {
    label: string;
    value: number | null;
  }
  
  export interface FilterOptions {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
  }
  
  export type CropMode = 'free' | 'aspect' | 'circle';