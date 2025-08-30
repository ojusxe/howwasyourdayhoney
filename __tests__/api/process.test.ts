/**
 * Process API route tests
 */

import { POST } from '@/app/api/process/route';
import { NextRequest } from 'next/server';
import { getJobStore } from '@/lib/jobStore';
import { ResourceManager } from '@/lib/performance/ResourceManager';

// Mock dependencies
jest.mock('@/lib/jobStore');
jest.mock('@/lib/ffmpegWorker');
jest.mock('@/lib/performance/ResourceManager');

const mockJobStore = {
  createJob: jest.fn(),
  updateJob: jest.fn(),
  getJob: jest.fn()
};

const mockResourceManager = {
  canStartJob: jest.fn(),
  startJob: jest.fn(),
  endJob: jest.fn()
};

(getJobStore as jest.Mock).mockReturnValue(mockJobStore);
(ResourceManager.getInstance as jest.Mock).mockReturnValue(mockResourceManager);

// Mock FormData
const createMockFormData = (videoFile?: File, settings?: string) => {
  const formData = new FormData();
  if (videoFile) formData.append('video', videoFile);
  if (settings) formData.append('settings', settings);
  return formData;
};

const createMockFile = (name: string, size: number, type: string): File => {
  return new File(['test content'], name, { type });
};

const createMockRequest = (formData: FormData): NextRequest => {
  return {
    formData: () => Promise.resolve(formData)
  } as NextRequest;
};

describe('/api/process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResourceManager.canStartJob.mockReturnValue({ allowed: true });
    mockJobStore.createJob.mockReturnValue('test-job-id');
  });

  it('returns 400 when no video file is provided', async () => {
    const formData = createMockFormData(undefined, '{}');
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('No video file provided');
  });

  it('returns 400 when no settings are provided', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const formData = createMockFormData(videoFile, undefined);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('No settings provided');
  });

  it('returns 400 when settings are invalid JSON', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const formData = createMockFormData(videoFile, 'invalid json');
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('Invalid settings format');
  });

  it('returns 503 when resource check fails', async () => {
    mockResourceManager.canStartJob.mockReturnValue({
      allowed: false,
      reason: 'Maximum concurrent jobs reached'
    });

    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.75,
      characterSet: 'default',
      colorMode: 'blackwhite',
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(503);
    expect(data.message).toContain('Maximum concurrent jobs reached');
  });

  it('returns 400 for invalid frame rate', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 30, // Invalid
      resolutionScale: 0.75,
      characterSet: 'default',
      colorMode: 'blackwhite',
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('Frame rate must be 12 or 24 FPS');
  });

  it('returns 400 for invalid resolution scale', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.3, // Invalid
      characterSet: 'default',
      colorMode: 'blackwhite',
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('Resolution scale must be 0.5, 0.75, or 1.0');
  });

  it('returns 400 for invalid color mode', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.75,
      characterSet: 'default',
      colorMode: 'invalid', // Invalid
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('Color mode must be');
  });

  it('returns 400 when custom characters are missing for custom character set', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.75,
      characterSet: 'custom',
      // customCharacters missing
      colorMode: 'blackwhite',
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('Custom characters required');
  });

  it('returns 400 when two-tone colors are missing for two-tone mode', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.75,
      characterSet: 'default',
      colorMode: 'twotone',
      // twoToneColors missing
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('Two-tone colors required');
  });

  it('returns 400 for invalid hex colors in two-tone mode', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.75,
      characterSet: 'default',
      colorMode: 'twotone',
      twoToneColors: ['invalid', '#FFFFFF'], // Invalid hex
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toContain('valid hex colors');
  });

  it('returns 503 when job creation fails', async () => {
    mockJobStore.createJob.mockImplementation(() => {
      throw new Error('Job creation failed');
    });

    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.75,
      characterSet: 'default',
      colorMode: 'blackwhite',
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(503);
    expect(data.message).toContain('Job creation failed');
  });

  it('successfully creates job with valid inputs', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const settings = JSON.stringify({
      frameRate: 12,
      resolutionScale: 0.75,
      characterSet: 'default',
      colorMode: 'blackwhite',
      background: 'transparent'
    });
    const formData = createMockFormData(videoFile, settings);
    const request = createMockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.jobId).toBe('test-job-id');
    expect(data.totalFrames).toBe(0);
    expect(data.estimatedTime).toBeGreaterThan(0);
    expect(mockJobStore.createJob).toHaveBeenCalled();
    expect(mockResourceManager.startJob).toHaveBeenCalledWith('test-job-id');
  });

  it('handles internal server errors gracefully', async () => {
    const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
    const formData = createMockFormData(videoFile, '{}');
    const request = {
      formData: () => Promise.reject(new Error('Network error'))
    } as NextRequest;
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.message).toBe('Internal server error');
  });
});