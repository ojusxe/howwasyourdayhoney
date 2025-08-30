import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { ExtractedFrame, MAX_FILE_SIZE, MAX_DURATION } from './types';

/**
 * FFmpeg Worker with Ghostty-exact frame extraction
 * Uses the same ffmpeg settings as Ghostty's video-to-terminal.sh script
 */
export class GhosttyFFmpegWorker {
  private ffmpeg: FFmpeg;
  private isLoaded = false;

  // Ghostty's exact settings
  private readonly GHOSTTY_OUTPUT_FPS = 24;
  private readonly GHOSTTY_OUTPUT_COLUMNS = 100;
  private readonly GHOSTTY_FONT_RATIO = 0.44;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to initialize video processing engine');
    }
  }

  async validateVideo(file: File): Promise<{ valid: boolean; error?: string }> {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024 / 1024}MB)`
      };
    }

    // Check file format
    const validFormats = ['video/mp4', 'video/webm'];
    if (!validFormats.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file format. Please upload MP4 or WebM files only.'
      };
    }

    // For server-side validation, we'll do basic checks
    // In a production environment, you might want to use FFmpeg to probe the file
    try {
      // Basic file header validation
      const buffer = await file.arrayBuffer();
      const view = new Uint8Array(buffer.slice(0, 12));
      
      // Check for MP4 signature (ftyp box)
      if (file.type === 'video/mp4') {
        const ftypFound = Array.from(view.slice(4, 8))
          .map(b => String.fromCharCode(b))
          .join('') === 'ftyp';
        
        if (!ftypFound) {
          return {
            valid: false,
            error: 'Invalid MP4 file format'
          };
        }
      }

      // For now, assume duration is valid since we can't check it server-side without FFmpeg probe
      // In production, you would use FFmpeg to get actual duration
      return { valid: true };
      
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate video file'
      };
    }
  }

  async extractFrames(
    videoBuffer: ArrayBuffer,
    onProgress?: (progress: number) => void
  ): Promise<ExtractedFrame[]> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      const inputFileName = 'input.mp4';
      const outputPattern = 'frame_%04d.png';

      // Write input file to FFmpeg filesystem
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(videoBuffer));

      // Build exact Ghostty FFmpeg command
      // Original: ffmpeg -loglevel error -i "$video_file" -vf "scale=$OUTPUT_COLUMNS:-2,fps=$OUTPUT_FPS" "$frame_images_dir/frame_%04d.png"
      const command = [
        '-loglevel', 'error',
        '-i', inputFileName,
        '-vf', `scale=${this.GHOSTTY_OUTPUT_COLUMNS}:-2,fps=${this.GHOSTTY_OUTPUT_FPS}`,
        '-y', // Overwrite output files
        outputPattern
      ];

      console.log('Running Ghostty-compatible FFmpeg command:', command.join(' '));

      // Execute FFmpeg command
      await this.ffmpeg.exec(command);

      // Read extracted frames
      const frames: ExtractedFrame[] = [];
      let frameIndex = 1;

      while (true) {
        try {
          const frameFileName = `frame_${frameIndex.toString().padStart(4, '0')}.png`;
          const frameData = await this.ffmpeg.readFile(frameFileName);
          
          if (frameData instanceof Uint8Array) {
            // Get frame dimensions by parsing PNG header
            const dimensions = await this.getImageDimensions(frameData);
            
            frames.push({
              index: frameIndex - 1,
              timestamp: (frameIndex - 1) / this.GHOSTTY_OUTPUT_FPS,
              imageData: frameData,
              width: dimensions.width,
              height: dimensions.height
            });

            // Report progress
            if (onProgress) {
              onProgress(frameIndex);
            }

            frameIndex++;
          } else {
            break;
          }
        } catch (error) {
          // No more frames
          break;
        }
      }

      console.log(`Extracted ${frames.length} frames using Ghostty settings`);
      return frames;

    } catch (error) {
      console.error('Frame extraction failed:', error);
      throw new Error(`Failed to extract frames: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getImageDimensions(imageData: Uint8Array): Promise<{ width: number; height: number }> {
    // For server-side, we'll parse PNG header to get dimensions
    try {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      // IHDR chunk starts at byte 8, width at byte 16, height at byte 20
      if (imageData.length < 24) {
        throw new Error('Invalid PNG data');
      }

      // Check PNG signature
      const signature = Array.from(imageData.slice(0, 8));
      const expectedSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      
      if (!signature.every((byte, index) => byte === expectedSignature[index])) {
        throw new Error('Not a valid PNG file');
      }

      // Read width and height from IHDR chunk
      const width = (imageData[16] << 24) | (imageData[17] << 16) | (imageData[18] << 8) | imageData[19];
      const height = (imageData[20] << 24) | (imageData[21] << 16) | (imageData[22] << 8) | imageData[23];

      return { width, height };
    } catch (error) {
      console.warn('Failed to parse PNG dimensions, using defaults:', error);
      // Return default dimensions if parsing fails
      return { width: 640, height: 480 };
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up FFmpeg filesystem
      const files = await this.ffmpeg.listDir('/');
      for (const file of files) {
        if (file.name !== '.' && file.name !== '..') {
          try {
            await this.ffmpeg.deleteFile(file.name);
          } catch (error) {
            // Ignore cleanup errors
            console.warn(`Failed to delete file ${file.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('FFmpeg cleanup failed:', error);
    }
  }

  async getVideoInfo(videoBuffer: ArrayBuffer): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
  }> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      const inputFileName = 'probe.mp4';
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(videoBuffer));

      // Use ffprobe-like functionality to get video info
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-f', 'null',
        '-'
      ]);

      // For now, return default values - in a real implementation,
      // we would parse the FFmpeg output to get actual video info
      return {
        duration: 10, // Default duration
        width: 1920,  // Default width
        height: 1080, // Default height
        fps: 30       // Default fps
      };

    } catch (error) {
      console.error('Failed to get video info:', error);
      throw new Error('Failed to analyze video file');
    }
  }
}

// Singleton instance for reuse
let ghosttyFFmpegWorkerInstance: GhosttyFFmpegWorker | null = null;

export function getGhosttyFFmpegWorker(): GhosttyFFmpegWorker {
  if (!ghosttyFFmpegWorkerInstance) {
    ghosttyFFmpegWorkerInstance = new GhosttyFFmpegWorker();
  }
  return ghosttyFFmpegWorkerInstance;
}