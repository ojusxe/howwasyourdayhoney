import { JobStore, createJobStore } from '../jobStore';
import { DEFAULT_SETTINGS } from '../types';

describe('JobStore', () => {
  let jobStore: JobStore;

  beforeEach(() => {
    // Create a new instance with short TTL for testing
    jobStore = createJobStore(1000, 2); // 1 second TTL, 2 max jobs
  });

  afterEach(() => {
    jobStore.stopCleanupService();
    jobStore.clearAll();
  });

  describe('createJob', () => {
    it('should create a new job with unique ID', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      expect(jobId).toMatch(/^job_[a-z0-9]+_[a-z0-9]+$/);
      
      const job = jobStore.getJob(jobId);
      expect(job).toBeTruthy();
      expect(job!.status).toBe('pending');
      expect(job!.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should enforce concurrent job limit', () => {
      // Create maximum allowed jobs
      jobStore.createJob(DEFAULT_SETTINGS);
      jobStore.createJob(DEFAULT_SETTINGS);
      
      // Third job should throw error
      expect(() => {
        jobStore.createJob(DEFAULT_SETTINGS);
      }).toThrow('Maximum concurrent jobs limit reached');
    });

    it('should allow creating jobs after others complete', () => {
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Complete one job
      jobStore.updateJob(jobId1, { status: 'complete' });
      
      // Should be able to create another job
      expect(() => {
        jobStore.createJob(DEFAULT_SETTINGS);
      }).not.toThrow();
    });
  });

  describe('getJob', () => {
    it('should return job by ID', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      const job = jobStore.getJob(jobId);
      
      expect(job).toBeTruthy();
      expect(job!.id).toBe(jobId);
    });

    it('should return null for non-existent job', () => {
      const job = jobStore.getJob('non-existent');
      expect(job).toBeNull();
    });

    it('should return null for expired job', async () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Wait for job to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const job = jobStore.getJob(jobId);
      expect(job).toBeNull();
    });
  });

  describe('updateJob', () => {
    it('should update job properties', () => {
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

    it('should set completion time when status changes to complete', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      jobStore.updateJob(jobId, { status: 'complete' });
      
      const job = jobStore.getJob(jobId);
      expect(job!.completedAt).toBeTruthy();
    });

    it('should return false for non-existent job', () => {
      const updated = jobStore.updateJob('non-existent', { progress: 50 });
      expect(updated).toBe(false);
    });
  });

  describe('deleteJob', () => {
    it('should delete job by ID', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      const deleted = jobStore.deleteJob(jobId);
      expect(deleted).toBe(true);
      
      const job = jobStore.getJob(jobId);
      expect(job).toBeNull();
    });

    it('should return false for non-existent job', () => {
      const deleted = jobStore.deleteJob('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('getActiveJobs', () => {
    it('should return only non-expired jobs', async () => {
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Wait for first job to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      
      const activeJobs = jobStore.getActiveJobs();
      expect(activeJobs).toHaveLength(1);
      expect(activeJobs[0].id).toBe(jobId2);
    });
  });

  describe('getJobsByStatus', () => {
    it('should return jobs filtered by status', () => {
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      
      jobStore.updateJob(jobId1, { status: 'processing' });
      jobStore.updateJob(jobId2, { status: 'complete' });
      
      const processingJobs = jobStore.getJobsByStatus('processing');
      const completeJobs = jobStore.getJobsByStatus('complete');
      
      expect(processingJobs).toHaveLength(1);
      expect(processingJobs[0].id).toBe(jobId1);
      expect(completeJobs).toHaveLength(1);
      expect(completeJobs[0].id).toBe(jobId2);
    });
  });

  describe('getStats', () => {
    it('should return accurate job statistics', async () => {
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      
      jobStore.updateJob(jobId1, { status: 'processing' });
      jobStore.updateJob(jobId2, { status: 'complete' });
      
      const stats = jobStore.getStats();
      
      expect(stats.totalJobs).toBe(2);
      expect(stats.activeJobs).toBe(2);
      expect(stats.processingJobs).toBe(1);
      expect(stats.completeJobs).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove expired jobs', async () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Wait for job to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const cleanedCount = jobStore.cleanup();
      
      expect(cleanedCount).toBe(1);
      expect(jobStore.getJob(jobId)).toBeNull();
    });

    it('should not remove active jobs', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      const cleanedCount = jobStore.cleanup();
      
      expect(cleanedCount).toBe(0);
      expect(jobStore.getJob(jobId)).toBeTruthy();
    });
  });

  describe('cleanupByCriteria', () => {
    it('should cleanup jobs by age criteria', async () => {
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Cleanup jobs older than 400ms
      const cleanedCount = jobStore.cleanupByCriteria({ olderThan: 400 });
      
      expect(cleanedCount).toBe(1);
      expect(jobStore.getJob(jobId1)).toBeNull();
      expect(jobStore.getJob(jobId2)).toBeTruthy();
    });

    it('should cleanup jobs by status criteria', () => {
      const jobId1 = jobStore.createJob(DEFAULT_SETTINGS);
      const jobId2 = jobStore.createJob(DEFAULT_SETTINGS);
      
      jobStore.updateJob(jobId1, { status: 'error' });
      jobStore.updateJob(jobId2, { status: 'complete' });
      
      const cleanedCount = jobStore.cleanupByCriteria({ status: ['error'] });
      
      expect(cleanedCount).toBe(1);
      expect(jobStore.getJob(jobId1)).toBeNull();
      expect(jobStore.getJob(jobId2)).toBeTruthy();
    });

    it('should cleanup excess jobs when maxJobs specified', () => {
      // Create 3 jobs (exceeds our test limit of 2, but we'll override)
      jobStore.clearAll(); // Clear to reset concurrent limit
      
      const jobStore2 = createJobStore(10000, 10); // High limits for this test
      
      const jobId1 = jobStore2.createJob(DEFAULT_SETTINGS);
      const jobId2 = jobStore2.createJob(DEFAULT_SETTINGS);
      const jobId3 = jobStore2.createJob(DEFAULT_SETTINGS);
      
      const cleanedCount = jobStore2.cleanupByCriteria({ maxJobs: 2 });
      
      expect(cleanedCount).toBe(1);
      expect(jobStore2.getJob(jobId1)).toBeNull(); // Oldest should be deleted
      expect(jobStore2.getJob(jobId2)).toBeTruthy();
      expect(jobStore2.getJob(jobId3)).toBeTruthy();
      
      jobStore2.stopCleanupService();
      jobStore2.clearAll();
    });
  });

  describe('getMemoryUsage', () => {
    it('should estimate memory usage', () => {
      const jobId = jobStore.createJob(DEFAULT_SETTINGS);
      
      // Add some frame data
      jobStore.updateJob(jobId, {
        frames: [{
          index: 0,
          timestamp: 0,
          asciiContent: 'test content',
          width: 10,
          height: 5
        }]
      });
      
      const usage = jobStore.getMemoryUsage();
      
      expect(usage.jobCount).toBe(1);
      expect(usage.estimatedSizeBytes).toBeGreaterThan(0);
      expect(usage.averageJobSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('clearAll', () => {
    it('should remove all jobs', () => {
      jobStore.createJob(DEFAULT_SETTINGS);
      jobStore.createJob(DEFAULT_SETTINGS);
      
      jobStore.clearAll();
      
      const stats = jobStore.getStats();
      expect(stats.totalJobs).toBe(0);
    });
  });
});