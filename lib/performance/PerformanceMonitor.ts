/**
 * Performance monitoring and optimization utilities
 * Tracks conversion performance, memory usage, and provides optimization recommendations
 */

export interface PerformanceMetrics {
  conversionTime: number;
  memoryUsage: number;
  frameCount: number;
  averageFrameTime: number;
  peakMemoryUsage: number;
  processingSteps: ProcessingStep[];
}

export interface ProcessingStep {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
}

export interface PerformanceBenchmark {
  videoSize: number;
  duration: number;
  frameCount: number;
  estimatedTime: number;
  estimatedMemory: number;
  recommendedSettings: {
    maxFps: number;
    maxWidth: number;
    maxHeight: number;
  };
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private currentStep: ProcessingStep | null = null;
  private startTime: number = 0;

  constructor() {
    this.metrics = {
      conversionTime: 0,
      memoryUsage: 0,
      frameCount: 0,
      averageFrameTime: 0,
      peakMemoryUsage: 0,
      processingSteps: []
    };
  }

  /**
   * Start monitoring a conversion process
   */
  startConversion(): void {
    this.startTime = performance.now();
    this.metrics = {
      conversionTime: 0,
      memoryUsage: this.getMemoryUsage(),
      frameCount: 0,
      averageFrameTime: 0,
      peakMemoryUsage: this.getMemoryUsage(),
      processingSteps: []
    };
  }

  /**
   * Start monitoring a specific processing step
   */
  startStep(name: string): void {
    if (this.currentStep) {
      this.endStep();
    }

    this.currentStep = {
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      memoryBefore: this.getMemoryUsage(),
      memoryAfter: 0
    };
  }

  /**
   * End the current processing step
   */
  endStep(): void {
    if (!this.currentStep) return;

    const now = performance.now();
    const memoryAfter = this.getMemoryUsage();

    this.currentStep.endTime = now;
    this.currentStep.duration = now - this.currentStep.startTime;
    this.currentStep.memoryAfter = memoryAfter;

    this.metrics.processingSteps.push({ ...this.currentStep });
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memoryAfter);
    this.currentStep = null;
  }

  /**
   * Record frame processing completion
   */
  recordFrame(): void {
    this.metrics.frameCount++;
    const currentMemory = this.getMemoryUsage();
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, currentMemory);
  }

  /**
   * End conversion monitoring and calculate final metrics
   */
  endConversion(): PerformanceMetrics {
    if (this.currentStep) {
      this.endStep();
    }

    const endTime = performance.now();
    this.metrics.conversionTime = endTime - this.startTime;
    this.metrics.memoryUsage = this.getMemoryUsage();
    
    if (this.metrics.frameCount > 0) {
      this.metrics.averageFrameTime = this.metrics.conversionTime / this.metrics.frameCount;
    }

    return { ...this.metrics };
  }

  /**
   * Get current memory usage (approximation for browser environment)
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      return (window.performance as any).memory.usedJSHeapSize;
    }
    
    // Fallback for environments without memory API
    return 0;
  }

  /**
   * Estimate processing time and memory requirements
   */
  static estimatePerformance(
    videoSize: number,
    duration: number,
    width: number,
    height: number,
    fps: number
  ): PerformanceBenchmark {
    // Base calculations on empirical data
    const frameCount = Math.ceil(duration * fps);
    const pixelsPerFrame = width * height;
    const totalPixels = frameCount * pixelsPerFrame;

    // Rough estimates based on typical performance characteristics
    const baseTimePerPixel = 0.0001; // ms per pixel
    const baseMemoryPerFrame = pixelsPerFrame * 4; // 4 bytes per pixel (RGBA)
    
    const estimatedTime = totalPixels * baseTimePerPixel;
    const estimatedMemory = frameCount * baseMemoryPerFrame;

    // Performance-based recommendations
    const recommendedSettings = this.getRecommendedSettings(videoSize, duration, width, height);

    return {
      videoSize,
      duration,
      frameCount,
      estimatedTime,
      estimatedMemory,
      recommendedSettings
    };
  }

  /**
   * Get recommended settings based on video characteristics
   */
  private static getRecommendedSettings(
    videoSize: number,
    duration: number,
    width: number,
    height: number
  ): { maxFps: number; maxWidth: number; maxHeight: number } {
    // Size-based recommendations (in MB)
    const sizeMB = videoSize / (1024 * 1024);
    
    let maxFps = 30;
    let maxWidth = width;
    let maxHeight = height;

    // Adjust based on file size
    if (sizeMB > 100) {
      maxFps = 15;
      maxWidth = Math.min(width, 1280);
      maxHeight = Math.min(height, 720);
    } else if (sizeMB > 50) {
      maxFps = 20;
      maxWidth = Math.min(width, 1920);
      maxHeight = Math.min(height, 1080);
    }

    // Adjust based on duration
    if (duration > 300) { // 5 minutes
      maxFps = Math.min(maxFps, 10);
    } else if (duration > 120) { // 2 minutes
      maxFps = Math.min(maxFps, 15);
    }

    // Adjust based on resolution
    const totalPixels = width * height;
    if (totalPixels > 2073600) { // 1920x1080
      maxWidth = Math.min(maxWidth, 1280);
      maxHeight = Math.min(maxHeight, 720);
    }

    return { maxFps, maxWidth, maxHeight };
  }

  /**
   * Check if current job should be throttled based on system resources
   */
  static shouldThrottleJob(currentJobs: number, memoryUsage: number): boolean {
    const maxConcurrentJobs = 3;
    const maxMemoryUsage = 500 * 1024 * 1024; // 500MB

    return currentJobs >= maxConcurrentJobs || memoryUsage > maxMemoryUsage;
  }

  /**
   * Get optimization recommendations based on metrics
   */
  getOptimizationRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    // Memory usage recommendations
    if (metrics.peakMemoryUsage > 200 * 1024 * 1024) { // 200MB
      recommendations.push('Consider reducing video resolution or frame rate to lower memory usage');
    }

    // Processing time recommendations
    if (metrics.conversionTime > 60000) { // 1 minute
      recommendations.push('Try reducing FPS or using a smaller character set for faster processing');
    }

    // Frame processing efficiency
    if (metrics.averageFrameTime > 1000) { // 1 second per frame
      recommendations.push('Consider using black & white mode for faster frame processing');
    }

    // Step-specific recommendations
    if (metrics.processingSteps.length > 0) {
      const slowestStep = metrics.processingSteps.reduce((prev, current) => 
        prev.duration > current.duration ? prev : current
      );

      if (slowestStep && slowestStep.duration > metrics.conversionTime * 0.5) {
        recommendations.push(`Optimize ${slowestStep.name} step - it's taking ${Math.round(slowestStep.duration / metrics.conversionTime * 100)}% of total time`);
      }
    }

    return recommendations;
  }
}