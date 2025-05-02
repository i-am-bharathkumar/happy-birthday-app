import { Area } from "../types/cropTypes";

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Creates an Image object from a url and returns a promise
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Gets the dimensions of an image from its URL
 */
export const getImageDimensions = async (url: string): Promise<ImageDimensions> => {
  const img = await createImage(url);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight
  };
};

/**
 * Creates a cropped image from the source image and crop area
 */
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }


  // Set canvas size to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Set proper canvas dimensions before transform & export
  ctx.save();

  // Move origin to the center for rotation
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Apply flips
  const scaleX = flip.horizontal ? -1 : 1;
  const scaleY = flip.vertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Move back to the top left corner of canvas
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Restore canvas context
  ctx.restore();

  // Create a Blob from the canvas
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // If toBlob fails, fall back to toDataURL
          resolve(canvas.toDataURL("image/jpeg"));
          return;
        }
        
        const url = URL.createObjectURL(blob);
        resolve(url);
      },
      "image/jpeg",
      0.95 // Quality
    );
  });
};

/**
 * Rotate an image
 */
export const rotateImage = async (
  imageSrc: string,
  rotation: number
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  // Calculate new dimensions for rotated image
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  // Determine if the rotation is a multiple of 90 degrees
  const isVertical = rotation % 180 !== 0;
  
  // Set canvas size for the rotated image
  canvas.width = isVertical ? height : width;
  canvas.height = isVertical ? width : height;

  // Move canvas origin to center
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Draw the rotated image
  ctx.drawImage(
    image,
    -width / 2,
    -height / 2,
    width,
    height
  );

  // Return the rotated image as data URL
  return canvas.toDataURL("image/jpeg");
};

/**
 * Flip an image horizontally or vertically
 */
export const flipImage = async (
  imageSrc: string,
  horizontal: boolean = false,
  vertical: boolean = false
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  // Apply the flip transformations
  ctx.translate(horizontal ? width : 0, vertical ? height : 0);
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  
  // Draw the flipped image
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg");
};

/**
 * Apply basic filters to an image (brightness, contrast, saturation)
 */
export const applyFilters = async (
  imageSrc: string,
  filters: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  }
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Apply filters using CSS filters
  let filterString = "";
  
  if (filters.brightness !== undefined) {
    filterString += `brightness(${filters.brightness}%) `;
  }
  
  if (filters.contrast !== undefined) {
    filterString += `contrast(${filters.contrast}%) `;
  }
  
  if (filters.saturation !== undefined) {
    filterString += `saturate(${filters.saturation}%) `;
  }
  
  if (filters.blur !== undefined) {
    filterString += `blur(${filters.blur}px) `;
  }

  // Apply the filter
  if (filterString) {
    ctx.filter = filterString.trim();
    ctx.drawImage(image, 0, 0);
    ctx.filter = "none";
  }

  return canvas.toDataURL("image/jpeg");
};

/**
 * Resize an image to specific dimensions
 */
export const resizeImage = async (
  imageSrc: string,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio: boolean = true
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  let width = targetWidth;
  let height = targetHeight;

  if (maintainAspectRatio) {
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    
    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }
  }

  canvas.width = width;
  canvas.height = height;

  // Use better quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg");
};

/**
 * Get file info from a File object
 */
export const getFileInfo = (file: File): { 
  name: string;
  size: string;
  type: string;
  dimensions?: Promise<ImageDimensions>;
} => {
  const sizeInKB = file.size / 1024;
  let size = '';
  
  if (sizeInKB < 1024) {
    size = `${sizeInKB.toFixed(1)} KB`;
  } else {
    size = `${(sizeInKB / 1024).toFixed(1)} MB`;
  }

  const result = {
    name: file.name,
    size,
    type: file.type,
  };

  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    const dimensions = getImageDimensions(url).finally(() => {
      URL.revokeObjectURL(url);
    });
    
    return {
      ...result,
      dimensions,
    };
  }

  return result;
};