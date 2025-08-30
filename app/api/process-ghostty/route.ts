import { NextRequest, NextResponse } from 'next/server';
import { GhosttyConverter } from '../../../lib/ghosttyConverter';
import { getGhosttyFFmpegWorker } from '../../../lib/ffmpegWorker';
import { getJobStore } from '../../../lib/jobStore';
import { ErrorHandler } from '../../../lib/errorHandler';
import { getConfig } from '../../../lib/config';

/**
 * Refined video processing endpoint using exact Ghostty logic
 * No user configuration options - optimized for highest quality output
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

    // Validate file
    const ffmpegWorker = getGhosttyFFmpegWorker();
    const validation = await ffmpegWorker.validateVideo(file);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create processing job with Ghostty settings (no user options)
    const jobId = jobStore.createJob({
      // Fixed Ghostty settings for highest quality
      frameRate: 24, // Ghostty's OUTPUT_FPS
      resolutionScale: 1.0, // Always full resolution for best quality
      characterSet: 'default', // Always use Ghostty characters
      colorMode: 'twotone', // Ghostty uses blue/white detection
      background: 'transparent'
    });

    console.log(`Created job ${jobId} with Ghostty settings`);

    // Start processing asynchronously
    processVideoGhostty(file, jobId).catch(error => {
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
      message: 'Video processing started with Ghostty settings',
      estimatedFrames: Math.ceil(config.maxVideoDuration * 24), // 24 FPS max
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
 * Process video using exact Ghostty converter logic
 */
async function processVideoGhostty(file: File, jobId: string): Promise<void> {
  const jobStore = getJobStore();
  const startTime = Date.now();
  let step = 'initialization';
  
  try {
    console.log(`Starting Ghostty processing for job ${jobId}`);
    
    // Initialize converter and FFmpeg worker
    step = 'converter_initialization';
    const converter = new GhosttyConverter();
    const ffmpegWorker = getGhosttyFFmpegWorker();
    await ffmpegWorker.initialize();
    
    jobStore.updateJob(jobId, {
      status: 'processing',
      progress: 10
    });

    // Extract frames using Ghostty settings
    step = 'frame_extraction';
    console.log(`Extracting frames with Ghostty settings for job ${jobId}`);
    
    const videoBuffer = await file.arrayBuffer();
    
    const frames = await ffmpegWorker.extractFrames(
      videoBuffer,
      (frameCount) => {
        const progress = Math.min(50, 10 + (frameCount * 40) / 100); // Estimate max 100 frames
        jobStore.updateJob(jobId, { progress });
      }
    );

    console.log(`Extracted ${frames.length} frames for job ${jobId}`);
    
    jobStore.updateJob(jobId, {
      status: 'processing',
      progress: 50,
      totalFrames: frames.length
    });

    // Convert frames to ASCII using exact Ghostty logic
    step = 'ascii_conversion';
    console.log(`Converting ${frames.length} frames to ASCII for job ${jobId}`);
    
    const asciiFrames = await converter.convertFramesToASCII(frames);
    
    // Post-process to match Ghostty output format
    step = 'post_processing';
    const processedFrames = asciiFrames.map((frame, index) => {
      const processedContent = converter.postProcessASCII(frame.asciiContent, frame.colorData || []);
      
      // Update progress
      const progress = 50 + ((index + 1) * 45) / asciiFrames.length;
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
            name: 'Total Processing',
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

    // Cleanup
    await ffmpegWorker.cleanup();

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
