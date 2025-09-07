import { NextRequest, NextResponse } from 'next/server';
import { getGhosttyFFmpegWorker } from '@/lib/ffmpegWorker';
import { getServerFFmpegProcessor } from '@/lib/serverFFmpegProcessor';
import { GhosttyConverter } from '@/lib/ghosttyConverter';
import { ASCIIConverter } from '@/lib/asciiConverter';
import { getJobStore } from '@/lib/jobStore';
import { ConversionSettings, ProcessResponse, ErrorType, APIError } from '@/lib/types';
import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { ResourceManager } from '@/lib/performance/ResourceManager';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const settingsJson = formData.get('settings') as string;

    // Validate inputs
    if (!videoFile) {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, 'No video file provided'),
        { status: 400 }
      );
    }

    if (!settingsJson) {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, 'No settings provided'),
        { status: 400 }
      );
    }

    // Check resource availability
    const resourceManager = ResourceManager.getInstance();
    const resourceCheck = resourceManager.canStartJob(videoFile.size);
    
    if (!resourceCheck.allowed) {
      return NextResponse.json(
        createError(ErrorType.PROCESSING_ERROR, resourceCheck.reason!),
        { status: 503 }
      );
    }

    let settings: ConversionSettings;
    try {
      settings = JSON.parse(settingsJson);
    } catch (error) {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, 'Invalid settings format'),
        { status: 400 }
      );
    }

    // Validate settings
    const settingsValidation = validateSettings(settings);
    if (!settingsValidation.valid) {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, settingsValidation.error!),
        { status: 400 }
      );
    }

    // Create job
    const jobStore = getJobStore();
    let jobId: string;
    
    try {
      jobId = jobStore.createJob(settings);
      resourceManager.startJob(jobId);
    } catch (error) {
      return NextResponse.json(
        createError(ErrorType.PROCESSING_ERROR, error instanceof Error ? error.message : 'Failed to create job'),
        { status: 503 }
      );
    }

    // Get performance estimate
    const performanceEstimate = PerformanceMonitor.estimatePerformance(
      videoFile.size,
      30, // Assume 30 seconds average duration
      1920, // Assume HD resolution
      1080,
      settings.frameRate
    );

    // Start processing in background
    processVideoAsync(jobId, videoFile, settings).catch(error => {
      console.error(`Background processing failed for job ${jobId}:`, error);
      jobStore.updateJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed'
      });
      resourceManager.endJob(jobId);
    });

    // Return job ID immediately
    const response: ProcessResponse = {
      jobId,
      totalFrames: 0, // Will be updated during processing
      estimatedTime: Math.round(performanceEstimate.estimatedTime / 1000) // Convert to seconds
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Process API error:', error);
    return NextResponse.json(
      createError(ErrorType.PROCESSING_ERROR, 'Internal server error'),
      { status: 500 }
    );
  }
}

/**
 * Background video processing function with real video processing
 */
async function processVideoAsync(
  jobId: string,
  videoFile: File,
  settings: ConversionSettings
): Promise<void> {
  const jobStore = getJobStore();
  const resourceManager = ResourceManager.getInstance();
  const performanceMonitor = new PerformanceMonitor();

  try {
    // Start performance monitoring
    performanceMonitor.startConversion();
    
    // Update job status
    jobStore.updateJob(jobId, { status: 'processing', progress: 0 });

    console.log(`[Job ${jobId}] Starting video processing...`);
    
    // Convert file to array buffer
    const videoBuffer = await videoFile.arrayBuffer();
    
    // Check if we should use native tools or browser-based processing
    const useNativeProcessing = typeof window === 'undefined'; // Server-side
    
    let extractedFrames;
    
    if (useNativeProcessing) {
      console.log(`[Job ${jobId}] Using native FFmpeg processing`);
      
      const serverProcessor = getServerFFmpegProcessor();
      
      // Check if native tools are available
      const toolsCheck = await serverProcessor.checkNativeToolsAvailability();
      if (!toolsCheck.ffmpeg || !toolsCheck.imagemagick) {
        throw new Error(toolsCheck.error || 'Required native tools not available');
      }
      
      // Process video with progress tracking
      extractedFrames = await serverProcessor.processVideo(
        videoBuffer,
        (current: number, total: number) => {
          const progress = Math.floor((current / total) * 50); // First 50% for frame extraction
          jobStore.updateJob(jobId, { 
            progress, 
            totalFrames: total,
            status: 'processing'
          });
        }
      );
      
    } else {
      console.log(`[Job ${jobId}] Using browser-based FFmpeg processing`);
      
      const ffmpegWorker = getGhosttyFFmpegWorker();
      await ffmpegWorker.initialize();
      
      // Extract frames using FFmpeg.wasm
      extractedFrames = await ffmpegWorker.extractFrames(
        videoBuffer,
        (current: number) => {
          const progress = Math.floor((current / 100) * 50); // Estimate, will be updated
          jobStore.updateJob(jobId, { 
            progress,
            status: 'processing'
          });
        }
      );
    }

    console.log(`[Job ${jobId}] Extracted ${extractedFrames.length} frames`);

    // Update total frames count
    jobStore.updateJob(jobId, { 
      totalFrames: extractedFrames.length,
      progress: 50 // Frame extraction complete
    });

    // Convert frames to ASCII using Ghostty algorithm
    console.log(`[Job ${jobId}] Converting frames to ASCII...`);
    
    performanceMonitor.startStep('ASCII Conversion');
    const ghosttyConverter = new GhosttyConverter();
    
    const asciiFrames = [];
    
    for (let i = 0; i < extractedFrames.length; i++) {
      const frame = extractedFrames[i];
      
      try {
        // Convert single frame using exact Ghostty logic
        const asciiFrame = await ghosttyConverter.convertFramesToASCII([frame]);
        if (asciiFrame.length > 0) {
          asciiFrames.push(asciiFrame[0]);
        }
        
        // Update progress (50% + 40% for ASCII conversion)
        const conversionProgress = Math.floor((i / extractedFrames.length) * 40);
        jobStore.updateJob(jobId, { 
          progress: 50 + conversionProgress,
          status: 'processing'
        });
        
      } catch (error) {
        console.warn(`[Job ${jobId}] Failed to convert frame ${i}:`, error);
      }
    }

    console.log(`[Job ${jobId}] Converted ${asciiFrames.length} frames to ASCII`);

    // Create ZIP archive
    performanceMonitor.startStep('ZIP Creation');
    console.log(`[Job ${jobId}] Creating ZIP archive...`);
    
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add ASCII frames to ZIP
    for (let i = 0; i < asciiFrames.length; i++) {
      const frame = asciiFrames[i];
      const filename = `frame_${String(i + 1).padStart(4, '0')}.txt`;
      zip.file(filename, frame.asciiContent);
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'arraybuffer' });
    const zipBuffer = new Uint8Array(zipBlob);

    // Store the result (simplified for now)
    jobStore.updateJob(jobId, {
      status: 'complete',
      progress: 100,
      frames: asciiFrames
    });

    performanceMonitor.endConversion();
    
    console.log(`[Job ${jobId}] Processing completed:`, {
      frameCount: asciiFrames.length,
      totalSize: zipBuffer.length
    });

  } catch (error) {
    console.error(`[Job ${jobId}] Processing failed:`, error);
    jobStore.updateJob(jobId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Processing failed'
    });
  } finally {
    resourceManager.endJob(jobId);
  }
}

/**
 * Validate conversion settings
 */
function validateSettings(settings: ConversionSettings): { valid: boolean; error?: string } {
  if (!settings) {
    return { valid: false, error: 'Settings object is required' };
  }

  // Validate frame rate
  if (![12, 24].includes(settings.frameRate)) {
    return { valid: false, error: 'Frame rate must be 12 or 24 FPS' };
  }

  // Validate resolution scale
  if (![0.5, 0.75, 1.0].includes(settings.resolutionScale)) {
    return { valid: false, error: 'Resolution scale must be 0.5, 0.75, or 1.0' };
  }

  // Validate character set
  if (!['default', 'custom'].includes(settings.characterSet)) {
    return { valid: false, error: 'Character set must be "default" or "custom"' };
  }

  if (settings.characterSet === 'custom') {
    if (!settings.customCharacters) {
      return { valid: false, error: 'Custom characters required when character set is "custom"' };
    }
    
    const converter = new ASCIIConverter();
    const validation = converter.validateCharacterSet(settings.customCharacters);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }
  }

  return { valid: true };
}

/**
 * Create error response
 */
function createError(type: ErrorType, message: string): APIError {
  return {
    type,
    message,
    timestamp: new Date()
  };
}