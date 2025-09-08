/**
 * Client-side ASCII converter for "How Was Your Day Honey?"
 * Converts video frames to beautiful ASCII art using Canvas API
 */

export interface ClientASCIIOptions {
  width?: number;
  characterSet?: string;
}

export async function convertFrameToAscii(
  imageBlob: Blob, 
  options: ClientASCIIOptions = {}
): Promise<string> {
  const { width = 100, characterSet = '·~ox+=*%$@' } = options;
  
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
  
  // Convert to ASCII
  let asciiString = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      
      // Calculate luminance using standard formula
      const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
      
      // Map luminance to character index
      const charIndex = Math.floor((luminance / 255) * (characterSet.length - 1));
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