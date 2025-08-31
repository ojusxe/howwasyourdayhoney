import { ProcessingJob, ConversionSettings, JOB_TTL, MAX_CONCURRENT_JOBS } from './types';

/**
 * In-memory job storage with TTL-based cleanup
 * Manages processing jobs ephemerally without persistence
 */
export class JobStore {
  private jobs: Map<string, ProcessingJob> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly ttl: number;
  private readonly maxConcurrentJobs: number;

  constructor(ttl: number = JOB_TTL, maxConcurrentJobs: number = MAX_CONCURRENT_JOBS) {
    this.ttl = ttl;
    this.maxConcurrentJobs = maxConcurrentJobs;
    this.startCleanupService();
  }

  /**
   * Create a new processing job
   */
  createJob(settings: ConversionSettings): string {
    // Check concurrent job limit
    const activeJobs = this.getActiveJobs();
    if (activeJobs.length >= this.maxConcurrentJobs) {
      throw new Error(`Maximum concurrent jobs limit reached (${this.maxConcurrentJobs})`);
    }

    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      settings,
      frames: []
    };

    this.jobs.set(jobId, job);
    console.log(`Created job ${jobId}, active jobs: ${activeJobs.length + 1}`);
    
    return jobId;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ProcessingJob | null {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return null;
    }

    // Check if job has expired
    if (this.isJobExpired(job)) {
      this.deleteJob(jobId);
      return null;
    }

    return job;
  }

  /**
   * Update job with partial data
   */
  updateJob(jobId: string, updates: Partial<ProcessingJob>): boolean {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      console.warn(`Attempted to update non-existent job: ${jobId}`);
      return false;
    }
    
    if (this.isJobExpired(job)) {
      console.warn(`Attempted to update expired job: ${jobId}`);
      this.deleteJob(jobId);
      return false;
    }

    // Update job properties
    Object.assign(job, updates);

    // Set completion time if status changed to complete
    if (updates.status === 'complete' && !job.completedAt) {
      job.completedAt = new Date();
      console.log(`Job ${jobId} marked as complete with ${job.frames?.length || 0} frames`);
    }

    this.jobs.set(jobId, job);
    console.log(`Updated job ${jobId}: status=${job.status}, progress=${job.progress}%`);
    return true;
  }

  /**
   * Delete job by ID
   */
  deleteJob(jobId: string): boolean {
    const deleted = this.jobs.delete(jobId);
    if (deleted) {
      console.log(`Deleted job ${jobId}`);
    }
    return deleted;
  }

  /**
   * Get all active (non-expired) jobs
   */
  getActiveJobs(): ProcessingJob[] {
    const activeJobs: ProcessingJob[] = [];
    
    for (const job of this.jobs.values()) {
      if (!this.isJobExpired(job)) {
        activeJobs.push(job);
      }
    }
    
    return activeJobs;
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: ProcessingJob['status']): ProcessingJob[] {
    return this.getActiveJobs().filter(job => job.status === status);
  }

  /**
   * Get job statistics
   */
  getStats(): {
    totalJobs: number;
    activeJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completeJobs: number;
    errorJobs: number;
    expiredJobs: number;
  } {
    const allJobs = Array.from(this.jobs.values());
    const activeJobs = this.getActiveJobs();
    const expiredJobs = allJobs.filter(job => this.isJobExpired(job));

    return {
      totalJobs: allJobs.length,
      activeJobs: activeJobs.length,
      pendingJobs: activeJobs.filter(job => job.status === 'pending').length,
      processingJobs: activeJobs.filter(job => job.status === 'processing').length,
      completeJobs: activeJobs.filter(job => job.status === 'complete').length,
      errorJobs: activeJobs.filter(job => job.status === 'error').length,
      expiredJobs: expiredJobs.length
    };
  }

  /**
   * Manual cleanup of expired jobs
   */
  cleanup(): number {
    const expiredJobs: string[] = [];
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (this.isJobExpired(job)) {
        expiredJobs.push(jobId);
      }
    }

    // Delete expired jobs
    for (const jobId of expiredJobs) {
      this.jobs.delete(jobId);
    }

    if (expiredJobs.length > 0) {
      console.log(`Cleaned up ${expiredJobs.length} expired jobs`);
    }

    return expiredJobs.length;
  }

  /**
   * Force cleanup of all jobs (for testing/shutdown)
   */
  clearAll(): void {
    const jobCount = this.jobs.size;
    this.jobs.clear();
    console.log(`Cleared all ${jobCount} jobs`);
  }

  /**
   * Start automatic cleanup service
   */
  private startCleanupService(): void {
    if (this.cleanupInterval) {
      return;
    }

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    console.log('Job cleanup service started');
  }

  /**
   * Stop automatic cleanup service
   */
  stopCleanupService(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Job cleanup service stopped');
    }
  }

  /**
   * Check if job has expired
   */
  private isJobExpired(job: ProcessingJob): boolean {
    const now = new Date().getTime();
    const jobTime = job.createdAt.getTime();
    return (now - jobTime) > this.ttl;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `job_${timestamp}_${random}`;
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): {
    jobCount: number;
    estimatedSizeBytes: number;
    averageJobSizeBytes: number;
  } {
    const jobs = Array.from(this.jobs.values());
    let totalSize = 0;

    for (const job of jobs) {
      // Estimate job size based on frames and content
      let jobSize = 1000; // Base job metadata size
      
      for (const frame of job.frames) {
        jobSize += frame.asciiContent.length * 2; // ASCII content
        if (frame.colorData) {
          jobSize += JSON.stringify(frame.colorData).length * 2; // Color data
        }
      }
      
      totalSize += jobSize;
    }

    return {
      jobCount: jobs.length,
      estimatedSizeBytes: totalSize,
      averageJobSizeBytes: jobs.length > 0 ? Math.round(totalSize / jobs.length) : 0
    };
  }

  /**
   * Cleanup jobs by criteria (for advanced cleanup strategies)
   */
  cleanupByCriteria(criteria: {
    olderThan?: number;
    status?: ProcessingJob['status'][];
    maxJobs?: number;
  }): number {
    const jobs = Array.from(this.jobs.entries());
    const toDelete: string[] = [];
    const now = new Date().getTime();

    for (const [jobId, job] of jobs) {
      let shouldDelete = false;

      // Check age criteria
      if (criteria.olderThan && (now - job.createdAt.getTime()) > criteria.olderThan) {
        shouldDelete = true;
      }

      // Check status criteria
      if (criteria.status && criteria.status.includes(job.status)) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        toDelete.push(jobId);
      }
    }

    // If maxJobs specified, delete oldest jobs beyond limit
    if (criteria.maxJobs && jobs.length > criteria.maxJobs) {
      const sortedJobs = jobs.sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());
      const excess = jobs.length - criteria.maxJobs;
      
      for (let i = 0; i < excess; i++) {
        const jobId = sortedJobs[i][0];
        if (!toDelete.includes(jobId)) {
          toDelete.push(jobId);
        }
      }
    }

    // Delete selected jobs
    for (const jobId of toDelete) {
      this.jobs.delete(jobId);
    }

    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} jobs by criteria`);
    }

    return toDelete.length;
  }
}

// Singleton instance for application use
let jobStoreInstance: JobStore | null = null;

export function getJobStore(): JobStore {
  if (!jobStoreInstance) {
    jobStoreInstance = new JobStore();
  }
  return jobStoreInstance;
}

// For testing - allow creating new instances
export function createJobStore(ttl?: number, maxConcurrentJobs?: number): JobStore {
  return new JobStore(ttl, maxConcurrentJobs);
}