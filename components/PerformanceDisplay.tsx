'use client';

import { PerformanceMetrics } from '@/lib/types';

interface PerformanceDisplayProps {
  metrics?: PerformanceMetrics;
  recommendations?: string[];
}

export default function PerformanceDisplay({ metrics, recommendations }: PerformanceDisplayProps) {
  if (!metrics) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${Math.round(bytes / 1024)}KB`;
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {formatTime(metrics.conversionTime)}
          </div>
          <div className="text-xs text-gray-500">Total Time</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {formatMemory(metrics.peakMemoryUsage)}
          </div>
          <div className="text-xs text-gray-500">Peak Memory</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {metrics.frameCount}
          </div>
          <div className="text-xs text-gray-500">Frames</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-orange-600">
            {formatTime(metrics.averageFrameTime)}
          </div>
          <div className="text-xs text-gray-500">Avg/Frame</div>
        </div>
      </div>

      {metrics.processingSteps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Processing Steps</h4>
          <div className="space-y-1">
            {metrics.processingSteps.map((step, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-gray-600">{step.name}</span>
                <span className="font-mono text-gray-800">{formatTime(step.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Optimization Tips</h4>
          <ul className="space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="text-yellow-500 mr-1">💡</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}