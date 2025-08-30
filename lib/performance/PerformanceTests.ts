/**
 * Performance testing utilities for ASCII conversion operations
 */

import { ConversionSettings } from '@/lib/types';
import { PerformanceMonitor, PerformanceMetrics } from './PerformanceMonitor';

export interface PerformanceTestCase {
  name: string;
  videoSize: number;
  duration: number;
  width: number;
  height: number;
  settings: ConversionSettings;
  expectedTime?: number;
  expectedMemory?: number;
}

export interface PerformanceTestResult {
  testCase: PerformanceTestCase;
  metrics: PerformanceMetrics;
  passed: boolean;
  issues: string[];
  recommendations: string[];
}

export class PerformanceTests {
  private static readonly TEST_CASES: PerformanceTestCase[] = [
    {
      name: 'Small Video - Low Quality',
      videoSize: 5 * 1024 * 1024, // 5MB
      duration: 5,
      width: 640,
      height: 480,
      settings: {
        frameRate: 12,
        resolutionScale: 0.5,
        characterSet: 'default',
        colorMode: 'blackwhite',
        background: 'transparent'
      },
      expectedTime: 10000, // 10 seconds
      expectedMemory: 50 * 1024 * 1024 // 50MB
    },
    {
      name: 'Medium Video - Standard Quality',
      videoSize: 15 * 1024 * 1024, // 15MB
      duration: 10,
      width: 1280,
      height: 720,
      settings: {
        frameRate: 24,
        resolutionScale: 0.75,
        characterSet: 'default',
        colorMode: 'twotone',
        twoToneColors: ['#000000', '#FFFFFF'],
        background: 'black'
      },
      expectedTime: 30000, // 30 seconds
      expectedMemory: 100 * 1024 * 1024 // 100MB
    },
    {
      name: 'Large Video - High Quality',
      videoSize: 25 * 1024 * 1024, // 25MB
      duration: 15,
      width: 1920,
      height: 1080,
      settings: {
        frameRate: 24,
        resolutionScale: 1.0,
        characterSet: 'default',
        colorMode: 'fullcolor',
        background: 'transparent'
      },
      expectedTime: 60000, // 60 seconds
      expectedMemory: 200 * 1024 * 1024 // 200MB
    }
  ];

  /**
   * Run all performance test cases
   */
  static async runAllTests(): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];

    for (const testCase of this.TEST_CASES) {
      try {
        const result = await this.runTestCase(testCase);
        results.push(result);
      } catch (error) {
        results.push({
          testCase,
          metrics: {
            conversionTime: 0,
            memoryUsage: 0,
            frameCount: 0,
            averageFrameTime: 0,
            peakMemoryUsage: 0,
            processingSteps: []
          },
          passed: false,
          issues: [`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          recommendations: ['Fix the underlying issue before running performance tests']
        });
      }
    }

    return results;
  }

  /**
   * Run a specific performance test case
   */
  static async runTestCase(testCase: PerformanceTestCase): Promise<PerformanceTestResult> {
    const monitor = new PerformanceMonitor();
    
    // Simulate the performance characteristics
    monitor.startConversion();
    
    // Simulate frame extraction
    monitor.startStep('Frame Extraction');
    const frameCount = Math.ceil(testCase.duration * testCase.settings.frameRate);
    
    for (let i = 0; i < frameCount; i++) {
      monitor.recordFrame();
      // Simulate processing delay
      await this.simulateProcessingDelay(testCase.width * testCase.height);
    }
    monitor.endStep();

    // Simulate ASCII conversion
    monitor.startStep('ASCII Conversion');
    for (let i = 0; i < frameCount; i++) {
      monitor.recordFrame();
      // Simulate conversion delay based on color mode
      await this.simulateConversionDelay(testCase.settings.colorMode);
    }
    monitor.endStep();

    const metrics = monitor.endConversion();
    const recommendations = monitor.getOptimizationRecommendations(metrics);

    // Evaluate test results
    const issues: string[] = [];
    let passed = true;

    // Check time expectations
    if (testCase.expectedTime && metrics.conversionTime > testCase.expectedTime) {
      issues.push(`Conversion took ${Math.round(metrics.conversionTime)}ms, expected under ${testCase.expectedTime}ms`);
      passed = false;
    }

    // Check memory expectations
    if (testCase.expectedMemory && metrics.peakMemoryUsage > testCase.expectedMemory) {
      issues.push(`Peak memory usage ${Math.round(metrics.peakMemoryUsage / 1024 / 1024)}MB, expected under ${Math.round(testCase.expectedMemory / 1024 / 1024)}MB`);
      passed = false;
    }

    // Check for performance issues
    if (metrics.averageFrameTime > 2000) { // 2 seconds per frame
      issues.push(`Average frame processing time is too high: ${Math.round(metrics.averageFrameTime)}ms`);
      passed = false;
    }

    return {
      testCase,
      metrics,
      passed,
      issues,
      recommendations
    };
  }

  /**
   * Generate a performance report
   */
  static generateReport(results: PerformanceTestResult[]): string {
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    let report = `# Performance Test Report\n\n`;
    report += `**Summary:** ${passedTests}/${totalTests} tests passed\n\n`;

    for (const result of results) {
      report += `## ${result.testCase.name}\n`;
      report += `**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      report += `**Conversion Time:** ${Math.round(result.metrics.conversionTime)}ms\n`;
      report += `**Peak Memory:** ${Math.round(result.metrics.peakMemoryUsage / 1024 / 1024)}MB\n`;
      report += `**Average Frame Time:** ${Math.round(result.metrics.averageFrameTime)}ms\n`;
      report += `**Frame Count:** ${result.metrics.frameCount}\n\n`;

      if (result.issues.length > 0) {
        report += `**Issues:**\n`;
        for (const issue of result.issues) {
          report += `- ${issue}\n`;
        }
        report += '\n';
      }

      if (result.recommendations.length > 0) {
        report += `**Recommendations:**\n`;
        for (const rec of result.recommendations) {
          report += `- ${rec}\n`;
        }
        report += '\n';
      }

      // Processing steps breakdown
      if (result.metrics.processingSteps.length > 0) {
        report += `**Processing Steps:**\n`;
        for (const step of result.metrics.processingSteps) {
          report += `- ${step.name}: ${Math.round(step.duration)}ms\n`;
        }
        report += '\n';
      }

      report += '---\n\n';
    }

    return report;
  }

  /**
   * Simulate processing delay based on pixel count
   */
  private static async simulateProcessingDelay(pixelCount: number): Promise<void> {
    // Simulate realistic processing time (0.1ms per 1000 pixels)
    const delay = Math.max(1, pixelCount / 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simulate conversion delay based on color mode
   */
  private static async simulateConversionDelay(colorMode: string): Promise<void> {
    let delay = 1; // Base delay

    switch (colorMode) {
      case 'blackwhite':
        delay = 1;
        break;
      case 'twotone':
        delay = 2;
        break;
      case 'fullcolor':
        delay = 5;
        break;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get performance benchmarks for different scenarios
   */
  static getPerformanceBenchmarks(): {
    scenario: string;
    expectedTime: number;
    expectedMemory: number;
    settings: ConversionSettings;
  }[] {
    return [
      {
        scenario: 'Quick Preview (5s, low quality)',
        expectedTime: 5000,
        expectedMemory: 25 * 1024 * 1024,
        settings: {
          frameRate: 12,
          resolutionScale: 0.5,
          characterSet: 'default',
          colorMode: 'blackwhite',
          background: 'transparent'
        }
      },
      {
        scenario: 'Standard Conversion (10s, medium quality)',
        expectedTime: 20000,
        expectedMemory: 75 * 1024 * 1024,
        settings: {
          frameRate: 24,
          resolutionScale: 0.75,
          characterSet: 'default',
          colorMode: 'twotone',
          twoToneColors: ['#000000', '#FFFFFF'],
          background: 'black'
        }
      },
      {
        scenario: 'High Quality (15s, full quality)',
        expectedTime: 45000,
        expectedMemory: 150 * 1024 * 1024,
        settings: {
          frameRate: 24,
          resolutionScale: 1.0,
          characterSet: 'default',
          colorMode: 'fullcolor',
          background: 'transparent'
        }
      }
    ];
  }
}