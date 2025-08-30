/**
 * Status API route tests
 */

import { GET } from '@/app/api/status/route';
import { NextRequest } from 'next/server';
import { getJobStore } from '@/lib/jobStore';

// Mock dependencies
jest.mock('@/lib/jobStore');

const mockJobStore = {
  getJob: jest.fn()
};

(getJobStore as jest.Mock).mockReturnValue(mockJobStore);

const createMockRequest = (jobId?: string): NextRequest => {
  const url = jobId ? `http://localhost/api/status?jobId=${jobId}` : 'http://localhost/api/status';
  return {
    url
  } as NextRequest;
};

describe('/api/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when jobId is missing', async () => {
    const request = createMockRequest();
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('Job ID is required');
  });

  it('returns 404 when job is not found', async () => {
    mockJobStore.getJob.mockReturnValue(null);
    const request = createMockRequest('non-existent-job');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.message).toContain('Job not found or expired');
  });

  it('returns job status for pending job', async () => {
    const mockJob = {
      id: 'test-job-id',
      status: 'pending',
      progress: 0,
      totalFrames: 100,
      frames: [],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      completedAt: undefined,
      error: undefined,
      performanceMetrics: undefined,
      optimizationRecommendations: undefined
    };

    mockJobStore.getJob.mockReturnValue(mockJob);
    const request = createMockRequest('test-job-id');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.jobId).toBe('test-job-id');
    expect(data.status).toBe('pending');
    expect(data.progress).toBe(0);
    expect(data.totalFrames).toBe(100);
    expect(data.processedFrames).toBe(0);
    expect(data.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(data.completedAt).toBeUndefined();
    expect(data.error).toBeUndefined();
  });

  it('returns job status for processing job', async () => {
    const mockFrames = [
      { index: 0, timestamp: 0, asciiContent: 'frame1', width: 80, height: 24 },
      { index: 1, timestamp: 100, asciiContent: 'frame2', width: 80, height: 24 }
    ];

    const mockJob = {
      id: 'test-job-id',
      status: 'processing',
      progress: 50,
      totalFrames: 100,
      frames: mockFrames,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      completedAt: undefined,
      error: undefined,
      performanceMetrics: undefined,
      optimizationRecommendations: undefined
    };

    mockJobStore.getJob.mockReturnValue(mockJob);
    const request = createMockRequest('test-job-id');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('processing');
    expect(data.progress).toBe(50);
    expect(data.processedFrames).toBe(2);
  });

  it('returns job status for completed job with performance metrics', async () => {
    const mockFrames = Array.from({ length: 100 }, (_, i) => ({
      index: i,
      timestamp: i * 100,
      asciiContent: `frame${i}`,
      width: 80,
      height: 24
    }));

    const mockPerformanceMetrics = {
      conversionTime: 15000,
      memoryUsage: 50 * 1024 * 1024,
      frameCount: 100,
      averageFrameTime: 150,
      peakMemoryUsage: 75 * 1024 * 1024,
      processingSteps: [
        {
          name: 'Frame Extraction',
          startTime: 0,
          endTime: 5000,
          duration: 5000,
          memoryBefore: 25 * 1024 * 1024,
          memoryAfter: 50 * 1024 * 1024
        },
        {
          name: 'ASCII Conversion',
          startTime: 5000,
          endTime: 15000,
          duration: 10000,
          memoryBefore: 50 * 1024 * 1024,
          memoryAfter: 75 * 1024 * 1024
        }
      ]
    };

    const mockJob = {
      id: 'test-job-id',
      status: 'complete',
      progress: 100,
      totalFrames: 100,
      frames: mockFrames,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      completedAt: new Date('2023-01-01T00:00:15Z'),
      error: undefined,
      performanceMetrics: mockPerformanceMetrics,
      optimizationRecommendations: ['Consider reducing frame rate for faster processing']
    };

    mockJobStore.getJob.mockReturnValue(mockJob);
    const request = createMockRequest('test-job-id');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('complete');
    expect(data.progress).toBe(100);
    expect(data.processedFrames).toBe(100);
    expect(data.completedAt).toBe('2023-01-01T00:00:15.000Z');
    
    // Check performance metrics
    expect(data.performanceMetrics).toBeDefined();
    expect(data.performanceMetrics.conversionTime).toBe(15000);
    expect(data.performanceMetrics.memoryUsageMB).toBe(75);
    expect(data.performanceMetrics.averageFrameTime).toBe(150);
    expect(data.performanceMetrics.processingSteps).toHaveLength(2);
    expect(data.performanceMetrics.processingSteps[0].name).toBe('Frame Extraction');
    expect(data.performanceMetrics.processingSteps[0].duration).toBe(5000);
    expect(data.performanceMetrics.processingSteps[0].memoryUsageMB).toBe(25);
    
    // Check optimization recommendations
    expect(data.optimizationRecommendations).toHaveLength(1);
    expect(data.optimizationRecommendations[0]).toContain('reducing frame rate');
  });

  it('returns job status for failed job', async () => {
    const mockJob = {
      id: 'test-job-id',
      status: 'error',
      progress: 25,
      totalFrames: 100,
      frames: [],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      completedAt: undefined,
      error: 'Video processing failed',
      performanceMetrics: undefined,
      optimizationRecommendations: undefined
    };

    mockJobStore.getJob.mockReturnValue(mockJob);
    const request = createMockRequest('test-job-id');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('error');
    expect(data.progress).toBe(25);
    expect(data.error).toBe('Video processing failed');
  });

  it('handles internal server errors gracefully', async () => {
    mockJobStore.getJob.mockImplementation(() => {
      throw new Error('Database error');
    });

    const request = createMockRequest('test-job-id');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.message).toBe('Internal server error');
  });

  it('excludes sensitive data from response', async () => {
    const mockJob = {
      id: 'test-job-id',
      status: 'complete',
      progress: 100,
      totalFrames: 10,
      frames: [
        { 
          index: 0, 
          timestamp: 0, 
          asciiContent: 'sensitive frame data', 
          width: 80, 
          height: 24,
          colorData: [/* sensitive color data */]
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      completedAt: new Date('2023-01-01T00:00:10Z'),
      error: undefined,
      settings: {
        frameRate: 12,
        resolutionScale: 0.75,
        characterSet: 'default',
        colorMode: 'blackwhite',
        background: 'transparent'
      }
    };

    mockJobStore.getJob.mockReturnValue(mockJob);
    const request = createMockRequest('test-job-id');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.frames).toBeUndefined(); // Sensitive frame data should not be included
    expect(data.settings).toBeUndefined(); // Settings should not be included
    expect(data.processedFrames).toBe(1); // But frame count should be included
  });
});