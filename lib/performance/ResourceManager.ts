/**
 * Resource management for concurrent job processing and memory optimization
 */

export interface ResourceLimits {
  maxConcurrentJobs: number;
  maxMemoryUsage: number;
  maxJobDuration: number;
  maxVideoSize: number;
}

export interface ResourceUsage {
  activeJobs: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: number;
}

export class ResourceManager {
  private static instance: ResourceManager;
  private activeJobs: Set<string> = new Set();
  private jobStartTimes: Map<string, number> = new Map();
  private resourceHistory: ResourceUsage[] = [];
  private limits: ResourceLimits;

  private constructor() {
    this.limits = {
      maxConcurrentJobs: process.env.NODE_ENV === 'production' ? 2 : 3,
      maxMemoryUsage: 400 * 1024 * 1024, // 400MB
      maxJobDuration: 5 * 60 * 1000, // 5 minutes
      maxVideoSize: 100 * 1024 * 1024 // 100MB
    };

    // Start resource monitoring
    this.startResourceMonitoring();
  }

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Check if a new job can be started
   */
  canStartJob(videoSize: number): { allowed: boolean; reason?: string } {
    // Check video size limit
    if (videoSize > this.limits.maxVideoSize) {
      return {
        allowed: false,
        reason: `Video size (${Math.round(videoSize / 1024 / 1024)}MB) exceeds limit (${Math.round(this.limits.maxVideoSize / 1024 / 1024)}MB)`
      };
    }

    // Check concurrent job limit
    if (this.activeJobs.size >= this.limits.maxConcurrentJobs) {
      return {
        allowed: false,
        reason: `Maximum concurrent jobs (${this.limits.maxConcurrentJobs}) reached`
      };
    }

    // Check memory usage
    const currentMemory = this.getCurrentMemoryUsage();
    if (currentMemory > this.limits.maxMemoryUsage) {
      return {
        allowed: false,
        reason: `Memory usage (${Math.round(currentMemory / 1024 / 1024)}MB) exceeds limit (${Math.round(this.limits.maxMemoryUsage / 1024 / 1024)}MB)`
      };
    }

    return { allowed: true };
  }

  /**
   * Register a new job
   */
  startJob(jobId: string): void {
    this.activeJobs.add(jobId);
    this.jobStartTimes.set(jobId, Date.now());
  }

  /**
   * Unregister a completed job
   */
  endJob(jobId: string): void {
    this.activeJobs.delete(jobId);
    this.jobStartTimes.delete(jobId);
  }

  /**
   * Get current resource usage
   */
  getCurrentUsage(): ResourceUsage {
    return {
      activeJobs: this.activeJobs.size,
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.getCurrentCpuUsage(),
      timestamp: Date.now()
    };
  }

  /**
   * Get resource usage history
   */
  getUsageHistory(minutes: number = 10): ResourceUsage[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.resourceHistory.filter(usage => usage.timestamp > cutoff);
  }

  /**
   * Check for jobs that have exceeded time limits
   */
  getExpiredJobs(): string[] {
    const now = Date.now();
    const expiredJobs: string[] = [];

    for (const [jobId, startTime] of this.jobStartTimes.entries()) {
      if (now - startTime > this.limits.maxJobDuration) {
        expiredJobs.push(jobId);
      }
    }

    return expiredJobs;
  }

  /**
   * Force cleanup of expired jobs
   */
  cleanupExpiredJobs(): string[] {
    const expiredJobs = this.getExpiredJobs();
    
    for (const jobId of expiredJobs) {
      this.endJob(jobId);
    }

    return expiredJobs;
  }

  /**
   * Get recommended delay before retrying a job
   */
  getRetryDelay(): number {
    const usage = this.getCurrentUsage();
    
    // Base delay of 5 seconds
    let delay = 5000;

    // Increase delay based on current load
    if (usage.activeJobs >= this.limits.maxConcurrentJobs) {
      delay += 10000; // Additional 10 seconds
    }

    if (usage.memoryUsage > this.limits.maxMemoryUsage * 0.8) {
      delay += 15000; // Additional 15 seconds
    }

    // Add some randomization to prevent thundering herd
    delay += Math.random() * 5000;

    return Math.min(delay, 60000); // Cap at 1 minute
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      return (window.performance as any).memory.usedJSHeapSize;
    }
    
    return 0;
  }

  /**
   * Get current CPU usage (approximation)
   */
  private getCurrentCpuUsage(): number {
    // In a browser/serverless environment, we can't get true CPU usage
    // Use active jobs as a proxy
    return (this.activeJobs.size / this.limits.maxConcurrentJobs) * 100;
  }

  /**
   * Start periodic resource monitoring
   */
  private startResourceMonitoring(): void {
    const monitor = () => {
      const usage = this.getCurrentUsage();
      this.resourceHistory.push(usage);

      // Keep only last hour of data
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      this.resourceHistory = this.resourceHistory.filter(
        u => u.timestamp > oneHourAgo
      );

      // Clean up expired jobs
      this.cleanupExpiredJobs();
    };

    // Monitor every 30 seconds
    setInterval(monitor, 30000);
    
    // Initial monitoring
    monitor();
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    details: {
      jobs: string;
      memory: string;
      uptime: string;
    };
  } {
    const usage = this.getCurrentUsage();
    const memoryPercent = (usage.memoryUsage / this.limits.maxMemoryUsage) * 100;
    const jobPercent = (usage.activeJobs / this.limits.maxConcurrentJobs) * 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (memoryPercent > 90 || jobPercent > 90) {
      status = 'critical';
    } else if (memoryPercent > 70 || jobPercent > 70) {
      status = 'warning';
    }

    return {
      status,
      details: {
        jobs: `${usage.activeJobs}/${this.limits.maxConcurrentJobs} (${Math.round(jobPercent)}%)`,
        memory: `${Math.round(usage.memoryUsage / 1024 / 1024)}MB/${Math.round(this.limits.maxMemoryUsage / 1024 / 1024)}MB (${Math.round(memoryPercent)}%)`,
        uptime: this.getUptimeString()
      }
    };
  }

  /**
   * Get uptime as a formatted string
   */
  private getUptimeString(): string {
    if (typeof process !== 'undefined' && process.uptime) {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    return 'N/A';
  }

  /**
   * Update resource limits (for testing or configuration changes)
   */
  updateLimits(newLimits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Get current resource limits
   */
  getLimits(): ResourceLimits {
    return { ...this.limits };
  }
}