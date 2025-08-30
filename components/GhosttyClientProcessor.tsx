import { useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface UseGhosttyProcessorProps {
  onFramesExtracted: (frames: any[]) => void;
  onProgress: (progress: number, message: string) => void;
  onError: (error: string) => void;
}

/**
 * Hook for client-side video processing using FFmpeg.js with exact Ghostty settings
 * This solves the server-side FFmpeg.js limitation by running extraction in browser
 */
export const useGhosttyProcessor = ({
  onFramesExtracted,
  onProgress,
  onError
}: UseGhosttyProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);

  const initializeFFmpeg = useCallback(async () => {
    if (ffmpeg) return ffmpeg;

    const newFFmpeg = new FFmpeg();
    
    try {
      onProgress(5, 'Loading FFmpeg...');
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      newFFmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      await newFFmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setFFmpeg(newFFmpeg);
      onProgress(10, 'FFmpeg loaded successfully');
      return newFFmpeg;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to initialize video processing engine');
    }
  }, [ffmpeg, onProgress]);

  const extractFramesWithGhosttySettings = useCallback(async (file: File) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      onProgress(0, 'Starting frame extraction...');
      
      // Initialize FFmpeg
      const ffmpegInstance = await initializeFFmpeg();
      
      onProgress(15, 'Processing video file...');
      
      // Ghostty's exact settings
      const GHOSTTY_OUTPUT_COLUMNS = 100;
      const GHOSTTY_OUTPUT_FPS = 24;
      const inputFileName = 'input.mp4';
      const outputPattern = 'frame_%04d.png';

      // Write input file to FFmpeg filesystem
      await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));
      
      onProgress(25, 'Extracting frames with Ghostty settings...');

      // Build exact Ghostty FFmpeg command
      // Original: ffmpeg -loglevel error -i "$video_file" -vf "scale=$OUTPUT_COLUMNS:-2,fps=$OUTPUT_FPS" "$frame_images_dir/frame_%04d.png"
      const command = [
        '-loglevel', 'info',
        '-i', inputFileName,
        '-vf', `scale=${GHOSTTY_OUTPUT_COLUMNS}:-2,fps=${GHOSTTY_OUTPUT_FPS}`,
        '-y', // Overwrite output files
        outputPattern
      ];

      console.log('Running Ghostty-compatible FFmpeg command:', command.join(' '));
      await ffmpegInstance.exec(command);

      onProgress(70, 'Reading extracted frames...');

      // Read extracted frames
      const frames: any[] = [];
      let frameIndex = 1;

      while (true) {
        try {
          const frameFileName = `frame_${frameIndex.toString().padStart(4, '0')}.png`;
          const frameData = await ffmpegInstance.readFile(frameFileName);
          
          if (frameData instanceof Uint8Array) {
            // Get frame dimensions by parsing PNG header
            const dimensions = parsePNGDimensions(frameData);
            
            frames.push({
              index: frameIndex - 1,
              timestamp: (frameIndex - 1) / GHOSTTY_OUTPUT_FPS,
              imageData: Array.from(frameData), // Convert to regular array for JSON serialization
              width: dimensions.width,
              height: dimensions.height
            });

            // Update progress
            const progressPercent = 70 + (frameIndex * 25) / 300; // Estimate max 300 frames
            onProgress(Math.min(95, progressPercent), `Extracted frame ${frameIndex}...`);

            frameIndex++;
          } else {
            break;
          }
        } catch (error) {
          // No more frames
          break;
        }
      }

      onProgress(100, `Extracted ${frames.length} frames successfully!`);
      console.log(`Extracted ${frames.length} frames using Ghostty settings`);
      
      // Clean up FFmpeg filesystem
      try {
        const files = await ffmpegInstance.listDir('/');
        for (const file of files) {
          if (file.name !== '.' && file.name !== '..') {
            try {
              await ffmpegInstance.deleteFile(file.name);
            } catch (cleanupError) {
              console.warn(`Failed to delete ${file.name}:`, cleanupError);
            }
          }
        }
      } catch (cleanupError) {
        console.warn('Cleanup failed:', cleanupError);
      }

      onFramesExtracted(frames);
      
    } catch (error) {
      console.error('Frame extraction failed:', error);
      onError(`Frame extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, initializeFFmpeg, onFramesExtracted, onProgress, onError]);

  return {
    extractFrames: extractFramesWithGhosttySettings,
    isProcessing
  };
};

/**
 * Parse PNG dimensions from header
 */
function parsePNGDimensions(imageData: Uint8Array): { width: number; height: number } {
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
    return { width: 100, height: 44 };
  }
}

export default useGhosttyProcessor;
