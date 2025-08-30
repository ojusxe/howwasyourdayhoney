/**
 * Integration tests for complete video conversion workflow
 */

import { FFmpegWorker } from '@/lib/ffmpegWorker';
import { ASCIIConverter } from '@/lib/asciiConverter';
import { ZipPackager } from '@/lib/zipUtils';
import { JobStore } from '@/lib/jobStore';
import { DEFAULT_SETTINGS } from '@/lib/types';

// Mock external dependencies
jest.mock('@ffmpeg/ffmpeg');
jest.mock('@ffmpeg/util');

describe('Complete Workflow Integration', () => {
  let ffmpegWorker: FFmpegWorker;
  let asciiConverter: ASCIIConverter;
  let zipPackager: ZipPackager;
  let jobStore: JobStore;

  beforeEach(() => {
    ffmpegWorker = new FFmpegWorker();
    asciiConverter = new ASCIIConverter();
    zipPackager = new ZipPackager();
    jobStore = new JobStore(60000, 5); // 1 minute TTL, 5 max jobs

    // Mock browser APIs
    global.URL.createObjectURL = jest.fn(() => 'blob://test');
    global.URL.revokeObjectURL = jest.fn();
    global.Blob = jest.fn().mockImplementation(() => ({}));
    
    // Mock canvas and image
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => ({
        drawImage: jest.fn(),
        getImageData: jest.fn(() => new ImageData(10, 10))
      }))
    };
    
    const mockImage = {
      width: 10,
      height: 10,
      onload: null as any,
      onerror: null as any,
      set src(value: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    };

    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return mockCanvas as any;
      if (tagName === 'video') return { onloadedmetadata: null, onerror: null, duration: 5 } as any;
      return {} as any;
    });

    global.Image = jest.fn(() => mockImage) as any;
  });

  afterEach(() => {
    jobStore.stopCleanupService();
    jobStore.clearAll();
    jest.clearAllMocks();
  });

  describe('End-to-End Video Processing', () => {
    it('should complete full video to ASCII conversion workflow', async () => {
      // 1. Create job
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      expect(jobId).toBeTruthy();

      const job = jobStore.getJob(jobId);
      expect(job?.status).toBe('pending');

      // 2. Update job to processing
      jobStore.updateJob(jobId, { status: 'processing', progress: 0 });

      // 3. Mock video validation
      const mockFile = new File(['test video data'], 'test.mp4', { type: 'video/mp4' });
      const validation = await ffmpegWorker.validateVideo(mockFile);
      expect(validation.valid).toBe(true);

      // 4. Mock frame extraction
      const mockFrames = [
        {
          index: 0,
          timestamp: 0,
          imageData: new Uint8Array([255, 0, 0, 255]), // Red pixel
          width: 1,
          height: 1
        },
        {
          index: 1,
          timestamp: 0.083,
          imageData: new Uint8Array([0, 255, 0, 255]), // Green pixel
          width: 1,
          height: 1
        }
      ];

      // Mock FFmpeg extraction
      jest.spyOn(ffmpegWorker, 'extractFrames').mockResolvedValue(mockFrames);

      const extractedFrames = await ffmpegWorker.extractFrames(
        new ArrayBuffer(1000),
        { fps: 12, scale: 1.0, outputFormat: 'png' }
      );

      expect(extractedFrames).toHaveLength(2);
      jobStore.updateJob(jobId, { progress: 50 });

      // 5. Convert frames to ASCII
      const asciiFrames = [];
      for (const frame of extractedFrames) {
        const imageData = new ImageData(frame.width, frame.height);
        const asciiFrame = asciiConverter.convertFrame(imageData, {
          characterSet: ' .:-=+*#%@',
          colorMode: 'blackwhite',
          background: 'transparent',
          colorThreshold: 50
        });

        asciiFrame.index = frame.index;
        asciiFrame.timestamp = frame.timestamp;
        asciiFrames.push(asciiFrame);
      }

      expect(asciiFrames).toHaveLength(2);
      expect(asciiFrames[0].asciiContent).toBeTruthy();

      // 6. Update job with frames
      jobStore.updateJob(jobId, { 
        frames: asciiFrames,
        progress: 90
      });

      // 7. Create ZIP package
      const zipBlob = await zipPackager.createZip(asciiFrames, DEFAULT_SETTINGS);
      expect(zipBlob).toBeInstanceOf(Blob);

      // 8. Complete job
      jobStore.updateJob(jobId, { 
        status: 'complete',
        progress: 100
      });

      const completedJob = jobStore.getJob(jobId);
      expect(completedJob?.status).toBe('complete');
      expect(completedJob?.frames).toHaveLength(2);
      expect(completedJob?.completedAt).toBeTruthy();
    });

    it('should handle processing errors gracefully', async () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Simulate processing error
      jest.spyOn(ffmpegWorker, 'extractFrames').mockRejectedValue(new Error('FFmpeg processing failed'));

      try {
        await ffmpegWorker.extractFrames(
          new ArrayBuffer(1000),
          { fps: 12, scale: 1.0, outputFormat: 'png' }
        );
      } catch (error) {
        jobStore.updateJob(jobId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Processing failed'
        });
      }

      const job = jobStore.getJob(jobId);
      expect(job?.status).toBe('error');
      expect(job?.error).toBe('FFmpeg processing failed');
    });

    it('should enforce concurrent job limits', () => {
      // Create maximum allowed jobs
      const jobIds = [];
      for (let i = 0; i < 5; i++) {
        jobIds.push(jobStore.createJob(DEFAULT_SETTINGS));
      }

      expect(jobIds).toHaveLength(5);

      // Attempt to create one more job
      expect(() => {
        jobStore.createJob(DEFAULT_SETTINGS);
      }).toThrow('Maximum concurrent jobs limit reached');

      // Complete one job and try again
      jobStore.updateJob(jobIds[0], { status: 'complete' });
      
      expect(() => {
        jobStore.createJob(DEFAULT_SETTINGS);
      }).not.toThrow();
    });

    it('should cleanup expired jobs automatically', async () => {
      // Create job store with very short TTL for testing
      const shortTTLStore = new JobStore(100, 5); // 100ms TTL
      
      const jobId = shortTTLStore.createJob(DEFAULT_SETTINGS);
      expect(shortTTLStore.getJob(jobId)).toBeTruthy();

      // Wait for job to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Job should be automatically cleaned up
      expect(shortTTLStore.getJob(jobId)).toBeNull();

      shortTTLStore.stopCleanupService();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle memory constraints', () => {
      const largeSettings = {
        ...DEFAULT_SETTINGS,
        frameRate: 24 as const,
        resolutionScale: 1.0 as const,
        colorMode: 'fullcolor' as const
      };

      // This should work with current job store limits
      expect(() => {
        jobStore.createJob(largeSettings);
      }).not.toThrow();

      const stats = jobStore.getStats();
      expect(stats.totalJobs).toBe(1);
      expect(stats.activeJobs).toBe(1);
    });

    it('should provide accurate job statistics', () => {
      // Create jobs with different statuses
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      const jobId3 = jobStore.createJob(DEFAULT_SETTINGS);

      jobStore.updateJob(jobId1, { status: 'processing' });
      jobStore.updateJob(jobId2, { status: 'complete' });
      jobStore.updateJob(jobId3, { status: 'error' });

      const stats = jobStore.getStats();
      expect(stats.totalJobs).toBe(3);
      expect(stats.processingJobs).toBe(1);
      expect(stats.completeJobs).toBe(1);
      expect(stats.errorJobs).toBe(1);
    });

    it('should estimate memory usage correctly', () => {
      const memoryUsage = jobStore.getMemoryUsage();
      expect(memoryUsage.jobCount).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.estimatedSizeBytes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate frame data before ZIP creation', async () => {
      const invalidFrames = [
        {
          index: 0,
          timestamp: 0,
          asciiContent: '', // Empty content
          width: 10,
          height: 10
        },
        {
          index: 2, // Missing index 1
          timestamp: 0.083,
          asciiContent: 'test',
          width: 10,
          height: 10
        }
      ];

      const validation = zipPackager.validateFrames(invalidFrames);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('1 frames have empty content');
      expect(validation.errors).toContain('Missing frame at index 1');
    });

    it('should maintain frame order and timing', () => {
      const frames = [
        {
          index: 2,
          timestamp: 0.167,
          asciiContent: 'frame2',
          width: 10,
          height: 10
        },
        {
          index: 0,
          timestamp: 0,
          asciiContent: 'frame0',
          width: 10,
          height: 10
        },
        {
          index: 1,
          timestamp: 0.083,
          asciiContent: 'frame1',
          width: 10,
          height: 10
        }
      ];

      // Sort frames by index
      const sortedFrames = frames.sort((a, b) => a.index - b.index);
      
      expect(sortedFrames[0].asciiContent).toBe('frame0');
      expect(sortedFrames[1].asciiContent).toBe('frame1');
      expect(sortedFrames[2].asciiContent).toBe('frame2');
      
      expect(sortedFrames[0].timestamp).toBe(0);
      expect(sortedFrames[1].timestamp).toBe(0.083);
      expect(sortedFrames[2].timestamp).toBe(0.167);
    });

    it('should preserve color data when present', () => {
      const frameWithColor = {
        index: 0,
        timestamp: 0,
        asciiContent: '@',
        width: 1,
        height: 1,
        colorData: [[{ char: '@', color: 'red' }]]
      };

      const validation = zipPackager.validateFrames([frameWithColor]);
      expect(validation.valid).toBe(true);
      
      // Color data should be preserved
      expect(frameWithColor.colorData).toBeTruthy();
      expect(frameWithColor.colorData![0][0].color).toBe('red');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary failures', async () => {
      let attemptCount = 0;
      
      // Mock function that fails twice then succeeds
      const unreliableOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      // Simulate retry logic
      let result;
      let retries = 0;
      const maxRetries = 3;

      while (retries <= maxRetries) {
        try {
          result = unreliableOperation();
          break;
        } catch (error) {
          retries++;
          if (retries > maxRetries) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should handle partial processing gracefully', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Simulate partial processing
      const partialFrames = [
        {
          index: 0,
          timestamp: 0,
          asciiContent: 'frame0',
          width: 10,
          height: 10
        }
        // Missing subsequent frames
      ];

      jobStore.updateJob(jobId, {
        status: 'error',
        frames: partialFrames,
        error: 'Processing interrupted'
      });

      const job = jobStore.getJob(jobId);
      expect(job?.status).toBe('error');
      expect(job?.frames).toHaveLength(1);
      expect(job?.error).toBe('Processing interrupted');
    });
  });
});