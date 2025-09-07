import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ExtractedFrame } from './types';

/**
 * Server-side video processing using native FFmpeg
 * This is optimized for Vercel deployment
 */
export class ServerFFmpegProcessor {
  private readonly GHOSTTY_OUTPUT_FPS = 24;
  private readonly GHOSTTY_OUTPUT_COLUMNS = 100;
  private readonly GHOSTTY_FONT_RATIO = 0.44;

  /**
   * Process video file and extract frames using native FFmpeg
   */
  async processVideo(
    videoBuffer: ArrayBuffer,
    onProgress?: (current: number, total: number) => void
  ): Promise<ExtractedFrame[]> {
    const tempDir = join(tmpdir(), `video-processing-${randomUUID()}`);
    const videoPath = join(tempDir, 'input.mp4');
    const framesDir = join(tempDir, 'frames');

    try {
      // Create temporary directories
      await fs.mkdir(tempDir, { recursive: true });
      await fs.mkdir(framesDir, { recursive: true });

      // Write video file
      await fs.writeFile(videoPath, new Uint8Array(videoBuffer));

      // Extract frames using FFmpeg with exact Ghostty settings
      const framePattern = join(framesDir, 'frame_%04d.png');
      
      await this.extractFramesWithFFmpeg(videoPath, framePattern);

      // Process extracted frames
      const frames = await this.loadExtractedFrames(framesDir, onProgress);

      return frames;

    } finally {
      // Cleanup temporary files
      try {
        await this.cleanupTempDir(tempDir);
      } catch (error) {
        console.warn('Failed to cleanup temp directory:', error);
      }
    }
  }

  /**
   * Extract frames using native FFmpeg with exact Ghostty settings
   */
  private async extractFramesWithFFmpeg(inputPath: string, outputPattern: string): Promise<void> {
    const args = [
      '-loglevel', 'error',
      '-i', inputPath,
      '-vf', `scale=${this.GHOSTTY_OUTPUT_COLUMNS}:-2,fps=${this.GHOSTTY_OUTPUT_FPS}`,
      '-y',
      outputPattern
    ];

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Failed to spawn FFmpeg: ${error.message}`));
      });
    });
  }

  /**
   * Apply font ratio correction to frames (like ImageMagick resize)
   */
  private async applyFontRatioCorrection(framePath: string): Promise<void> {
    // Get original dimensions
    const dimensions = await this.getImageDimensions(framePath);
    const newHeight = Math.ceil(dimensions.height * this.GHOSTTY_FONT_RATIO);
    
    const outputPath = framePath.replace('.png', '_corrected.png');
    
    const args = [
      framePath,
      '-resize', `x${newHeight}!`,
      outputPath
    ];

    return new Promise((resolve, reject) => {
      const magick = spawn('magick', args);

      let stderr = '';
      magick.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      magick.on('close', (code) => {
        if (code === 0) {
          // Replace original with corrected version
          fs.rename(outputPath, framePath)
            .then(() => resolve())
            .catch(reject);
        } else {
          reject(new Error(`ImageMagick failed with code ${code}: ${stderr}`));
        }
      });

      magick.on('error', (error) => {
        reject(new Error(`Failed to spawn ImageMagick: ${error.message}`));
      });
    });
  }

  /**
   * Get image dimensions using ImageMagick identify
   */
  private async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    const args = ['-ping', '-format', '%w %h', imagePath];

    return new Promise((resolve, reject) => {
      const identify = spawn('magick', ['identify', ...args]);

      let stdout = '';
      let stderr = '';

      identify.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      identify.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      identify.on('close', (code) => {
        if (code === 0) {
          const [width, height] = stdout.trim().split(' ').map(Number);
          resolve({ width, height });
        } else {
          reject(new Error(`ImageMagick identify failed with code ${code}: ${stderr}`));
        }
      });

      identify.on('error', (error) => {
        reject(new Error(`Failed to spawn ImageMagick identify: ${error.message}`));
      });
    });
  }

  /**
   * Load extracted frames and convert to ExtractedFrame format
   */
  private async loadExtractedFrames(
    framesDir: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<ExtractedFrame[]> {
    const files = await fs.readdir(framesDir);
    const pngFiles = files
      .filter(f => f.endsWith('.png'))
      .sort();

    const frames: ExtractedFrame[] = [];

    for (let i = 0; i < pngFiles.length; i++) {
      const framePath = join(framesDir, pngFiles[i]);

      try {
        // Apply font ratio correction (exact Ghostty logic)
        await this.applyFontRatioCorrection(framePath);

        // Read frame data
        const frameData = await fs.readFile(framePath);
        const dimensions = await this.getImageDimensions(framePath);

        frames.push({
          index: i,
          timestamp: i / this.GHOSTTY_OUTPUT_FPS,
          imageData: new Uint8Array(frameData),
          width: dimensions.width,
          height: dimensions.height
        });

        if (onProgress) {
          onProgress(i + 1, pngFiles.length);
        }

      } catch (error) {
        console.warn(`Failed to process frame ${pngFiles[i]}:`, error);
      }
    }

    return frames;
  }

  /**
   * Clean up temporary directory
   */
  private async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      const files = await fs.readdir(tempDir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = join(tempDir, file.name);
        if (file.isDirectory()) {
          await this.cleanupTempDir(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      }
      
      await fs.rmdir(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Check if native tools are available
   */
  async checkNativeToolsAvailability(): Promise<{
    ffmpeg: boolean;
    imagemagick: boolean;
    error?: string;
  }> {
    try {
      // Check FFmpeg
      const ffmpegAvailable = await new Promise<boolean>((resolve) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        ffmpeg.on('close', (code) => resolve(code === 0));
        ffmpeg.on('error', () => resolve(false));
      });

      // Check ImageMagick
      const imagemagickAvailable = await new Promise<boolean>((resolve) => {
        const magick = spawn('magick', ['-version']);
        magick.on('close', (code) => resolve(code === 0));
        magick.on('error', () => resolve(false));
      });

      if (!ffmpegAvailable) {
        return {
          ffmpeg: false,
          imagemagick: imagemagickAvailable,
          error: 'FFmpeg not found. Please install FFmpeg.'
        };
      }

      if (!imagemagickAvailable) {
        return {
          ffmpeg: ffmpegAvailable,
          imagemagick: false,
          error: 'ImageMagick not found. Please install ImageMagick.'
        };
      }

      return {
        ffmpeg: true,
        imagemagick: true
      };

    } catch (error) {
      return {
        ffmpeg: false,
        imagemagick: false,
        error: `Failed to check native tools: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Singleton instance
let serverFFmpegInstance: ServerFFmpegProcessor | null = null;

export function getServerFFmpegProcessor(): ServerFFmpegProcessor {
  if (!serverFFmpegInstance) {
    serverFFmpegInstance = new ServerFFmpegProcessor();
  }
  return serverFFmpegInstance;
}
