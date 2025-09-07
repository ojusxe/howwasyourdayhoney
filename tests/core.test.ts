/**
 * Core functionality tests
 * Tests the essential video-to-ASCII conversion workflow
 */

import { createJobStore } from '@/lib/jobStore';
import { DEFAULT_SETTINGS } from '@/lib/types';

describe('Core Functionality', () => {
  describe('JobStore', () => {
    let jobStore: ReturnType<typeof createJobStore>;

    beforeEach(() => {
      jobStore = createJobStore(60000, 5); // 1 minute TTL, 5 max jobs
    });

    afterEach(() => {
      jobStore.stopCleanupService();
      jobStore.clearAll();
    });

    it('should create jobs with unique IDs', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      expect(jobId).toMatch(/^job_[a-z0-9]+_[a-z0-9]+$/);
      
      const job = jobStore.getJob(jobId);
      expect(job).toBeTruthy();
      expect(job!.status).toBe('pending');
      expect(job!.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should update job status', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      const updated = jobStore.updateJob(jobId, { 
        status: 'processing', 
        progress: 50 
      });
      
      expect(updated).toBe(true);
      
      const job = jobStore.getJob(jobId);
      expect(job!.status).toBe('processing');
      expect(job!.progress).toBe(50);
    });

    it('should provide accurate statistics', () => {
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      
      jobStore.updateJob(jobId1, { status: 'processing' });
      jobStore.updateJob(jobId2, { status: 'complete' });
      
      const stats = jobStore.getStats();
      expect(stats.totalJobs).toBe(2);
      expect(stats.processingJobs).toBe(1);
      expect(stats.completeJobs).toBe(1);
    });

    it('should enforce concurrent job limits', () => {
      // Create maximum allowed jobs
      for (let i = 0; i < 5; i++) {
        jobStore.createJob(DEFAULT_SETTINGS);
      }

      // Next job should fail
      expect(() => {
        jobStore.createJob(DEFAULT_SETTINGS);
      }).toThrow('Maximum concurrent jobs limit reached');
    });
  });

  describe('Types and Constants', () => {
    it('should have valid default settings', () => {
      expect(DEFAULT_SETTINGS.frameRate).toBe(12);
      expect(DEFAULT_SETTINGS.resolutionScale).toBe(0.75);
      expect(DEFAULT_SETTINGS.characterSet).toBe('default');
      expect(DEFAULT_SETTINGS.colorMode).toBe('blackwhite');
      expect(DEFAULT_SETTINGS.background).toBe('transparent');
    });
  });
});
