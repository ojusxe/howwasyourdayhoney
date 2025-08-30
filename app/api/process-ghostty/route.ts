import { NextRequest, NextResponse } from 'next/server';
import { GhosttyConverter } from '../../../lib/ghosttyConverter';
import { getJobStore } from '../../../lib/jobStore';
import { ErrorHandler } from '../../../lib/errorHandler';
import { getConfig } from '../../../lib/config';

/**
 * Process pre-extracted frames using exact Ghostty logic
 * Frames are extracted client-side using FFmpeg.js, then processed server-side
 */
export async function POST(request: NextRequest) {
  const jobStore = getJobStore();

  try {
    const body = await request.json();
    const { frames } = body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: 'No frames provided. Frames must be extracted client-side.' },
        { status: 400 }
      );
    }

    console.log(`Received ${frames.length} frames for processing`);

    // Validate frame format
    const sampleFrame = frames[0];
    if (!sampleFrame.imageData || !sampleFrame.index !== undefined) {
      return NextResponse.json(
        { error: 'Invalid frame format. Each frame must have imageData and index.' },
        { status: 400 }
      );
    }

    // Create processing job with Ghostty settings
    const jobId = jobStore.createJob({
      frameRate: 24,
      resolutionScale: 1.0,
      characterSet: 'default',
      colorMode: 'twotone',
      background: 'transparent'
    });

    console.log(`Created job ${jobId} for ${frames.length} frames`);

    // Start processing asynchronously
    processFramesGhostty(frames, jobId).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const apiError = ErrorHandler.handleProcessingError(error);
      jobStore.updateJob(jobId, {
        status: 'error',
        error: ErrorHandler.getUserMessage(apiError),
        completedAt: new Date()
      });
    });

    return NextResponse.json({
      jobId,
      message: `Processing ${frames.length} frames with Ghostty converter`,
      frameCount: frames.length,
      settings: {
        fps: 24,
        columns: 100,
        fontRatio: 0.44,
        characters: '·~ox+=*%$@',
        colorDetection: 'blue/white'
      }
    });

  } catch (error) {
    console.error('Process request failed:', error);
    const apiError = ErrorHandler.handleProcessingError(error);
    return NextResponse.json(
      { error: ErrorHandler.getUserMessage(apiError) },
      { status: 500 }
    );
  }
}

/**
 * Process pre-extracted frames using exact Ghostty converter logic
 */
async function processFramesGhostty(frames: any[], jobId: string): Promise<void> {
  const jobStore = getJobStore();
  const startTime = Date.now();
  let step = 'initialization';
  
  try {
    console.log(`Starting Ghostty processing for job ${jobId} with ${frames.length} frames`);
    
    // Initialize converter
    step = 'converter_initialization';
    const converter = new GhosttyConverter();
    
    jobStore.updateJob(jobId, {
      status: 'processing',
      progress: 10,
      totalFrames: frames.length
    });

    // Convert frames to the expected format
    step = 'frame_conversion';
    const extractedFrames = frames.map((frame, index) => ({
      index: frame.index || index,
      timestamp: frame.timestamp || (index / 24), // 24 FPS
      imageData: new Uint8Array(frame.imageData),
      width: frame.width || 100,
      height: frame.height || 44 // Approximate with font ratio
    }));

    // Convert frames to ASCII using exact Ghostty logic
    step = 'ascii_conversion';
    console.log(`Converting ${extractedFrames.length} frames to ASCII for job ${jobId}`);
    
    const asciiFrames = await converter.convertFramesToASCII(extractedFrames);
    
    // Post-process to match Ghostty output format
    step = 'post_processing';
    const processedFrames = asciiFrames.map((frame, index) => {
      const processedContent = converter.postProcessASCII(frame.asciiContent, frame.colorData || []);
      
      // Update progress
      const progress = 10 + ((index + 1) * 85) / asciiFrames.length;
      jobStore.updateJob(jobId, { progress });
      
      return {
        ...frame,
        asciiContent: processedContent
      };
    });

    // Complete the job
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    jobStore.updateJob(jobId, {
      status: 'complete',
      progress: 100,
      frames: processedFrames,
      completedAt: new Date(),
      performanceMetrics: {
        conversionTime: processingTime,
        memoryUsage: process.memoryUsage().heapUsed,
        frameCount: processedFrames.length,
        averageFrameTime: processingTime / processedFrames.length,
        peakMemoryUsage: process.memoryUsage().heapUsed,
        processingSteps: [
          {
            name: 'Frame Processing',
            startTime,
            endTime,
            duration: processingTime,
            memoryBefore: 0,
            memoryAfter: process.memoryUsage().heapUsed
          }
        ]
      }
    });

    console.log(`Job ${jobId} completed successfully in ${processingTime}ms`);
    console.log(`Generated ${processedFrames.length} ASCII frames with Ghostty quality`);

  } catch (error) {
    console.error(`Job ${jobId} failed at step ${step}:`, error);
    const apiError = ErrorHandler.handleProcessingError(error);
    
    jobStore.updateJob(jobId, {
      status: 'error',
      error: `Processing failed at ${step}: ${ErrorHandler.getUserMessage(apiError)}`,
      completedAt: new Date()
    });

    throw error;
  }
}
