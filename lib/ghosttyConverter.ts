import { ASCIIFrame, ExtractedFrame } from './types';
import { PNGDecoder } from './pngDecoder';

/**
 * Ghostty Video-to-Terminal Converter
 * Exact implementation of Ghostty's video-to-terminal.sh script
 * Optimized for highest quality and accuracy to the reference implementation
 */
export class GhosttyConverter {
  // Exact Ghostty constants from the reference script
  private readonly FONT_RATIO = 0.44;
  private readonly OUTPUT_FPS = 24;
  private readonly OUTPUT_COLUMNS = 100;

  // Exact Ghostty color definitions
  private readonly BLUE = [0, 0, 230] as const;
  private readonly BLUE_DISTANCE_TOLERANCE = 90;
  private readonly BLUE_MIN_LUMINANCE = 10;
  private readonly BLUE_MAX_LUMINANCE = 21;

  private readonly WHITE = [215, 215, 215] as const;
  private readonly WHITE_DISTANCE_TOLERANCE = 140;
  private readonly WHITE_MIN_LUMINANCE = 165;
  private readonly WHITE_MAX_LUMINANCE = 255;

  // Exact character mapping from Ghostty (0-9 -> ·~ox+=*%$@)
  private readonly CHARACTERS = ['·', '~', 'o', 'x', '+', '=', '*', '%', '$', '@'] as const;

  /**
   * Convert extracted frames to ASCII using exact Ghostty logic
   */
  async convertFramesToASCII(frames: ExtractedFrame[]): Promise<ASCIIFrame[]> {
    const asciiFrames: ASCIIFrame[] = [];
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`Converting frame ${i + 1}/${frames.length}...`);
      
      const asciiFrame = await this.convertSingleFrame(frame);
      asciiFrames.push(asciiFrame);
    }
    
    return asciiFrames;
  }

  /**
   * Convert a single extracted frame to ASCII
   */
  private async convertSingleFrame(frame: ExtractedFrame): Promise<ASCIIFrame> {
    // Create ImageData from PNG buffer
    const imageData = await this.createImageDataFromPNG(frame.imageData);
    
    // Scale image to proper ASCII dimensions with font ratio correction
    const scaledImageData = this.scaleImageForASCII(imageData);
    
    // Convert to ASCII using exact Ghostty pixel_for() logic
    const { asciiContent, colorData } = this.convertPixelsToASCII(scaledImageData);
    
    return {
      index: frame.index,
      timestamp: frame.timestamp,
      asciiContent,
      width: scaledImageData.width,
      height: scaledImageData.height,
      colorData
    };
  }

  /**
   * Scale image to proper ASCII dimensions with exact Ghostty font ratio correction
   */
  private scaleImageForASCII(imageData: ImageData): ImageData {
    const { width: originalWidth, height: originalHeight, data: originalData } = imageData;
    
    // Calculate new dimensions exactly like Ghostty
    const newWidth = Math.min(this.OUTPUT_COLUMNS, originalWidth);
    const aspectRatio = originalHeight / originalWidth;
    const newHeight = Math.floor(newWidth * aspectRatio * this.FONT_RATIO);
    
    console.log(`Scaling ${originalWidth}x${originalHeight} -> ${newWidth}x${newHeight}`);
    
    // Create new image data with bilinear interpolation for better quality
    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        // Map to original coordinates
        const srcX = (x / newWidth) * originalWidth;
        const srcY = (y / newHeight) * originalHeight;
        
        // Bilinear interpolation for better quality
        const pixel = this.bilinearInterpolation(originalData, originalWidth, originalHeight, srcX, srcY);
        
        const destIndex = (y * newWidth + x) * 4;
        newData[destIndex] = pixel[0];     // R
        newData[destIndex + 1] = pixel[1]; // G
        newData[destIndex + 2] = pixel[2]; // B
        newData[destIndex + 3] = pixel[3]; // A
      }
    }
    
    return {
      data: newData,
      width: newWidth,
      height: newHeight,
      colorSpace: imageData.colorSpace
    };
  }

  /**
   * Bilinear interpolation for better image scaling quality
   */
  private bilinearInterpolation(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number
  ): [number, number, number, number] {
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, width - 1);
    const y2 = Math.min(y1 + 1, height - 1);
    
    const dx = x - x1;
    const dy = y - y1;
    
    // Get the four surrounding pixels
    const getPixel = (px: number, py: number): [number, number, number, number] => {
      const index = (py * width + px) * 4;
      return [data[index], data[index + 1], data[index + 2], data[index + 3]];
    };
    
    const p1 = getPixel(x1, y1);
    const p2 = getPixel(x2, y1);
    const p3 = getPixel(x1, y2);
    const p4 = getPixel(x2, y2);
    
    // Interpolate
    const result: [number, number, number, number] = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      const top = p1[i] * (1 - dx) + p2[i] * dx;
      const bottom = p3[i] * (1 - dx) + p4[i] * dx;
      result[i] = Math.round(top * (1 - dy) + bottom * dy);
    }
    
    return result;
  }

  /**
   * Convert pixels to ASCII using exact Ghostty pixel_for() logic
   */
  private convertPixelsToASCII(imageData: ImageData): {
    asciiContent: string;
    colorData: Array<Array<{ char: string; color: string; colorClass?: string }>>;
  } {
    const { width, height, data } = imageData;
    const lines: string[] = [];
    const colorData: Array<Array<{ char: string; color: string; colorClass?: string }>> = [];
    
    for (let y = 0; y < height; y++) {
      let line = '';
      const colorRow: Array<{ char: string; color: string; colorClass?: string }> = [];
      
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const a = data[pixelIndex + 3];
        
        // Skip fully transparent pixels
        if (a < 128) {
          line += ' ';
          colorRow.push({ char: ' ', color: 'transparent' });
          continue;
        }
        
        // Apply exact Ghostty pixel_for() logic
        const result = this.pixelFor([r, g, b]);
        line += result.char;
        colorRow.push({
          char: result.char,
          color: result.colorClass === 'b' ? '#0000e6' : result.colorClass === 'w' ? '#d7d7d7' : 'inherit',
          colorClass: result.colorClass
        });
      }
      
      lines.push(line);
      colorData.push(colorRow);
    }
    
    return {
      asciiContent: lines.join('\n'),
      colorData
    };
  }

  /**
   * Exact implementation of Ghostty's pixel_for() function
   */
  private pixelFor(rgb: [number, number, number]): { char: string; colorClass?: string } {
    const [r, g, b] = rgb;
    
    // Calculate luminance using exact Ghostty formula
    // local luminance=$(awk -v r="$r" -v g="$g" -v b="$b" 'BEGIN{print int((0.2126 * r + 0.7152 * g + 0.0722 * b) / 1)}')
    const luminance = Math.floor((0.2126 * r + 0.7152 * g + 0.0722 * b));
    
    // Calculate Manhattan distances (exact Ghostty color_distance_from function)
    const blueDistance = this.colorDistanceFrom(rgb, this.BLUE);
    const whiteDistance = this.colorDistanceFrom(rgb, this.WHITE);
    
    // Exact Ghostty logic branches
    if (blueDistance < this.BLUE_DISTANCE_TOLERANCE) {
      // Blue color detected
      const scaledLuminance = Math.floor(
        ((luminance - this.BLUE_MIN_LUMINANCE) * 9) / (this.BLUE_MAX_LUMINANCE - this.BLUE_MIN_LUMINANCE)
      );
      const clampedLuminance = Math.max(0, Math.min(9, scaledLuminance));
      return {
        char: this.CHARACTERS[clampedLuminance],
        colorClass: 'b' // Ghostty uses 'b' class for blue
      };
    } else if (whiteDistance < this.WHITE_DISTANCE_TOLERANCE) {
      // White color detected
      const scaledLuminance = Math.floor(
        ((luminance - this.WHITE_MIN_LUMINANCE) * 9) / (this.WHITE_MAX_LUMINANCE - this.WHITE_MIN_LUMINANCE)
      );
      const clampedLuminance = Math.max(0, Math.min(9, scaledLuminance));
      return {
        char: this.CHARACTERS[clampedLuminance],
        colorClass: 'w' // White class (removed in Ghostty post-processing)
      };
    } else {
      // Default case - use space (exact Ghostty behavior)
      return { char: ' ' };
    }
  }

  /**
   * Exact implementation of Ghostty's color_distance_from function
   * Manhattan distance calculation
   */
  private colorDistanceFrom(color1: [number, number, number], color2: readonly [number, number, number]): number {
    const [r1, g1, b1] = color1;
    const [r2, g2, b2] = color2;
    return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
  }

  /**
   * Post-process ASCII content to match Ghostty's exact output format
   * Applies the same sed commands as the reference script
   */
  postProcessASCII(asciiContent: string, colorData: Array<Array<{ char: string; color: string; colorClass?: string }>>): string {
    let result = asciiContent;
    
    // Apply Ghostty's post-processing pipeline
    // The script does: perl -pe 's/(B[0-9](?:B[0-9])*)/<span class="b">\1<\/span>/g'
    // Then removes B and W prefixes, then maps numbers to characters
    
    const lines = result.split('\n');
    const processedLines: string[] = [];
    
    for (let y = 0; y < lines.length; y++) {
      let line = '';
      const row = colorData[y] || [];
      
      let i = 0;
      while (i < row.length) {
        const pixel = row[i];
        
        if (pixel.colorClass === 'b') {
          // Find consecutive blue pixels
          let blueSequence = '';
          let j = i;
          while (j < row.length && row[j].colorClass === 'b') {
            blueSequence += row[j].char;
            j++;
          }
          
          // Wrap in span with class "b"
          line += `<span class="b">${blueSequence}</span>`;
          i = j;
        } else {
          line += pixel.char;
          i++;
        }
      }
      
      processedLines.push(line);
    }
    
    return processedLines.join('\n');
  }

  /**
   * Create ImageData from PNG buffer using proper PNG decoder
   */
  private async createImageDataFromPNG(pngBuffer: Uint8Array): Promise<ImageData> {
    try {
      const decoded = await PNGDecoder.decode(pngBuffer);
      
      return {
        data: decoded.data,
        width: decoded.width,
        height: decoded.height,
        colorSpace: decoded.colorSpace
      } as ImageData;
      
    } catch (error) {
      console.error('Failed to decode PNG:', error);
      throw new Error(`Failed to decode PNG frame: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the exact Ghostty frame extraction options
   */
  getGhosttyFrameExtractionOptions() {
    return {
      fps: this.OUTPUT_FPS,
      scale: 1.0, // Always use full scale for best quality
      outputFormat: 'png' as const
    };
  }

  /**
   * Get frame extraction command that matches Ghostty's ffmpeg usage
   */
  getGhosttyFFmpegCommand(inputFile: string, outputPattern: string): string[] {
    return [
      '-i', inputFile,
      '-vf', `scale=${this.OUTPUT_COLUMNS}:-2,fps=${this.OUTPUT_FPS}`,
      '-y', // Overwrite output files
      outputPattern
    ];
  }
}
