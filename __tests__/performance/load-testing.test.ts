/**
 * Performance and load testing
 */

import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { ResourceManager } from '@/lib/performance/ResourceManager';
import { PerformanceTests } from '@/lib/performance/PerformanceTests';

describe('Performance and Load Testing', () => {
  describe('PerformanceMonitor Load Tests', () => {
    it('handles multiple concurrent monitoring sessions', () => {
      const monitors = Array.from({ length: 10 }, () => new PerformanceMonitor());
      
      // Start all monitors
      monitors.forEach((monitor, index) => {
        monitor.startConversion();
        monitor.startStep(`Test Step ${index}`);
        
        // Simulate some work
        for (let i = 0; i < 100; i++) {
          monitor.recordFrame();
        }
        
        monitor.endStep();
      });
      
      // End all monitors and collect metrics
      const allMetrics = monitors.map(monitor => monitor.endConversion());
      
      expect(allMetrics).toHaveLength(10);
      allMetrics.forEach((metrics, index) => {
        expect(metrics.frameCount).toBe(100);
        expect(metrics.processingSteps).toHaveLength(1);
        expect(metrics.processingSteps[0].name).toBe(`Test Step ${index}`);
        expect(metrics.conversionTime).toBeGreaterThan(0);
      });
    });

    it('provides consistent performance estimates', () => {
      const testCases = [
        { size: 5 * 1024 * 1024, duration: 5, width: 640, height: 480, fps: 12 },
        { size: 15 * 1024 * 1024, duration: 10, width: 1280, height: 720, fps: 24 },
        { size: 25 * 1024 * 1024, duration: 15, width: 1920, height: 1080, fps: 24 }
      ];
      
      testCases.forEach(testCase => {
        const estimate1 = PerformanceMonitor.estimatePerformance(
          testCase.size, testCase.duration, testCase.width, testCase.height, testCase.fps
        );
        
        const estimate2 = PerformanceMonitor.estimatePerformance(
          testCase.size, testCase.duration, testCase.width, testCase.height, testCase.fps
        );
        
        // Estimates should be consistent
        expect(estimate1.estimatedTime).toBe(estimate2.estimatedTime);
        expect(estimate1.estimatedMemory).toBe(estimate2.estimatedMemory);
        expect(estimate1.frameCount).toBe(estimate2.frameCount);
      });
    });

    it('scales performance estimates correctly', () => {
      const baseCase = { size: 10 * 1024 * 1024, duration: 10, width: 1280, height: 720, fps: 12 };
      const baseEstimate = PerformanceMonitor.estimatePerformance(
        baseCase.size, baseCase.duration, baseCase.width, baseCase.height, baseCase.fps
      );
      
      // Double the FPS should increase processing time
      const doubleFpsEstimate = PerformanceMonitor.estimatePerformance(
        baseCase.size, baseCase.duration, baseCase.width, baseCase.height, 24
      );
      expect(doubleFpsEstimate.estimatedTime).toBeGreaterThan(baseEstimate.estimatedTime);
      expect(doubleFpsEstimate.frameCount).toBe(baseEstimate.frameCount * 2);
      
      // Double the resolution should increase memory and time
      const doubleResEstimate = PerformanceMonitor.estimatePerformance(
        baseCase.size, baseCase.duration, baseCase.width * 2, baseCase.height * 2, baseCase.fps
      );
      expect(doubleResEstimate.estimatedTime).toBeGreaterThan(baseEstimate.estimatedTime);
      expect(doubleResEstimate.estimatedMemory).toBeGreaterThan(baseEstimate.estimatedMemory);
    });
  });

  describe('ResourceManager Load Tests', () => {
    let resourceManager: ResourceManager;

    beforeEach(() => {
      resourceManager = ResourceManager.getInstance();
      // Clean up any existing jobs
      const expiredJobs = resourceManager.getExpiredJobs();
      expiredJobs.forEach(jobId => resourceManager.endJob(jobId));
    });

    it('handles maximum concurrent jobs correctly', () => {
      const limits = resourceManager.getLimits();
      const jobIds: string[] = [];
      
      // Start maximum number of jobs
      for (let i = 0; i < limits.maxConcurrentJobs; i++) {
        const jobId = `load-test-job-${i}`;
        jobIds.push(jobId);
        resourceManager.startJob(jobId);
      }
      
      const usage = resourceManager.getCurrentUsage();
      expect(usage.activeJobs).toBe(limits.maxConcurrentJobs);
      
      // Next job should be rejected
      const result = resourceManager.canStartJob(1024 * 1024);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Maximum concurrent jobs');
      
      // Clean up
      jobIds.forEach(jobId => resourceManager.endJob(jobId));
    });

    it('handles rapid job creation and completion', () => {
      const jobCount = 50;
      const jobIds: string[] = [];
      
      // Rapidly create and complete jobs
      for (let i = 0; i < jobCount; i++) {
        const jobId = `rapid-job-${i}`;
        jobIds.push(jobId);
        
        const canStart = resourceManager.canStartJob(1024 * 1024);
        if (canStart.allowed) {
          resourceManager.startJob(jobId);
          // Immediately complete some jobs to test rapid turnover
          if (i % 3 === 0) {
            resourceManager.endJob(jobId);
          }
        }
      }
      
      const usage = resourceManager.getCurrentUsage();
      expect(usage.activeJobs).toBeLessThanOrEqual(resourceManager.getLimits().maxConcurrentJobs);
      
      // Clean up remaining jobs
      jobIds.forEach(jobId => {
        try {
          resourceManager.endJob(jobId);
        } catch (error) {
          // Job might already be completed
        }
      });
    });

    it('maintains performance under stress', () => {
      const startTime = performance.now();
      const operationCount = 1000;
      
      // Perform many operations
      for (let i = 0; i < operationCount; i++) {
        resourceManager.canStartJob(1024 * 1024);
        resourceManager.getCurrentUsage();
        resourceManager.getHealthStatus();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / operationCount;
      
      // Each operation should be fast (less than 1ms on average)
      expect(avgTimePerOperation).toBeLessThan(1);
    });
  });

  describe('PerformanceTests Load Tests', () => {
    it('runs multiple test cases efficiently', async () => {
      const startTime = performance.now();
      
      const results = await PerformanceTests.runAllTests();
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(results).toHaveLength(3); // Default test cases
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      results.forEach(result => {
        expect(result.testCase).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.passed).toBeDefined();
        expect(result.issues).toBeInstanceOf(Array);
        expect(result.recommendations).toBeInstanceOf(Array);
      });
    });

    it('generates comprehensive reports for multiple scenarios', async () => {
      const testCases = [
        {
          name: 'Stress Test 1',
          videoSize: 50 * 1024 * 1024,
          duration: 30,
          width: 1920,
          height: 1080,
          settings: {
            frameRate: 24 as const,
            resolutionScale: 1.0 as const,
            characterSet: 'default' as const,
            colorMode: 'fullcolor' as const,
            background: 'transparent' as const
          }
        },
        {
          name: 'Stress Test 2',
          videoSize: 100 * 1024 * 1024,
          duration: 60,
          width: 3840,
          height: 2160,
          settings: {
            frameRate: 24 as const,
            resolutionScale: 1.0 as const,
            characterSet: 'custom' as const,
            customCharacters: '.-+*#@%&',
            colorMode: 'fullcolor' as const,
            background: 'black' as const
          }
        }
      ];
      
      const results = await Promise.all(
        testCases.map(testCase => PerformanceTests.runTestCase(testCase))
      );
      
      expect(results).toHaveLength(2);
      
      const report = PerformanceTests.generateReport(results);
      expect(report).toContain('Performance Test Report');
      expect(report).toContain('Stress Test 1');
      expect(report).toContain('Stress Test 2');
      
      // Report should include performance metrics
      results.forEach(result => {
        expect(report).toContain(result.testCase.name);
        expect(report).toContain(`${result.metrics.frameCount}`);
        expect(report).toContain(`${Math.round(result.metrics.conversionTime)}ms`);
      });
    });
  });

  describe('Memory Usage Tests', () => {
    it('monitors memory usage during intensive operations', () => {
      const monitor = new PerformanceMonitor();
      monitor.startConversion();
      
      // Simulate memory-intensive operations
      const largeArrays: number[][] = [];
      
      monitor.startStep('Memory Intensive Operation');
      
      for (let i = 0; i < 100; i++) {
        // Create large arrays to simulate memory usage
        largeArrays.push(new Array(1000).fill(Math.random()));
        monitor.recordFrame();
      }
      
      monitor.endStep();
      const metrics = monitor.endConversion();
      
      expect(metrics.frameCount).toBe(100);
      expect(metrics.peakMemoryUsage).toBeGreaterThanOrEqual(metrics.memoryUsage);
      expect(metrics.processingSteps).toHaveLength(1);
      expect(metrics.processingSteps[0].memoryAfter).toBeGreaterThanOrEqual(
        metrics.processingSteps[0].memoryBefore
      );
      
      // Clean up
      largeArrays.length = 0;
    });

    it('provides memory optimization recommendations', () => {
      const monitor = new PerformanceMonitor();
      
      // Simulate high memory usage scenario
      const highMemoryMetrics = {
        conversionTime: 30000,
        memoryUsage: 100 * 1024 * 1024,
        frameCount: 100,
        averageFrameTime: 300,
        peakMemoryUsage: 300 * 1024 * 1024, // 300MB peak
        processingSteps: []
      };
      
      const recommendations = monitor.getOptimizationRecommendations(highMemoryMetrics);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.toLowerCase().includes('memory'))).toBe(true);
    });
  });

  describe('Concurrent Processing Tests', () => {
    it('handles multiple performance monitors simultaneously', async () => {
      const monitorCount = 20;
      const monitors = Array.from({ length: monitorCount }, () => new PerformanceMonitor());
      
      // Start all monitors concurrently
      const promises = monitors.map(async (monitor, index) => {
        monitor.startConversion();
        monitor.startStep(`Concurrent Step ${index}`);
        
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        for (let i = 0; i < 50; i++) {
          monitor.recordFrame();
        }
        
        monitor.endStep();
        return monitor.endConversion();
      });
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(monitorCount);
      results.forEach((metrics, index) => {
        expect(metrics.frameCount).toBe(50);
        expect(metrics.processingSteps).toHaveLength(1);
        expect(metrics.processingSteps[0].name).toBe(`Concurrent Step ${index}`);
      });
    });
  });
});