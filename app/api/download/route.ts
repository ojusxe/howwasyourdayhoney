import { NextRequest, NextResponse } from 'next/server';
import { getJobStore } from '@/lib/jobStore';
import { getZipPackager } from '@/lib/zipUtils';
import { ErrorType, APIError } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, 'Job ID is required'),
        { status: 400 }
      );
    }

    const jobStore = getJobStore();
    const job = jobStore.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, 'Job not found or expired'),
        { status: 404 }
      );
    }

    if (job.status !== 'complete') {
      return NextResponse.json(
        createError(ErrorType.VALIDATION_ERROR, `Job is not complete. Current status: ${job.status}`),
        { status: 400 }
      );
    }

    if (!job.frames || job.frames.length === 0) {
      return NextResponse.json(
        createError(ErrorType.PROCESSING_ERROR, 'No frames available for download'),
        { status: 500 }
      );
    }

    // Create ZIP file
    const zipPackager = getZipPackager();
    
    // Validate frames before packaging
    const validation = zipPackager.validateFrames(job.frames);
    if (!validation.valid) {
      console.error(`Frame validation failed for job ${jobId}:`, validation.errors);
      return NextResponse.json(
        createError(ErrorType.PROCESSING_ERROR, `Frame validation failed: ${validation.errors.join(', ')}`),
        { status: 500 }
      );
    }

    const zipBlob = await zipPackager.createZip(job.frames, job.settings, {
      includeReadme: true,
      frameFormat: 'txt'
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ascii-frames-${jobId}-${timestamp}.zip`;

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', zipBlob.size.toString());
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Schedule job cleanup after successful download
    // Give some time for the download to complete
    setTimeout(() => {
      try {
        jobStore.deleteJob(jobId);
        console.log(`Cleaned up job ${jobId} after successful download`);
      } catch (error) {
        console.error(`Failed to cleanup job ${jobId}:`, error);
      }
    }, 30000); // 30 seconds delay

    // Return ZIP file as response
    return new NextResponse(zipBlob.stream(), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      createError(ErrorType.PROCESSING_ERROR, 'Failed to generate download'),
      { status: 500 }
    );
  }
}

/**
 * Handle HEAD requests for download info without generating the file
 */
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return new NextResponse(null, { status: 400 });
    }

    const jobStore = getJobStore();
    const job = jobStore.getJob(jobId);

    if (!job) {
      return new NextResponse(null, { status: 404 });
    }

    if (job.status !== 'complete') {
      return new NextResponse(null, { status: 400 });
    }

    // Estimate ZIP file size
    const estimatedSize = estimateZipSize(job.frames.length, job.settings);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ascii-frames-${jobId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', estimatedSize.toString());

    return new NextResponse(null, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Download HEAD error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * Estimate ZIP file size based on frame count and settings
 */
function estimateZipSize(frameCount: number, settings: any): number {
  // Base size for metadata and README
  let estimatedSize = 10000; // 10KB base

  // Estimate per frame
  const avgFrameSize = settings.resolutionScale === 1.0 ? 2000 : 
                      settings.resolutionScale === 0.75 ? 1500 : 1000;
  
  estimatedSize += frameCount * avgFrameSize;

  // Add color data if applicable
  if (settings.colorMode !== 'blackwhite') {
    estimatedSize += frameCount * 1000; // Additional color data
  }

  // Apply compression estimate (ZIP typically achieves 60-80% compression on text)
  return Math.round(estimatedSize * 0.3); // Assume 70% compression
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