/**
 * Performance monitoring tests
 */

import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { ResourceManager } from '@/lib/performance/ResourceManager';
import { PerformanceTests } from '@/lib/performance/PerformanceTests';

describe('Performance Monitoring', () => {
  describe('PerformanceMonitor', () => {
    it('should track conversion metrics', () => {
      const monitor = new PerformanceMonitor();
      
      monitor.startConversion();
      monitor.startStep('Test Step');
      monitor.recordFrame();
      monitor.recordFrame();
      monitor.endStep();
      
      const metrics = monitor.endConversion();
      
      expect(metrics.frameCount).toBe(2);
      expect(metrics.conversionTime).toBeGreaterThan(0);
      expect(metrics.processingSteps).toHaveLength(1);
      expect(metrics.processingSteps[0].name).toBe('Test Step');
    });

    it('should provide optimization recommendations', () => {
      const monitor = new PerformanceMonitor();
      
      const mockMetrics = {
        conversionTime: 70000, // 70 seconds - should trigger recommendation
        memoryUsage: 100 * 1024 * 1024,
        frameCount: 100,
        averageFrameTime: 700, // 0.7 seconds per frame
        peakMemoryUsage: 100 * 1024 * 1024,
        processingSteps: []
      };
      
      const recommendations = monitor.getOptimizationRecommendations(mockMetrics);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('reducing FPS'))).toBe(true);
    });

    it('should estimate performance correctly', () => {
      const estimate = PerformanceMonitor.estimatePerformance(
        10 * 1024 * 1024, // 10MB
        10, // 10 seconds
        1280, // width
        720, // height
        24 // fps
      );
      
      expect(estimate.videoSize).toBe(10 * 1024 * 1024);
      expect(estimate.frameCount).toBe(240); // 10s * 24fps
      expect(estimate.estimatedTime).toBeGreaterThan(0);
      expect(estimate.estimatedMemory).toBeGreaterThan(0);
      expect(estimate.recommendedSettings).toBeDefined();
    });
  });

  describe('ResourceManager', () => {
    let resourceManager: ResourceManager;

    beforeEach(() => {
      resourceManager = ResourceManager.getInstance();
    });

    it('should track active jobs', () => {
      const jobId = 'test-job-1';
      
      resourceManager.startJob(jobId);
      const usage = resourceManager.getCurrentUsage();
      
      expect(usage.activeJobs).toBe(1);
      
      resourceManager.endJob(jobId);
      const usageAfter = resourceManager.getCurrentUsage();
      
      expect(usageAfter.activeJobs).toBe(0);
    });

    it('should enforce job limits', () => {
      const limits = resourceManager.getLimits();
      
      // Start maximum number of jobs
      for (let i = 0; i < limits.maxConcurrentJobs; i++) {
        resourceManager.startJob(`job-${i}`);
      }
      
      // Next job should be rejected
      const result = resourceManager.canStartJob(1024 * 1024); // 1MB
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Maximum concurrent jobs');
      
      // Clean up
      for (let i = 0; i < limits.maxConcurrentJobs; i++) {
        resourceManager.endJob(`job-${i}`);
      }
    });

    it('should enforce video size limits', () => {
      const limits = resourceManager.getLimits();
      const oversizedVideo = limits.maxVideoSize + 1;
      
      const result = resourceManager.canStartJob(oversizedVideo);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Video size');
    });

    it('should provide health status', () => {
      const health = resourceManager.getHealthStatus();
      
      expect(health.status).toMatch(/healthy|warning|critical/);
      expect(health.details.jobs).toBeDefined();
      expect(health.details.memory).toBeDefined();
      expect(health.details.uptime).toBeDefined();
    });
  });

  describe('PerformanceTests', () => {
    it('should provide performance benchmarks', () => {
      const benchmarks = PerformanceTests.getPerformanceBenchmarks();
      
      expect(benchmarks).toHaveLength(3);
      expect(benchmarks[0].scenario).toContain('Quick Preview');
      expect(benchmarks[1].scenario).toContain('Standard Conversion');
      expect(benchmarks[2].scenario).toContain('High Quality');
      
      benchmarks.forEach(benchmark => {
        expect(benchmark.expectedTime).toBeGreaterThan(0);
        expect(benchmark.expectedMemory).toBeGreaterThan(0);
        expect(benchmark.settings).toBeDefined();
      });
    });

    it('should generate performance reports', async () => {
      // Run a simple test case
      const testCase = {
        name: 'Test Case',
        videoSize: 1024 * 1024,
        duration: 1,
        width: 640,
        height: 480,
        settings: {
          frameRate: 12 as const,
          resolutionScale: 0.5 as const,
          characterSet: 'default' as const,
          colorMode: 'blackwhite' as const,
          background: 'transparent' as const
        }
      };
      
      const result = await PerformanceTests.runTestCase(testCase);
      
      expect(result.testCase).toEqual(testCase);
      expect(result.metrics).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      
      const report = PerformanceTests.generateReport([result]);
      expect(report).toContain('Performance Test Report');
      expect(report).toContain(testCase.name);
    });
  });
});