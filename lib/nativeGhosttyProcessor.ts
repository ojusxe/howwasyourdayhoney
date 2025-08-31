import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { ZipPackager } from './zipUtils';
import { ASCIIFrame } from './types';

const execAsync = promisify(exec);

export interface NativeGhosttyResult {
  frames: string[];
  estimatedFrames: number;
  success: boolean;
  error?: string;
  zipPath?: string;
  frameFiles: string[];
  statistics: {
    totalFrames: number;
    processingTime: number;
    averageFrameSize: number;
  };
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

  async processVideo(videoBuffer: Buffer, onProgress?: (progress: number, message: string) => void): Promise<NativeGhosttyResult> {
    const startTime = Date.now();
    let frameFiles: string[] = [];
    
    try {
      // Create temporary working directory
      this.workingDir = path.join(process.cwd(), 'temp', `ghostty_${Date.now()}`);
      await fs.mkdir(this.workingDir, { recursive: true });

      onProgress?.(5, 'Setting up workspace...');

      // Save video to temporary file
      const videoPath = path.join(this.workingDir, 'input.mp4');
      await fs.writeFile(videoPath, videoBuffer);

      console.log(`Processing video: ${videoPath}`);
      console.log(`Working directory: ${this.workingDir}`);

      onProgress?.(10, 'Extracting frames with FFmpeg...');

      // Use our custom video-to-terminal function with progress tracking
      const { frames, txtFiles } = await this.videoToTerminalWithFiles(videoPath, onProgress);
      frameFiles = txtFiles;

      onProgress?.(90, 'Creating ZIP archive...');

      // Create ZIP file with ASCII frames
      const zipPath = await this.createZipArchive(txtFiles, frames);

      onProgress?.(95, 'Finalizing...');

      const processingTime = Date.now() - startTime;
      const averageFrameSize = frames.reduce((sum: number, frame: string) => sum + frame.length, 0) / frames.length;

      console.log(`Generated ${frames.length} frames`);
      console.log('Sample frame (first 200 chars):', frames[0] ? frames[0].substring(0, 200) : 'NO FRAMES');

      onProgress?.(100, 'Processing complete!');

      return {
        frames,
        estimatedFrames: frames.length,
        success: true,
        zipPath,
        frameFiles,
        statistics: {
          totalFrames: frames.length,
          processingTime,
          averageFrameSize: Math.round(averageFrameSize)
        }
      };

    } catch (error) {
      console.error('Native Ghostty processing failed:', error);
      return {
        frames: [],
        estimatedFrames: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        frameFiles,
        statistics: {
          totalFrames: 0,
          processingTime: Date.now() - startTime,
          averageFrameSize: 0
        }
      };
    } finally {
      // Cleanup PNG files but keep TXT files and ZIP
      if (this.workingDir) {
        try {
          await this.cleanupPngFiles();
        } catch (cleanupError) {
          console.warn('Cleanup failed:', cleanupError);
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
        console.log(`Converting ${frameFile} to ASCII...`);
        const asciiFrame = await this.convertPixelDataToAscii(textPath, {
          BLUE, BLUE_DISTANCE_TOLERANCE, BLUE_MIN_LUMINANCE, BLUE_MAX_LUMINANCE,
          WHITE, WHITE_DISTANCE_TOLERANCE, WHITE_MIN_LUMINANCE, WHITE_MAX_LUMINANCE
        });

        console.log(`ASCII frame length: ${asciiFrame.length}, first 100 chars: ${asciiFrame.substring(0, 100)}`);
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

  /**
   * Enhanced video processing that creates TXT files and tracks progress
   */
  private async videoToTerminalWithFiles(videoPath: string, onProgress?: (progress: number, message: string) => void): Promise<{ frames: string[], txtFiles: string[] }> {
    const frames: string[] = [];
    const txtFiles: string[] = [];
    
    // Create directories
    const frameImagesDir = path.join(this.workingDir, 'frame_images');
    const asciiFramesDir = path.join(this.workingDir, 'ascii_frames');
    await fs.mkdir(frameImagesDir, { recursive: true });
    await fs.mkdir(asciiFramesDir, { recursive: true });

    // Set up environment paths
    const env = {
      ...process.env,
      PATH: `${this.ffmpegPath};${this.magickPath};${process.env.PATH}`
    };

    onProgress?.(15, 'Extracting frames with FFmpeg...');

    // FFmpeg extraction
    const ffmpegCmd = `ffmpeg -loglevel error -i "${videoPath}" -vf "scale=100:-2,fps=24" "${frameImagesDir}/frame_%04d.png"`;
    
    try {
      await execAsync(ffmpegCmd, { env, cwd: this.workingDir });
      console.log('FFmpeg extraction completed');
    } catch (error) {
      throw new Error(`FFmpeg failed: ${error}`);
    }

    // Get all PNG files
    const frameFiles = await fs.readdir(frameImagesDir);
    const pngFiles = frameFiles.filter(f => f.endsWith('.png')).sort();

    console.log(`Processing ${pngFiles.length} frames...`);

    const colorConfig = {
      BLUE: [0, 0, 230],
      BLUE_DISTANCE_TOLERANCE: 80,
      BLUE_MIN_LUMINANCE: 50,
      BLUE_MAX_LUMINANCE: 120,
      WHITE: [215, 215, 215],
      WHITE_DISTANCE_TOLERANCE: 120,
      WHITE_MIN_LUMINANCE: 50,
      WHITE_MAX_LUMINANCE: 255
    };

    // Process each frame
    for (let i = 0; i < pngFiles.length; i++) {
      const frameFile = pngFiles[i];
      const framePath = path.join(frameImagesDir, frameFile);
      
      try {
        // Update progress
        const progress = 20 + Math.floor((i / pngFiles.length) * 65); // 20% to 85%
        onProgress?.(progress, `Processing frame ${i + 1}/${pngFiles.length}...`);

        // Squish the image
        const imageHeight = await this.getImageHeight(framePath, env);
        const newHeight = Math.ceil(0.44 * imageHeight); // Font ratio
        
        if (newHeight > 0 && !isNaN(newHeight)) {
          const squishCmd = `magick "${framePath}" -resize "x${newHeight}!" "${framePath}"`;
          await execAsync(squishCmd, { env });
        }

        // Extract pixel data
        const textPath = path.join(frameImagesDir, frameFile.replace('.png', '_im.txt'));
        const extractCmd = `magick "${framePath}" "${textPath}"`;
        await execAsync(extractCmd, { env });

        // Convert to ASCII
        const asciiFrame = await this.convertPixelDataToAscii(textPath, colorConfig);
        frames.push(asciiFrame);

        // Save ASCII frame to TXT file
        const frameNumber = frameFile.match(/frame_(\d+)\.png/)?.[1] || String(i + 1).padStart(4, '0');
        const asciiFilePath = path.join(asciiFramesDir, `frame_${frameNumber}.txt`);
        await fs.writeFile(asciiFilePath, asciiFrame, 'utf-8');
        txtFiles.push(asciiFilePath);

        // Clean up intermediate files
        await fs.unlink(textPath);
        
        console.log(`Processed frame ${i + 1}/${pngFiles.length}: ${asciiFilePath}`);
        
      } catch (frameError) {
        console.warn(`Failed to process frame ${frameFile}:`, frameError);
      }
    }

    return { frames, txtFiles };
  }

  /**
   * Create ZIP archive with ASCII TXT files
   */
  private async createZipArchive(txtFiles: string[], frames: string[]): Promise<string> {
    const zipPackager = new ZipPackager();
    
    // Convert file paths to ASCIIFrame objects
    const asciiFrames: ASCIIFrame[] = txtFiles.map((filePath, index) => ({
      index,
      frameNumber: index + 1,
      asciiContent: frames[index] || '',
      timestamp: (index / 24) * 1000, // 24 FPS
      width: 100,
      height: frames[index] ? frames[index].split('\n').length : 44,
      colorData: []
    }));

    // Create ZIP
    const zipBlob = await zipPackager.createZip(asciiFrames, {
      frameRate: 24,
      resolutionScale: 1.0,
      characterSet: 'custom',
      customCharacters: '·~ox+=*%$@',
      colorMode: 'twotone',
      twoToneColors: ['#0000e6', '#d7d7d7'],
      background: 'transparent'
    });

    // Save ZIP to file
    const zipPath = path.join(this.workingDir, 'ascii_frames.zip');
    const zipBuffer = Buffer.from(await zipBlob.arrayBuffer());
    await fs.writeFile(zipPath, zipBuffer);

    console.log(`Created ZIP archive: ${zipPath}`);
    return zipPath;
  }

  /**
   * Clean up PNG files but keep TXT files and ZIP
   */
  private async cleanupPngFiles(): Promise<void> {
    try {
      const frameImagesDir = path.join(this.workingDir, 'frame_images');
      const files = await fs.readdir(frameImagesDir);
      
      for (const file of files) {
        if (file.endsWith('.png')) {
          await fs.unlink(path.join(frameImagesDir, file));
        }
      }
      
      console.log('Cleaned up PNG files');
    } catch (error) {
      console.warn('Failed to cleanup PNG files:', error);
    }
  }
}

export async function processVideoWithNativeGhostty(videoBuffer: Buffer, onProgress?: (progress: number, message: string) => void): Promise<NativeGhosttyResult> {
  const processor = new NativeGhosttyProcessor();
  return processor.processVideo(videoBuffer, onProgress);
}
