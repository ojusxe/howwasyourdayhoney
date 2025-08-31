import { NextRequest, NextResponse } from 'next/server';
import { getJobStore } from '@/lib/jobStore';
import { processVideoWithNativeGhostty } from '@/lib/nativeGhosttyProcessor';
import { ErrorHandler } from '@/lib/errorHandler';
import { getConfig } from '@/lib/config';

/**
 * Native Ghostty video processing endpoint using system FFmpeg and ImageMagick
 * Runs the original Ghostty bash script logic in Node.js
 */
export async function POST(request: NextRequest) {
  const jobStore = getJobStore();
  const config = getConfig();

  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Basic file validation
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a video file.' },
        { status: 400 }
      );
    }

    // Create processing job with Ghostty settings
    const jobId = jobStore.createJob({
      frameRate: 24, // Ghostty's OUTPUT_FPS
      resolutionScale: 1.0, // Always full resolution
      characterSet: 'default', // Ghostty characters: ·~ox+=*%$@
      colorMode: 'twotone', // Blue/white detection
      background: 'transparent'
    });

    console.log(`Created native Ghostty job ${jobId}`);

    // Start processing asynchronously
    processVideoNativeGhostty(file, jobId).catch(error => {
      console.error(`Native Ghostty job ${jobId} failed:`, error);
      const apiError = ErrorHandler.handleProcessingError(error);
      jobStore.updateJob(jobId, {
        status: 'error',
        error: ErrorHandler.getUserMessage(apiError),
        completedAt: new Date()
      });
    });

    return NextResponse.json({
      jobId,
      message: 'Video processing started with native Ghostty',
      estimatedFrames: Math.ceil((config.maxVideoDuration || 10) * 24), // 24 FPS
      settings: {
        processor: 'native_ghostty',
        fps: 24,
        columns: 100,
        fontRatio: 0.44,
        characters: '·~ox+=*%$@',
        colorDetection: 'blue/white',
        tools: 'system_ffmpeg_imagemagick'
      }
    });

  } catch (error) {
    console.error('Native Ghostty process request failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const apiError = ErrorHandler.handleProcessingError(error);
    return NextResponse.json(
      { error: ErrorHandler.getUserMessage(apiError) },
      { status: 500 }
    );
  }
}

/**
 * Process video using native Ghostty processor (system FFmpeg + ImageMagick)
 */
async function processVideoNativeGhostty(file: File, jobId: string): Promise<void> {
  const jobStore = getJobStore();
  const startTime = Date.now();
  let step = 'initialization';
  
  try {
    console.log(`Starting native Ghostty processing for job ${jobId}`);
    
    jobStore.updateJob(jobId, {
      status: 'processing',
      progress: 5
    });

    // Convert file to buffer
    step = 'file_conversion';
    console.log(`Converting file to buffer for job ${jobId}`);
    const videoBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(videoBuffer);
    
    jobStore.updateJob(jobId, {
      status: 'processing',
      progress: 10
    });

    // Process with native Ghostty processor
    step = 'native_processing';
    console.log(`Running native Ghostty processor for job ${jobId}`);
    
    const result = await processVideoWithNativeGhostty(buffer);
    
    if (!result.success) {
      throw new Error(result.error || 'Native Ghostty processing failed');
    }

    console.log(`Native Ghostty processing completed: ${result.frames.length} frames`);
    
    jobStore.updateJob(jobId, {
      status: 'processing',
      progress: 90
    });

    // Format frames for the frontend
    step = 'frame_formatting';
    const formattedFrames = result.frames.map((frameContent, index) => ({
      index: index,
      frameNumber: index + 1,
      asciiContent: frameContent,
      timestamp: (index / 24) * 1000, // Convert to milliseconds
      width: 100, // Ghostty's OUTPUT_COLUMNS
      height: Math.ceil(frameContent.split('\n').length), // Count lines
      colorData: [] // Color data is already embedded in HTML spans
    }));

    // Complete the job
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    jobStore.updateJob(jobId, {
      status: 'complete',
      progress: 100,
      frames: formattedFrames,
      totalFrames: formattedFrames.length,
      completedAt: new Date(),
      performanceMetrics: {
        conversionTime: processingTime,
        memoryUsage: process.memoryUsage().heapUsed,
        frameCount: formattedFrames.length,
        averageFrameTime: processingTime / formattedFrames.length,
        peakMemoryUsage: process.memoryUsage().heapUsed,
        processingSteps: [
          {
            name: 'Native Ghostty Processing',
            startTime,
            endTime,
            duration: processingTime,
            memoryBefore: 0,
            memoryAfter: process.memoryUsage().heapUsed
          }
        ]
      }
    });

    console.log(`Native Ghostty job ${jobId} completed successfully in ${processingTime}ms`);
    console.log(`Generated ${formattedFrames.length} ASCII frames using native tools`);

  } catch (error) {
    console.error(`Native Ghostty job ${jobId} failed at step ${step}:`, error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    const apiError = ErrorHandler.handleProcessingError(error);
    
    jobStore.updateJob(jobId, {
      status: 'error',
      error: `Native processing failed at ${step}: ${ErrorHandler.getUserMessage(apiError)}`,
      completedAt: new Date()
    });

    throw error;
  }
}
