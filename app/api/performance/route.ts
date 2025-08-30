import { NextRequest, NextResponse } from 'next/server';
import { PerformanceTests } from '@/lib/performance/PerformanceTests';
import { ResourceManager } from '@/lib/performance/ResourceManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'benchmarks';

    switch (action) {
      case 'benchmarks':
        // Return performance benchmarks
        const benchmarks = PerformanceTests.getPerformanceBenchmarks();
        return NextResponse.json({
          benchmarks,
          timestamp: new Date().toISOString()
        });

      case 'test':
        // Run performance tests (only in development)
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Performance tests are not available in production' },
            { status: 403 }
          );
        }

        const testResults = await PerformanceTests.runAllTests();
        const report = PerformanceTests.generateReport(testResults);

        return NextResponse.json({
          results: testResults,
          report,
          summary: {
            totalTests: testResults.length,
            passedTests: testResults.filter(r => r.passed).length,
            failedTests: testResults.filter(r => !r.passed).length
          },
          timestamp: new Date().toISOString()
        });

      case 'resources':
        // Return current resource usage
        const resourceManager = ResourceManager.getInstance();
        const usage = resourceManager.getCurrentUsage();
        const history = resourceManager.getUsageHistory(30); // Last 30 minutes
        const limits = resourceManager.getLimits();

        return NextResponse.json({
          current: {
            activeJobs: usage.activeJobs,
            memoryUsageMB: Math.round(usage.memoryUsage / 1024 / 1024),
            cpuUsagePercent: Math.round(usage.cpuUsage)
          },
          limits: {
            maxConcurrentJobs: limits.maxConcurrentJobs,
            maxMemoryUsageMB: Math.round(limits.maxMemoryUsage / 1024 / 1024),
            maxJobDurationMinutes: Math.round(limits.maxJobDuration / 60 / 1000)
          },
          history: history.map(h => ({
            timestamp: new Date(h.timestamp).toISOString(),
            activeJobs: h.activeJobs,
            memoryUsageMB: Math.round(h.memoryUsage / 1024 / 1024),
            cpuUsagePercent: Math.round(h.cpuUsage)
          })),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: benchmarks, test, or resources' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      {
        error: 'Performance API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'updateLimits':
        // Update resource limits (only in development)
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Resource limit updates are not available in production' },
            { status: 403 }
          );
        }

        const resourceManager = ResourceManager.getInstance();
        const { maxConcurrentJobs, maxMemoryUsageMB, maxJobDurationMinutes } = params;

        const newLimits: any = {};
        if (maxConcurrentJobs !== undefined) {
          newLimits.maxConcurrentJobs = Math.max(1, Math.min(10, maxConcurrentJobs));
        }
        if (maxMemoryUsageMB !== undefined) {
          newLimits.maxMemoryUsage = Math.max(50, Math.min(1000, maxMemoryUsageMB)) * 1024 * 1024;
        }
        if (maxJobDurationMinutes !== undefined) {
          newLimits.maxJobDuration = Math.max(1, Math.min(30, maxJobDurationMinutes)) * 60 * 1000;
        }

        resourceManager.updateLimits(newLimits);

        return NextResponse.json({
          message: 'Resource limits updated',
          newLimits: resourceManager.getLimits(),
          timestamp: new Date().toISOString()
        });

      case 'cleanup':
        // Force cleanup of expired jobs
        const cleanedJobs = ResourceManager.getInstance().cleanupExpiredJobs();
        
        return NextResponse.json({
          message: 'Cleanup completed',
          cleanedJobs: cleanedJobs.length,
          jobIds: cleanedJobs,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: updateLimits or cleanup' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance API POST error:', error);
    return NextResponse.json(
      {
        error: 'Performance API operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}