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
      // Load FFmpeg from CDN (most reliable)
      await this.ffmpeg.load();
      this.isLoaded = true;
    } catch (error) {
      throw new Error(`Failed to load FFmpeg: ${error}. Make sure your browser supports WebAssembly and SharedArrayBuffer.`);
    }
  }

  async extractFrames(
    file: File, 
    onProgress: (progress: number) => void
  ): Promise<Blob[]> {
    console.log('Starting frame extraction for file:', file.name, 'Size:', file.size);
    
    if (!this.isLoaded) {
      console.log('Initializing FFmpeg...');
      await this.initialize();
    }

    // Set up progress tracking
    this.ffmpeg.on('progress', ({ progress }) => {
      // FFmpeg progress is 0-1, convert to 0-100 for UI
      const progressPercent = Math.round(progress * 100);
      console.log('FFmpeg progress:', progressPercent + '%');
      onProgress(progressPercent);
    });

    try {
      console.log('Writing file to FFmpeg virtual filesystem...');
      // Write input file to virtual filesystem
      await this.ffmpeg.writeFile('input.mp4', await fetchFile(file));

      console.log('Executing FFmpeg command...');
      // Extract frames as PNG files at 24 FPS
      await this.ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'fps=24', // Standard 24 FPS for smooth animation
        'frame-%04d.png'
      ]);

      console.log('Reading extracted frames...');
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
          console.log(`Finished reading frames. Total: ${frames.length}`);
          break;
        }
      }

      return frames;
    } catch (error) {
      console.error('Frame extraction error:', error);
      throw new Error(`Frame extraction failed: ${error}`);
    } finally {
      // Clean up virtual filesystem
      console.log('Cleaning up FFmpeg virtual filesystem...');
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