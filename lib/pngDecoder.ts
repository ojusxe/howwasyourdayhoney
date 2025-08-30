import { PNG } from 'pngjs';

/**
 * PNG Decoder for server-side image processing
 * Provides accurate PNG decoding for the Ghostty converter
 */

export interface DecodedPNG {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace;
}

export class PNGDecoder {
  /**
   * Decode PNG buffer to ImageData-compatible format
   */
  static async decode(pngBuffer: Uint8Array): Promise<DecodedPNG> {
    return new Promise((resolve, reject) => {
      try {
        const png = new PNG();
        
        png.parse(Buffer.from(pngBuffer), (error, data) => {
          if (error) {
            reject(new Error(`PNG decode error: ${error.message}`));
            return;
          }

          if (!data) {
            reject(new Error('PNG decode failed: no data returned'));
            return;
          }

          // Convert PNG data (RGB/RGBA) to RGBA format for ImageData compatibility
          const { width, height } = data;
          const rgba = new Uint8ClampedArray(width * height * 4);

          // PNG data is already in RGBA format, just copy it
          for (let i = 0; i < data.data.length; i++) {
            rgba[i] = data.data[i];
          }

          // Ensure alpha channel is set to 255 if it's missing
          for (let i = 3; i < rgba.length; i += 4) {
            if (rgba[i] === undefined || rgba[i] === 0) {
              rgba[i] = 255; // Fully opaque
            }
          }

          resolve({
            data: rgba,
            width,
            height,
            colorSpace: 'srgb' as PredefinedColorSpace
          });
        });
      } catch (error) {
        reject(new Error(`PNG decode failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Get PNG dimensions without full decode (faster for validation)
   */
  static getDimensions(pngBuffer: Uint8Array): { width: number; height: number } {
    try {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      // IHDR chunk starts at byte 8, width at byte 16, height at byte 20
      if (pngBuffer.length < 24) {
        throw new Error('Invalid PNG data - file too short');
      }

      // Check PNG signature
      const signature = Array.from(pngBuffer.slice(0, 8));
      const expectedSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      
      if (!signature.every((byte, index) => byte === expectedSignature[index])) {
        throw new Error('Not a valid PNG file - invalid signature');
      }

      // Read width and height from IHDR chunk (big-endian)
      const width = (pngBuffer[16] << 24) | (pngBuffer[17] << 16) | (pngBuffer[18] << 8) | pngBuffer[19];
      const height = (pngBuffer[20] << 24) | (pngBuffer[21] << 16) | (pngBuffer[22] << 8) | pngBuffer[23];

      if (width <= 0 || height <= 0 || width > 10000 || height > 10000) {
        throw new Error('Invalid PNG dimensions');
      }

      return { width, height };
    } catch (error) {
      console.warn('Failed to parse PNG dimensions:', error);
      // Return safe default dimensions
      return { width: 100, height: 75 };
    }
  }

  /**
   * Validate PNG buffer
   */
  static isValidPNG(buffer: Uint8Array): boolean {
    if (buffer.length < 8) return false;
    
    const signature = Array.from(buffer.slice(0, 8));
    const expectedSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    
    return signature.every((byte, index) => byte === expectedSignature[index]);
  }
}
