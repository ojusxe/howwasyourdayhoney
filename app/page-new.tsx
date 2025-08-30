"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GhosttyUploadProcessor from "@/components/GhosttyUploadProcessor";
import AnimatedTerminal from "@/components/AnimatedTerminal";
import DownloadButton from "@/components/DownloadButton";
import PerformanceDisplay from "@/components/PerformanceDisplay";

export default function Home() {
  const [result, setResult] = useState<any>(null);

  const handleProcessingComplete = (jobResult: any) => {
    console.log('Processing complete:', jobResult);
    setResult(jobResult);
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!result ? (
          <GhosttyUploadProcessor 
            onProcessingComplete={handleProcessingComplete}
          />
        ) : (
          <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                ASCII Animation Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your video has been converted using Ghostty's exact algorithm
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Convert Another Video
              </button>
            </div>

            {result.frames && result.frames.length > 0 && (
              <div className="space-y-6">
                <AnimatedTerminal
                  frames={result.frames}
                  fps={24}
                  loop={true}
                />
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      const content = result.frames.map((frame: any) => frame.asciiContent).join('\n\n');
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'ghostty-animation.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download TXT
                  </button>
                  <button
                    onClick={() => {
                      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Ghostty ASCII Animation</title>
  <style>
    body { background: black; color: white; font-family: monospace; }
    .frame { white-space: pre; }
    .b { color: #0000e6; }
  </style>
</head>
<body>
${result.frames.map((frame: any, index: number) => 
  `<div class="frame" id="frame-${index}">${frame.asciiContent}</div>`
).join('\n')}
</body>
</html>`;
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'ghostty-animation.html';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download HTML
                  </button>
                </div>
              </div>
            )}

            {result.performanceMetrics && (
              <PerformanceDisplay metrics={result.performanceMetrics} />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Processing Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Frames:</span>
                  <div className="font-mono">{result.frames?.length || 0}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <div className="font-mono">{((result.frames?.length || 0) / 24).toFixed(1)}s</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Frame Rate:</span>
                  <div className="font-mono">24 FPS</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                  <div className="font-mono">100×44</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
