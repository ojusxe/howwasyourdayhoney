/**
 * Integration tests for the complete video-to-ASCII conversion workflow
 * Tests the main conversion pipeline and critical user journeys
 */

import { ASCIIConverter } from '@/lib/asciiConverter';
import { ZipPackager } from '@/lib/zipUtils';
import { createJobStore } from '@/lib/jobStore';
import { DEFAULT_SETTINGS } from '@/lib/types';

describe('Video to ASCII Integration', () => {
  let asciiConverter: ASCIIConverter;
  let zipPackager: ZipPackager;
  let jobStore: ReturnType<typeof createJobStore>;

  beforeEach(() => {
    asciiConverter = new ASCIIConverter();
    zipPackager = new ZipPackager();
    jobStore = createJobStore(60000, 5); // 1 minute TTL, 5 max jobs
  });

  afterEach(() => {
    jobStore.stopCleanupService();
    jobStore.clearAll();
  });

  describe('Complete Workflow', () => {
    it('should process video from upload to download', async () => {
      // 1. Create job
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      expect(jobId).toMatch(/^job_[a-z0-9]+_[a-z0-9]+$/);

      // 2. Simulate frame extraction
      const mockFrames = [
        { index: 0, timestamp: 0 },
        { index: 1, timestamp: 0.042 }
      ];

      jobStore.updateJob(jobId, { 
        totalFrames: mockFrames.length,
        progress: 30
      });

      // 3. Convert to ASCII (simplified mock)
      const asciiFrames = mockFrames.map(frame => ({
        index: frame.index,
        timestamp: frame.timestamp,
        asciiContent: 'mock ascii content',
        width: 80,
        height: 24
      }));

      expect(asciiFrames).toHaveLength(2);
      expect(asciiFrames[0].asciiContent).toBeTruthy();

      // 4. Update job with frames
      jobStore.updateJob(jobId, { 
        frames: asciiFrames,
        progress: 90
      });

      // 5. Create ZIP
      const zipBlob = await zipPackager.createZip(asciiFrames, DEFAULT_SETTINGS);
      expect(zipBlob).toBeInstanceOf(Blob);

      // 6. Complete job
      jobStore.updateJob(jobId, { 
        status: 'complete',
        progress: 100
      });

      const completedJob = jobStore.getJob(jobId);
      expect(completedJob?.status).toBe('complete');
      expect(completedJob?.frames).toHaveLength(2);
      expect(completedJob?.completedAt).toBeTruthy();
    });

    it('should handle concurrent jobs correctly', () => {
      const jobIds = [];
      
      // Create maximum allowed jobs
      for (let i = 0; i < 5; i++) {
        const jobId = jobStore.createJob(DEFAULT_SETTINGS);
        jobIds.push(jobId);
      }

      expect(jobIds).toHaveLength(5);

      // Next job should fail
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
      const shortTTLStore = createJobStore(100, 5); // 100ms TTL
      
      const jobId = shortTTLStore.createJob(DEFAULT_SETTINGS);
      expect(shortTTLStore.getJob(jobId)).toBeTruthy();

      // Wait for job to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortTTLStore.getJob(jobId)).toBeNull();
      shortTTLStore.stopCleanupService();
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Simulate error
      const errorMessage = 'Processing failed';
      jobStore.updateJob(jobId, { 
        status: 'error',
        error: errorMessage
      });

      const job = jobStore.getJob(jobId);
      expect(job?.status).toBe('error');
      expect(job?.error).toBe(errorMessage);
    });

    it('should validate frame data before ZIP creation', () => {
      const invalidFrames = [
        {
          index: 0,
          timestamp: 0,
          asciiContent: '',
          width: 10,
          height: 10
        }
      ];

      const validation = zipPackager.validateFrames(invalidFrames);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('empty');
    });
  });

  describe('Performance', () => {
    it('should provide accurate job statistics', () => {
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
  });
});
