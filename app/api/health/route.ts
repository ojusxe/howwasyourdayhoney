import { NextResponse } from 'next/server';
import { ResourceManager } from '@/lib/performance/ResourceManager';

export async function GET() {
  try {
    const resourceManager = ResourceManager.getInstance();
    
    // Get current system health
    const healthStatus = resourceManager.getHealthStatus();
    const currentUsage = resourceManager.getCurrentUsage();
    const usageHistory = resourceManager.getUsageHistory(10); // Last 10 minutes
    const limits = resourceManager.getLimits();

    // Check for expired jobs
    const expiredJobs = resourceManager.getExpiredJobs();
    
    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      system: {
        health: healthStatus.details,
        limits: {
          maxConcurrentJobs: limits.maxConcurrentJobs,
          maxMemoryUsageMB: Math.round(limits.maxMemoryUsage / 1024 / 1024),
          maxJobDurationMinutes: Math.round(limits.maxJobDuration / 60 / 1000),
          maxVideoSizeMB: Math.round(limits.maxVideoSize / 1024 / 1024)
        },
        current: {
          activeJobs: currentUsage.activeJobs,
          memoryUsageMB: Math.round(currentUsage.memoryUsage / 1024 / 1024),
          cpuUsagePercent: Math.round(currentUsage.cpuUsage)
        }
      },
      performance: {
        usageHistory: usageHistory.map(usage => ({
          timestamp: new Date(usage.timestamp).toISOString(),
          activeJobs: usage.activeJobs,
          memoryUsageMB: Math.round(usage.memoryUsage / 1024 / 1024),
          cpuUsagePercent: Math.round(usage.cpuUsage)
        })),
        expiredJobs: expiredJobs.length,
        retryDelaySeconds: Math.round(resourceManager.getRetryDelay() / 1000)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const resourceManager = ResourceManager.getInstance();
    
    // Force cleanup of expired jobs
    const cleanedJobs = resourceManager.cleanupExpiredJobs();
    
    return NextResponse.json({
      message: 'Cleanup completed',
      cleanedJobs: cleanedJobs.length,
      jobIds: cleanedJobs
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}