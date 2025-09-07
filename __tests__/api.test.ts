/**
 * API Integration Tests
 * Tests the main API endpoints for video processing workflow
 */

import { NextRequest } from 'next/server';
import { POST as processPOST } from '@/app/api/process/route';
import { DEFAULT_SETTINGS } from '@/lib/types';

// Mock the serverFFmpegProcessor
jest.mock('@/lib/serverFFmpegProcessor', () => ({
  getServerFFmpegProcessor: () => ({
    processVideo: jest.fn().mockResolvedValue({
      frames: [
        {
          index: 0,
          timestamp: 0,
          asciiContent: 'mock ascii frame 1',
          width: 100,
          height: 20
        },
        {
          index: 1,
          timestamp: 0.042,
          asciiContent: 'mock ascii frame 2',
          width: 100,
          height: 20
        }
      ],
      totalFrames: 2,
      settings: DEFAULT_SETTINGS
    })
  })
}));

// Mock ghosttyConverter
jest.mock('@/lib/ghosttyConverter', () => ({
  GhosttyConverter: jest.fn().mockImplementation(() => ({
    convertFrame: jest.fn().mockResolvedValue({
      index: 0,
      timestamp: 0,
      asciiContent: 'mock ascii content',
      width: 100,
      height: 20
    })
  }))
}));

describe('API Integration', () => {
  describe('/api/process', () => {
    it('should accept video upload and start processing', async () => {
      const formData = new FormData();
      formData.append('video', new File(['mock video'], 'test.mp4', { type: 'video/mp4' }));
      formData.append('settings', JSON.stringify(DEFAULT_SETTINGS));

      const request = new NextRequest('http://localhost:3000/api/process', {
        method: 'POST',
        body: formData,
      });

      const response = await processPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBeDefined();
      expect(data.message).toBe('Processing started');
    });

    it('should validate video file format', async () => {
      const formData = new FormData();
      formData.append('video', new File(['mock'], 'test.txt', { type: 'text/plain' }));
      formData.append('settings', JSON.stringify(DEFAULT_SETTINGS));

      const request = new NextRequest('http://localhost:3000/api/process', {
        method: 'POST',
        body: formData,
      });

      const response = await processPOST(request);
      
      expect(response.status).toBe(400);
    });

    it('should require video file', async () => {
      const formData = new FormData();
      formData.append('settings', JSON.stringify(DEFAULT_SETTINGS));

      const request = new NextRequest('http://localhost:3000/api/process', {
        method: 'POST',
        body: formData,
      });

      const response = await processPOST(request);
      
      expect(response.status).toBe(400);
    });
  });
});
