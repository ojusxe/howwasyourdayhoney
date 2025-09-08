import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export class ClientVideoProcessor {
  private ffmpeg: FFmpeg;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load FFmpeg with proper configuration for browser environment
      await this.ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      });
      this.isLoaded = true;
    } catch (error) {
      // Fallback to CDN if local files aren't available
      try {
        await this.ffmpeg.load();
        this.isLoaded = true;
      } catch (fallbackError) {
        throw new Error(`Failed to load FFmpeg: ${fallbackError}. Make sure your browser supports WebAssembly and SharedArrayBuffer.`);
      }
    }
  }

  async extractFrames(
    file: File, 
    onProgress: (progress: number) => void
  ): Promise<Blob[]> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    // Set up progress tracking
    this.ffmpeg.on('progress', ({ progress }) => {
      // FFmpeg progress is 0-1, convert to 0-100 for UI
      onProgress(Math.round(progress * 100));
    });

    try {
      // Write input file to virtual filesystem
      await this.ffmpeg.writeFile('input.mp4', await fetchFile(file));

      // Extract frames as PNG files
      // Using similar settings to your existing Ghostty processor
      await this.ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'fps=24', // 24 FPS like GHOSTTY_OUTPUT_FPS
        'frame-%04d.png'
      ]);

      // Read all generated frames
      const frames: Blob[] = [];
      let frameIndex = 1;
      
      while (true) {
        const frameName = `frame-${frameIndex.toString().padStart(4, '0')}.png`;
        
        try {
          const frameData = await this.ffmpeg.readFile(frameName);
          const blob = new Blob([frameData], { type: 'image/png' });
          frames.push(blob);
          frameIndex++;
        } catch (error) {
          // No more frames to read
          break;
        }
      }

      return frames;
    } catch (error) {
      throw new Error(`Frame extraction failed: ${error}`);
    } finally {
      // Clean up virtual filesystem
      try {
        await this.ffmpeg.deleteFile('input.mp4');
        // Clean up frame files
        let frameIndex = 1;
        while (true) {
          const frameName = `frame-${frameIndex.toString().padStart(4, '0')}.png`;
          try {
            await this.ffmpeg.deleteFile(frameName);
            frameIndex++;
          } catch {
            break;
          }
        }
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  }

  async terminate(): Promise<void> {
    if (this.isLoaded) {
      await this.ffmpeg.terminate();
      this.isLoaded = false;
    }
  }
}

// Convenience function for single-use processing
export async function extractFrames(
  file: File, 
  onProgress: (progress: number) => void
): Promise<Blob[]> {
  const processor = new ClientVideoProcessor();
  try {
    return await processor.extractFrames(file, onProgress);
  } finally {
    await processor.terminate();
  }
}