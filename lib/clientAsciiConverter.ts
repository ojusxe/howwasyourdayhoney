// Client-side converter"

import { OPTIMIZED_CHARACTER_SET } from './types';

export interface ClientASCIIOptions {
  width?: number;
  characterSet?: string;
  contrast?: number; // 0.5 to 2.0, default 1.0
  brightness?: number; // -100 to 100, default 0
}

export async function convertFrameToAscii(
  imageBlob: Blob, 
  options: ClientASCIIOptions = {}
): Promise<string> {
  const { 
    width = 120,
    characterSet = OPTIMIZED_CHARACTER_SET,
    contrast = 1.0,
    brightness = 0
  } = options;
  
  // Check for required browser APIs
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('Your browser does not support ImageBitmap API. Please use a modern browser like Chrome, Firefox, or Safari.');
  }
  
  // Create ImageBitmap from blob
  const imageBitmap = await createImageBitmap(imageBlob);
  
  // Calculate height maintaining aspect ratio, accounting for character aspect ratio
  const aspectRatio = imageBitmap.height / imageBitmap.width;
  const height = Math.floor(width * aspectRatio * 0.5); // 0.5 for character aspect ratio
  
  // Create canvas for processing (fallback for browsers without OffscreenCanvas)
  let canvas: OffscreenCanvas | HTMLCanvasElement;
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');
  } else {
    // Fallback for browsers without OffscreenCanvas support
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
  }
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Draw resized image
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  
  // Convert to ASCII with enhanced processing
  let asciiString = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      let r = data[pixelIndex];
      let g = data[pixelIndex + 1];
      let b = data[pixelIndex + 2];
      
      // Apply brightness adjustment
      if (brightness !== 0) {
        r = Math.max(0, Math.min(255, r + brightness));
        g = Math.max(0, Math.min(255, g + brightness));
        b = Math.max(0, Math.min(255, b + brightness));
      }
      
      // Calculate luminance using precise formula
      let luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722);
      
      // Apply contrast adjustment
      if (contrast !== 1.0) {
        luminance = ((luminance / 255 - 0.5) * contrast + 0.5) * 255;
        luminance = Math.max(0, Math.min(255, luminance));
      }
      
      // Enhanced character mapping with better distribution
      const normalizedLuminance = luminance / 255;
      
      // Use gamma correction for better visual perception
      const gammaCorrected = Math.pow(normalizedLuminance, 0.45);
      
      // Map to character index with improved distribution
      const charIndex = Math.floor(gammaCorrected * (characterSet.length - 1));
      const char = characterSet[Math.min(charIndex, characterSet.length - 1)];
      
      asciiString += char;
    }
    
    // Add newline at end of each row (except last)
    if (y < height - 1) {
      asciiString += '\n';
    }
  }
  
  // Clean up
  imageBitmap.close();
  
  return asciiString;
}

/**
 * Batch convert multiple frames with progress tracking
 */
export async function convertFramesToAscii(
  imageBlobs: Blob[],
  options: ClientASCIIOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];
  
  for (let i = 0; i < imageBlobs.length; i++) {
    const asciiFrame = await convertFrameToAscii(imageBlobs[i], options);
    results.push(asciiFrame);
    
    if (onProgress) {
      onProgress(i + 1, imageBlobs.length);
    }
  }
  
  return results;
}