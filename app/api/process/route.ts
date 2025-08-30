import { NextRequest, NextResponse } from 'next/server';
import { getGhosttyFFmpegWorker } from '@/lib/ffmpegWorker';
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

    // For now, skip FFmpeg validation in server environment
    // In production, you would use a server-side video processing library
    console.log('Video validation skipped in server environment');

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
 * Background video processing function (simplified for server environment)
 */
async function processVideoAsync(
  jobId: string,
  videoFile: File,
  settings: ConversionSettings
): Promise<void> {
  const jobStore = getJobStore();
  const asciiConverter = new ASCIIConverter();
  const resourceManager = ResourceManager.getInstance();
  const performanceMonitor = new PerformanceMonitor();

  try {
    // Start performance monitoring
    performanceMonitor.startConversion();
    
    // Update job status
    jobStore.updateJob(jobId, { status: 'processing', progress: 0 });

    // For demonstration purposes, create mock frames
    // In production, you would use a server-side video processing library
    performanceMonitor.startStep('Mock Frame Generation');
    
    const mockFrameCount = Math.floor(Math.random() * 20) + 10; // 10-30 frames
    const asciiFrames = [];
    const characterSet = asciiConverter.getCharacterSet(settings.characterSet, settings.customCharacters);
    
    const conversionOptions = {
      characterSet,
      colorMode: settings.colorMode,
      twoToneColors: settings.twoToneColors,
      background: settings.background,
      colorThreshold: 50
    };

    // Update total frames
    jobStore.updateJob(jobId, { totalFrames: mockFrameCount });

    // Generate mock ASCII frames with authentic Ghostty patterns
    for (let i = 0; i < mockFrameCount; i++) {
      // Create mock image data with exact Ghostty dimensions
      const baseWidth = 100; // OUTPUT_COLUMNS=100 from Ghostty script
      const baseHeight = Math.floor(baseWidth * 0.6); // Reasonable aspect ratio
      const width = Math.floor(baseWidth * settings.resolutionScale);
      const height = Math.floor(baseHeight * settings.resolutionScale * 0.44); // FONT_RATIO=".44"
      const pixelCount = width * height;
      const data = new Uint8ClampedArray(pixelCount * 4);

      // Create patterns that demonstrate Ghostty's exact color detection
      for (let j = 0; j < pixelCount; j++) {
        const baseIndex = j * 4;
        const x = j % width;
        const y = Math.floor(j / width);
        
        let r, g, b;
        
        // Create animated blue regions (exact Ghostty blue: 0,0,230)
        const blueWave = Math.sin((x * 0.1) + (i * 0.3)) * Math.cos((y * 0.1) + (i * 0.2));
        if (blueWave > 0.3) {
          // Vary the blue slightly to test distance tolerance
          const blueVariation = Math.floor(Math.random() * 20) - 10; // ±10 variation
          r = Math.max(0, Math.min(255, 0 + blueVariation));
          g = Math.max(0, Math.min(255, 0 + blueVariation));
          b = Math.max(0, Math.min(255, 230 + blueVariation));
        }
        // Create animated white regions (exact Ghostty white: 215,215,215)
        else if (blueWave < -0.3) {
          const whiteVariation = Math.floor(Math.random() * 30) - 15; // ±15 variation
          r = Math.max(0, Math.min(255, 215 + whiteVariation));
          g = Math.max(0, Math.min(255, 215 + whiteVariation));
          b = Math.max(0, Math.min(255, 215 + whiteVariation));
        }
        // Create moving gradient patterns for other areas
        else {
          const gradientX = (x + i * 2) / width;
          const gradientY = (y + i) / height;
          const intensity = Math.floor(64 + 127 * Math.sin(gradientX * Math.PI) * Math.cos(gradientY * Math.PI));
          r = intensity;
          g = intensity;
          b = intensity;
        }
        
        data[baseIndex] = r;
        data[baseIndex + 1] = g;
        data[baseIndex + 2] = b;
        data[baseIndex + 3] = 255; // A
      }

      const mockImageData: ImageData = {
        data,
        width,
        height,
        colorSpace: 'srgb' as PredefinedColorSpace
      };

      // Convert to ASCII using exact Ghostty logic
      const asciiFrame = asciiConverter.convertFrame(mockImageData, conversionOptions);
      
      // Set frame metadata
      asciiFrame.index = i;
      asciiFrame.timestamp = i / settings.frameRate;
      
      asciiFrames.push(asciiFrame);
      performanceMonitor.recordFrame();

      // Update progress
      const progress = ((i + 1) / mockFrameCount) * 100;
      jobStore.updateJob(jobId, { progress });

      // Add small delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    performanceMonitor.endStep();

    // End performance monitoring and get metrics
    const metrics = performanceMonitor.endConversion();
    const recommendations = performanceMonitor.getOptimizationRecommendations(metrics);

    // Update job with completed frames and performance data
    jobStore.updateJob(jobId, {
      status: 'complete',
      progress: 100,
      frames: asciiFrames,
      performanceMetrics: metrics,
      optimizationRecommendations: recommendations
    });

    resourceManager.endJob(jobId);

    console.log(`Job ${jobId} completed successfully with ${asciiFrames.length} mock frames in ${Math.round(metrics.conversionTime)}ms`);

  } catch (error) {
    console.error(`Processing failed for job ${jobId}:`, error);
    
    jobStore.updateJob(jobId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown processing error'
    });

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

  // Validate color mode
  if (!['blackwhite', 'twotone', 'fullcolor'].includes(settings.colorMode)) {
    return { valid: false, error: 'Color mode must be "blackwhite", "twotone", or "fullcolor"' };
  }

  if (settings.colorMode === 'twotone') {
    if (!settings.twoToneColors || settings.twoToneColors.length !== 2) {
      return { valid: false, error: 'Two-tone colors required when color mode is "twotone"' };
    }
    
    // Validate color format (basic hex check)
    for (const color of settings.twoToneColors) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return { valid: false, error: 'Two-tone colors must be valid hex colors (e.g., #FF0000)' };
      }
    }
  }

  // Validate background
  if (!['transparent', 'black', 'white'].includes(settings.background)) {
    return { valid: false, error: 'Background must be "transparent", "black", or "white"' };
  }

  return { valid: true };
}

/**
 * Estimate processing time based on file size and settings
 */
function estimateProcessingTime(fileSizeBytes: number, settings: ConversionSettings): number {
  // Base time per MB (in seconds)
  const baseTimePerMB = 10;
  
  // Adjustments based on settings
  let multiplier = 1;
  
  // Higher FPS takes longer
  if (settings.frameRate === 24) {
    multiplier *= 1.5;
  }
  
  // Higher resolution takes longer
  if (settings.resolutionScale === 1.0) {
    multiplier *= 1.5;
  } else if (settings.resolutionScale === 0.75) {
    multiplier *= 1.2;
  }
  
  // Color processing takes longer
  if (settings.colorMode === 'fullcolor') {
    multiplier *= 1.3;
  } else if (settings.colorMode === 'twotone') {
    multiplier *= 1.1;
  }

  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  return Math.round(baseTimePerMB * fileSizeMB * multiplier);
}

/**
 * Create standardized error response
 */
function createError(type: ErrorType, message: string, details?: any): APIError {
  return {
    type,
    message,
    details,
    timestamp: new Date()
  };
}