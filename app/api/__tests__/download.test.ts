import { GET, HEAD } from '../download/route';
import { NextRequest } from 'next/server';
import { DEFAULT_SETTINGS } from '@/lib/types';

// Mock dependencies
jest.mock('@/lib/jobStore');
jest.mock('@/lib/zipUtils');

const mockJobStore = {
  getJob: jest.fn(),
  deleteJob: jest.fn()
};

const mockZipPackager = {
  validateFrames: jest.fn(),
  createZip: jest.fn()
};

// Mock implementations
require('@/lib/jobStore').getJobStore = jest.fn(() => mockJobStore);
require('@/lib/zipUtils').getZipPackager = jest.fn(() => mockZipPackager);

// Mock setTimeout to avoid delays in tests
jest.useFakeTimers();

describe('/api/download', () => {
  const mockJob = {
    id: 'test-job-id',
    status: 'complete' as const,
    settings: DEFAULT_SETTINGS,
    frames: [
      {
        index: 0,
        timestamp: 0,
        asciiContent: 'test frame',
        width: 10,
        height: 5
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockJobStore.getJob.mockReturnValue(mockJob);
    mockJobStore.deleteJob.mockReturnValue(true);
    mockZipPackager.validateFrames.mockReturnValue({ valid: true, errors: [] });
    mockZipPackager.createZip.mockResolvedValue(new Blob(['test zip content']));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('GET', () => {
    it('should return ZIP file for completed job', async () => {
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id');
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('ascii-frames-test-job-id');
    });

    it('should reject request without job ID', async () => {
      const request = new NextRequest('http://localhost/api/download');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.type).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Job ID is required');
    });

    it('should return 404 for non-existent job', async () => {
      mockJobStore.getJob.mockReturnValue(null);
      
      const request = new NextRequest('http://localhost/api/download?jobId=non-existent');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.type).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Job not found or expired');
    });

    it('should reject incomplete jobs', async () => {
      mockJobStore.getJob.mockReturnValue({
        ...mockJob,
        status: 'processing'
      });
      
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.type).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Job is not complete');
    });

    it('should reject jobs without frames', async () => {
      mockJobStore.getJob.mockReturnValue({
        ...mockJob,
        frames: []
      });
      
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.type).toBe('PROCESSING_ERROR');
      expect(data.message).toContain('No frames available for download');
    });

    it('should handle frame validation errors', async () => {
      mockZipPackager.validateFrames.mockReturnValue({
        valid: false,
        errors: ['Missing frame at index 1']
      });
      
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.type).toBe('PROCESSING_ERROR');
      expect(data.message).toContain('Frame validation failed');
    });

    it('should schedule job cleanup after download', async () => {
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id');
      
      await GET(request);
      
      // Fast-forward timers to trigger cleanup
      jest.advanceTimersByTime(30000);
      
      expect(mockJobStore.deleteJob).toHaveBeenCalledWith('test-job-id');
    });

    it('should handle ZIP creation errors', async () => {
      mockZipPackager.createZip.mockRejectedValue(new Error('ZIP creation failed'));
      
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.type).toBe('PROCESSING_ERROR');
      expect(data.message).toContain('Failed to generate download');
    });
  });

  describe('HEAD', () => {
    it('should return headers for completed job', async () => {
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id', {
        method: 'HEAD'
      });
      
      const response = await HEAD(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Length')).toBeTruthy();
    });

    it('should return 400 for missing job ID', async () => {
      const request = new NextRequest('http://localhost/api/download', {
        method: 'HEAD'
      });
      
      const response = await HEAD(request);
      
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent job', async () => {
      mockJobStore.getJob.mockReturnValue(null);
      
      const request = new NextRequest('http://localhost/api/download?jobId=non-existent', {
        method: 'HEAD'
      });
      
      const response = await HEAD(request);
      
      expect(response.status).toBe(404);
    });

    it('should return 400 for incomplete job', async () => {
      mockJobStore.getJob.mockReturnValue({
        ...mockJob,
        status: 'processing'
      });
      
      const request = new NextRequest('http://localhost/api/download?jobId=test-job-id', {
        method: 'HEAD'
      });
      
      const response = await HEAD(request);
      
      expect(response.status).toBe(400);
    });
  });
});