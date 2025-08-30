import { POST } from '../process/route';
import { NextRequest } from 'next/server';
import { DEFAULT_SETTINGS } from '@/lib/types';

// Mock dependencies
jest.mock('@/lib/ffmpegWorker');
jest.mock('@/lib/asciiConverter');
jest.mock('@/lib/jobStore');

const mockFFmpegWorker = {
  validateVideo: jest.fn(),
  extractFrames: jest.fn(),
  cleanup: jest.fn()
};

const mockASCIIConverter = {
  getCharacterSet: jest.fn(),
  validateCharacterSet: jest.fn(),
  createImageDataFromPNG: jest.fn(),
  convertFrame: jest.fn()
};

const mockJobStore = {
  createJob: jest.fn(),
  updateJob: jest.fn(),
  getJob: jest.fn()
};

// Mock implementations
require('@/lib/ffmpegWorker').getFFmpegWorker = jest.fn(() => mockFFmpegWorker);
require('@/lib/asciiConverter').ASCIIConverter = jest.fn(() => mockASCIIConverter);
require('@/lib/jobStore').getJobStore = jest.fn(() => mockJobStore);

describe('/api/process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockFFmpegWorker.validateVideo.mockResolvedValue({ valid: true });
    mockFFmpegWorker.extractFrames.mockResolvedValue([
      {
        index: 0,
        timestamp: 0,
        imageData: new Uint8Array([1, 2, 3, 4]),
        width: 10,
        height: 10
      }
    ]);
    mockFFmpegWorker.cleanup.mockResolvedValue(undefined);
    
    mockASCIIConverter.getCharacterSet.mockReturnValue(' .:-=+*#%@');
    mockASCIIConverter.validateCharacterSet.mockReturnValue({ valid: true });
    mockASCIIConverter.createImageDataFromPNG.mockResolvedValue(new ImageData(10, 10));
    mockASCIIConverter.convertFrame.mockReturnValue({
      index: 0,
      timestamp: 0,
      asciiContent: 'test',
      width: 10,
      height: 10
    });
    
    mockJobStore.createJob.mockReturnValue('test-job-id');
    mockJobStore.updateJob.mockReturnValue(true);
  });

  it('should accept valid video and settings', async () => {
    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.mp4', { type: 'video/mp4' }));
    formData.append('settings', JSON.stringify(DEFAULT_SETTINGS));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobId).toBe('test-job-id');
    expect(data.estimatedTime).toBeGreaterThan(0);
  });

  it('should reject request without video file', async () => {
    const formData = new FormData();
    formData.append('settings', JSON.stringify(DEFAULT_SETTINGS));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.type).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('No video file provided');
  });

  it('should reject request without settings', async () => {
    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.mp4', { type: 'video/mp4' }));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.type).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('No settings provided');
  });

  it('should reject invalid settings format', async () => {
    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.mp4', { type: 'video/mp4' }));
    formData.append('settings', 'invalid-json');

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.type).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('Invalid settings format');
  });

  it('should reject invalid video file', async () => {
    mockFFmpegWorker.validateVideo.mockResolvedValue({
      valid: false,
      error: 'Invalid video format'
    });

    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.avi', { type: 'video/avi' }));
    formData.append('settings', JSON.stringify(DEFAULT_SETTINGS));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.type).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Invalid video format');
  });

  it('should handle job creation failure', async () => {
    mockJobStore.createJob.mockImplementation(() => {
      throw new Error('Maximum concurrent jobs limit reached');
    });

    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.mp4', { type: 'video/mp4' }));
    formData.append('settings', JSON.stringify(DEFAULT_SETTINGS));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.type).toBe('PROCESSING_ERROR');
    expect(data.message).toContain('Maximum concurrent jobs limit reached');
  });

  it('should validate frame rate settings', async () => {
    const invalidSettings = {
      ...DEFAULT_SETTINGS,
      frameRate: 30 as any // Invalid frame rate
    };

    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.mp4', { type: 'video/mp4' }));
    formData.append('settings', JSON.stringify(invalidSettings));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.type).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('Frame rate must be 12 or 24 FPS');
  });

  it('should validate custom character set', async () => {
    mockASCIIConverter.validateCharacterSet.mockReturnValue({
      valid: false,
      error: 'Character set too short'
    });

    const invalidSettings = {
      ...DEFAULT_SETTINGS,
      characterSet: 'custom' as const,
      customCharacters: 'a'
    };

    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.mp4', { type: 'video/mp4' }));
    formData.append('settings', JSON.stringify(invalidSettings));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.type).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Character set too short');
  });

  it('should validate two-tone color settings', async () => {
    const invalidSettings = {
      ...DEFAULT_SETTINGS,
      colorMode: 'twotone' as const,
      twoToneColors: ['invalid-color', '#FF0000'] as [string, string]
    };

    const formData = new FormData();
    formData.append('video', new File(['test'], 'test.mp4', { type: 'video/mp4' }));
    formData.append('settings', JSON.stringify(invalidSettings));

    const request = new NextRequest('http://localhost/api/process', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.type).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('Two-tone colors must be valid hex colors');
  });
});