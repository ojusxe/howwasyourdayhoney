import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface NativeGhosttyResult {
  frames: string[];
  estimatedFrames: number;
  success: boolean;
  error?: string;
}

export class NativeGhosttyProcessor {
  private workingDir: string;
  private ffmpegPath: string;
  private magickPath: string;

  constructor() {
    this.workingDir = '';
    // Set the Windows paths for FFmpeg and ImageMagick
    this.ffmpegPath = 'C:\\Users\\Ojus\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0-full_build\\bin';
    this.magickPath = 'C:\\Users\\Ojus\\AppData\\Local\\Microsoft\\WindowsApps';
  }

  async processVideo(videoBuffer: Buffer): Promise<NativeGhosttyResult> {
    try {
      // Create temporary working directory
      this.workingDir = path.join(process.cwd(), 'temp', `ghostty_${Date.now()}`);
      await fs.mkdir(this.workingDir, { recursive: true });

      // Save video to temporary file
      const videoPath = path.join(this.workingDir, 'input.mp4');
      await fs.writeFile(videoPath, videoBuffer);

      console.log(`Processing video: ${videoPath}`);
      console.log(`Working directory: ${this.workingDir}`);

      // Use our custom video-to-terminal function
      const frames = await this.videoToTerminal(videoPath);

      return {
        frames,
        estimatedFrames: frames.length,
        success: true
      };

    } catch (error) {
      console.error('Native Ghostty processing failed:', error);
      return {
        frames: [],
        estimatedFrames: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      // Cleanup
      if (this.workingDir) {
        try {
          await fs.rm(this.workingDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('Failed to cleanup working directory:', cleanupError);
        }
      }
    }
  }

  private async videoToTerminal(videoPath: string): Promise<string[]> {
    const FONT_RATIO = 0.44;
    const OUTPUT_FPS = 24;
    const OUTPUT_COLUMNS = 100;

    // Colors Used (from Ghostty script)
    const BLUE = [0, 0, 230];
    const BLUE_DISTANCE_TOLERANCE = 90;
    const BLUE_MIN_LUMINANCE = 10;
    const BLUE_MAX_LUMINANCE = 21;

    const WHITE = [215, 215, 215];
    const WHITE_DISTANCE_TOLERANCE = 140;
    const WHITE_MIN_LUMINANCE = 165;
    const WHITE_MAX_LUMINANCE = 255;

    const frames: string[] = [];
    
    // Step 1: Generate frame images using FFmpeg
    const frameImagesDir = path.join(this.workingDir, 'frame_images');
    await fs.mkdir(frameImagesDir, { recursive: true });

    // Set PATH to include our tools (Windows format)
    const env = {
      ...process.env,
      PATH: `${this.ffmpegPath};${this.magickPath};${process.env.PATH}`
    };

    console.log('Running FFmpeg to extract frames...');
    
    // FFmpeg command: same as Ghostty script
    const ffmpegCmd = `ffmpeg -loglevel error -i "${videoPath}" -vf "scale=${OUTPUT_COLUMNS}:-2,fps=${OUTPUT_FPS}" "${frameImagesDir}/frame_%04d.png"`;
    
    try {
      await execAsync(ffmpegCmd, { env, cwd: this.workingDir });
      console.log('FFmpeg extraction completed');
    } catch (error) {
      throw new Error(`FFmpeg failed: ${error}`);
    }

    // Step 2: Process each frame
    const frameFiles = await fs.readdir(frameImagesDir);
    const pngFiles = frameFiles.filter(f => f.endsWith('.png')).sort();

    console.log(`Processing ${pngFiles.length} frames...`);

    for (const frameFile of pngFiles) {
      const framePath = path.join(frameImagesDir, frameFile);
      
      try {
        // Step 2a: Squish the image using ImageMagick (font ratio correction)
        const imageHeight = await this.getImageHeight(framePath, env);
        const newHeight = Math.ceil(FONT_RATIO * imageHeight);
        
        console.log(`Processing ${frameFile}: height ${imageHeight} -> ${newHeight}`);
        
        if (newHeight <= 0 || isNaN(newHeight)) {
          console.warn(`Invalid newHeight ${newHeight} for ${frameFile}, skipping squish`);
        } else {
          const squishCmd = `magick "${framePath}" -resize "x${newHeight}!" "${framePath}"`;
          console.log(`Running squish command: ${squishCmd}`);
          await execAsync(squishCmd, { env });
        }

        // Step 2b: Extract pixel data using ImageMagick
        const textPath = path.join(frameImagesDir, frameFile.replace('.png', '_im.txt'));
        const extractCmd = `magick "${framePath}" "${textPath}"`;
        console.log(`Running extract command: ${extractCmd}`);
        await execAsync(extractCmd, { env });

        // Step 2c: Parse the pixel data and convert to ASCII
        const asciiFrame = await this.convertPixelDataToAscii(textPath, {
          BLUE, BLUE_DISTANCE_TOLERANCE, BLUE_MIN_LUMINANCE, BLUE_MAX_LUMINANCE,
          WHITE, WHITE_DISTANCE_TOLERANCE, WHITE_MIN_LUMINANCE, WHITE_MAX_LUMINANCE
        });

        frames.push(asciiFrame);
        
        // Cleanup intermediate files
        await fs.unlink(framePath);
        await fs.unlink(textPath);
        
        console.log(`Processed frame ${frames.length}/${pngFiles.length}`);
        
      } catch (frameError) {
        console.warn(`Failed to process frame ${frameFile}:`, frameError);
      }
    }

    return frames;
  }

  private async getImageHeight(imagePath: string, env: any): Promise<number> {
    try {
      // Use double quotes and ensure proper Windows path handling
      const command = `magick identify -ping -format "%h" "${imagePath}"`;
      console.log(`Running height command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { env });
      console.log(`Height command stdout: "${stdout}"`);
      console.log(`Height command stderr: "${stderr}"`);
      
      // Clean the output - remove any carriage returns, newlines, and whitespace
      const cleanOutput = stdout.replace(/\r?\n/g, '').replace(/\r/g, '').trim();
      const height = parseInt(cleanOutput, 10);
      
      console.log(`Image height for ${path.basename(imagePath)}: ${height} (from "${cleanOutput}")`);
      
      if (isNaN(height) || height <= 0) {
        console.warn(`Invalid height ${height} from output "${cleanOutput}", using default 50`);
        return 50; // Default fallback height
      }
      
      return height;
    } catch (error) {
      console.error(`Failed to get image height for ${imagePath}:`, error);
      return 50; // Default fallback height
    }
  }

  private async convertPixelDataToAscii(textPath: string, colorConfig: any): Promise<string> {
    const content = await fs.readFile(textPath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header line
    
    let asciiFrame = '';
    let currentRow = -1;

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split(' ');
      if (parts.length < 2) continue;

      const xy = parts[0].replace(':', '');
      const rgbMatch = line.match(/\((\d+),(\d+),(\d+)\)/);
      
      if (!xy || !rgbMatch) continue;

      const [column, row] = xy.split(',').map(Number);
      const [, r, g, b] = rgbMatch.map(Number);

      // Add newline for new row
      if (column === 0 && row !== currentRow && currentRow !== -1) {
        asciiFrame += '\n';
      }
      currentRow = row;

      // Convert pixel to character
      const pixel = this.pixelFor([r, g, b], colorConfig);
      asciiFrame += pixel;
    }

    // Apply HTML span formatting and character mapping (like Ghostty script)
    return this.formatAsciiFrame(asciiFrame);
  }

  private pixelFor(rgb: number[], config: any): string {
    const [r, g, b] = rgb;
    
    // Calculate luminance (same formula as Ghostty)
    const luminance = Math.floor(0.2126 * r + 0.7152 * g + 0.0722 * b);
    
    // Calculate color distances
    const blueDistance = this.colorDistance(config.BLUE, rgb);
    const whiteDistance = this.colorDistance(config.WHITE, rgb);
    
    if (blueDistance < config.BLUE_DISTANCE_TOLERANCE) {
      const scaledLuminance = Math.floor((luminance - config.BLUE_MIN_LUMINANCE) * 9 / (config.BLUE_MAX_LUMINANCE - config.BLUE_MIN_LUMINANCE));
      return `B${Math.max(0, Math.min(9, scaledLuminance))}`;
    } else if (whiteDistance < config.WHITE_DISTANCE_TOLERANCE) {
      const scaledLuminance = Math.floor((luminance - config.WHITE_MIN_LUMINANCE) * 9 / (config.WHITE_MAX_LUMINANCE - config.WHITE_MIN_LUMINANCE));
      return `W${Math.max(0, Math.min(9, scaledLuminance))}`;
    } else {
      return ' ';
    }
  }

  private colorDistance(color1: number[], color2: number[]): number {
    return Math.abs(color1[0] - color2[0]) + Math.abs(color1[1] - color2[1]) + Math.abs(color1[2] - color2[2]);
  }

  private formatAsciiFrame(asciiFrame: string): string {
    // Apply formatting like the Ghostty script
    return asciiFrame
      .replace(/(B[0-9](?:B[0-9])*)/g, '<span class="b">$1</span>')
      .replace(/B/g, '')
      .replace(/W/g, '')
      .replace(/0/g, '·')
      .replace(/1/g, '~')
      .replace(/2/g, 'o')
      .replace(/3/g, 'x')
      .replace(/4/g, '+')
      .replace(/5/g, '=')
      .replace(/6/g, '*')
      .replace(/7/g, '%')
      .replace(/8/g, '$')
      .replace(/9/g, '@');
  }
}

export async function processVideoWithNativeGhostty(videoBuffer: Buffer): Promise<NativeGhosttyResult> {
  const processor = new NativeGhosttyProcessor();
  return processor.processVideo(videoBuffer);
}
