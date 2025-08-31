import { NextRequest, NextResponse } from 'next/server';
import { getJobStore } from '@/lib/jobStore';
import { ErrorType, APIError } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const includeFrames = searchParams.get('includeFrames') === 'true';

    if (!jobId) {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, 'Job ID is required'),
        { status: 400 }
      );
    }

    const jobStore = getJobStore();
    const job = jobStore.getJob(jobId);

    console.log(`Status API: Looking for job ${jobId}`);
    console.log(`Available jobs:`, jobStore.getActiveJobs().map(j => j.id));

    if (!job) {
      console.log(`Job ${jobId} not found or expired`);
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, `Job not found or expired. JobId: ${jobId}`),
        { status: 404 }
      );
    }

    // Return job status without sensitive data
    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      totalFrames: job.totalFrames || 0,
      processedFrames: job.frames.length,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error,
      zipPath: job.zipPath, // Include ZIP path for download
      frameFiles: job.frameFiles?.length || 0, // Count of frame files
      statistics: job.statistics, // Include processing statistics
      ...(includeFrames && job.status === 'complete' && job.frames.length > 0 ? {
        frames: job.frames.slice(0, 10) // Only include first 10 frames for preview
      } : {}),
      performanceMetrics: job.performanceMetrics ? {
        conversionTime: Math.round(job.performanceMetrics.conversionTime),
        memoryUsageMB: Math.round(job.performanceMetrics.peakMemoryUsage / 1024 / 1024),
        averageFrameTime: Math.round(job.performanceMetrics.averageFrameTime),
        processingSteps: job.performanceMetrics.processingSteps.map(step => ({
          name: step.name,
          duration: Math.round(step.duration),
          memoryUsageMB: Math.round((step.memoryAfter - step.memoryBefore) / 1024 / 1024)
        }))
      } : undefined,
      optimizationRecommendations: job.optimizationRecommendations
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      createError(ErrorType.PROCESSING_ERROR, 'Internal server error'),
      { status: 500 }
    );
  }
}

function createError(type: ErrorType, message: string, details?: any): APIError {
  return {
    type,
    message,
    details,
    timestamp: new Date()
  };
}