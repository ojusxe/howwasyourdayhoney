import { NextResponse } from 'next/server';
import { getJobStore } from '@/lib/jobStore';

export async function GET() {
  try {
    const jobStore = getJobStore();
    const activeJobs = jobStore.getActiveJobs();
    
    const debugInfo = {
      totalActiveJobs: activeJobs.length,
      jobs: activeJobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        totalFrames: job.totalFrames,
        processedFrames: job.frames?.length || 0,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error
      }))
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}
