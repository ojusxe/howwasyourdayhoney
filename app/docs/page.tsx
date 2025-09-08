import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">How Was Your Day Honey? - Documentation</h1>
          <p className="text-lg text-gray-600 mb-8">
            Learn how to create beautiful ASCII art animations from your videos, all processed in your browser!
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Start</h2>
            <p className="text-blue-800">
              Upload a video → Process in browser → Download ASCII frames → Display anywhere!
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <p className="text-gray-700 mb-4">
              "How Was Your Day Honey?" converts short videos (up to 15 seconds, 25MB max) 
              into beautiful ASCII art animations. All processing happens in your browser - 
              your videos never leave your device!
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Supported Formats</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Video formats:</strong> MP4, WebM, AVI, MOV</li>
              <li><strong>Maximum file size:</strong> 50MB</li>
              <li><strong>Maximum duration:</strong> 30 seconds</li>
              <li><strong>Frame rate:</strong> 24 FPS (cinema standard)</li>
              <li><strong>Works with:</strong> Any animated content - movies, games, animations, screen recordings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Instructions</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Upload a video file using drag-and-drop or file selection</li>
              <li>Click "Start Conversion" and watch the magic happen in your browser</li>
              <li>Preview your ASCII animation with the built-in player</li>
              <li>Download the ZIP file containing your ASCII frames and documentation</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🎥</div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Upload Video</h3>
                <p className="text-sm text-gray-600">
                  Drag & drop or select your video file. Supports MP4 and WebM formats.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Browser Magic</h3>
                <p className="text-sm text-gray-600">
                  FFmpeg.wasm extracts frames and converts them to ASCII art using luminance mapping.
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📦</div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Download & Enjoy</h3>
                <p className="text-sm text-gray-600">
                  Get a ZIP with ASCII frames, usage examples, and complete documentation.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Optimized Character Set</h3>
              <p className="text-sm text-gray-600 mb-2">We use a 70+ character set optimized for maximum visual accuracy:</p>
              <div className="bg-white px-3 py-2 rounded font-mono text-sm tracking-tight break-all">
                {' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'}
              </div>
              <p className="text-xs text-gray-500 mt-2">From lightest (space) to darkest ($) with gamma correction for optimal visual perception</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Displaying ASCII Frames</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> All code examples below are included in the README.md file of your downloaded ZIP.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">HTML/JavaScript</h3>
            <p className="text-gray-700 mb-4">Basic web page animation:</p>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`<!DOCTYPE html>
<html>
<head>
    <style>
        .ascii-frame {
            font-family: 'Courier New', monospace;
            line-height: 1;
            white-space: pre;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div id="ascii-display" class="ascii-frame"></div>
    
    <script>
        const frames = []; // Load your frame data here
        let currentFrame = 0;
        
        function animate() {
            document.getElementById('ascii-display').textContent = frames[currentFrame];
            currentFrame = (currentFrame + 1) % frames.length;
            setTimeout(animate, 83); // 12 FPS
        }
        
        animate();
    </script>
</body>
</html>`}
            </pre>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">React Component</h3>
            <p className="text-gray-700 mb-4">For React applications:</p>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`import React, { useState, useEffect } from 'react';

const ASCIIAnimation = ({ frames, fps = 12 }) => {
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    
    useEffect(() => {
        if (!isPlaying || frames.length === 0) return;
        
        const interval = setInterval(() => {
            setCurrentFrame(prev => (prev + 1) % frames.length);
        }, 1000 / fps);
        
        return () => clearInterval(interval);
    }, [isPlaying, frames.length, fps]);
    
    return (
        <div>
            <pre style={{
                fontFamily: 'Courier New, monospace',
                lineHeight: 1,
                fontSize: '12px'
            }}>
                {frames[currentFrame] || ''}
            </pre>
            <button onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>
        </div>
    );
};`}
            </pre>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Terminal Animation (Node.js)</h3>
            <p className="text-gray-700 mb-4">For command-line applications:</p>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`const fs = require('fs');
const path = require('path');

class TerminalAnimator {
    constructor(framesDir, fps = 12) {
        this.framesDir = framesDir;
        this.fps = fps;
        this.frames = this.loadFrames();
    }
    
    loadFrames() {
        const files = fs.readdirSync(this.framesDir)
            .filter(f => f.endsWith('.txt'))
            .sort();
        
        return files.map(file => 
            fs.readFileSync(path.join(this.framesDir, file), 'utf8')
        );
    }
    
    play() {
        let currentFrame = 0;
        
        const animate = () => {
            // Clear terminal and display frame
            process.stdout.write('\\x1b[2J\\x1b[H');
            process.stdout.write(this.frames[currentFrame]);
            
            currentFrame = (currentFrame + 1) % this.frames.length;
            setTimeout(animate, 1000 / this.fps);
        };
        
        animate();
    }
}

// Usage
const animator = new TerminalAnimator('./frames');
animator.play();`}
            </pre>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Color Support</h3>
            <p className="text-gray-700 mb-4">
              If you used two-tone or full-color mode, your ZIP will include color data files. 
              Here's how to apply colors in HTML:
            </p>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`function applyColors(element, asciiContent, colorData) {
    const lines = asciiContent.split('\\n');
    element.innerHTML = '';
    
    lines.forEach((line, y) => {
        const lineDiv = document.createElement('div');
        
        for (let x = 0; x < line.length; x++) {
            const char = line[x];
            const span = document.createElement('span');
            span.textContent = char;
            
            if (colorData && colorData[y] && colorData[y][x]) {
                const colorInfo = colorData[y][x];
                span.style.color = colorInfo.color;
                if (colorInfo.background) {
                    span.style.backgroundColor = colorInfo.background;
                }
            }
            
            lineDiv.appendChild(span);
        }
        
        element.appendChild(lineDiv);
    });
}`}
            </pre>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Tips</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Best Practices</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>Preload all frames into memory</li>
                  <li>Use monospace fonts for proper alignment</li>
                  <li>Use requestAnimationFrame for smooth browser animations</li>
                  <li>Consider frame caching for repeated playback</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Avoid</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>Loading frames synchronously during playback</li>
                  <li>Using proportional fonts</li>
                  <li>Setting frame rates higher than 30 FPS</li>
                  <li>Displaying very large frames without scaling</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">File Structure</h2>
            <p className="text-gray-700 mb-4">Your downloaded ZIP file contains:</p>
            
            <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm mb-4">
{`ascii-frames-[jobId]-[timestamp].zip
├── frames/
│   ├── frame_0000.txt          # ASCII content for frame 0
│   ├── frame_0000_colors.json  # Color data (if applicable)
│   ├── frame_0001.txt          # ASCII content for frame 1
│   └── ...
├── metadata.json               # Conversion settings and info
├── ABOUT.txt                   # About the application
└── README.md                   # Complete usage guide`}
            </pre>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Metadata Format</h3>
            <p className="text-gray-700 mb-4">The metadata.json file contains:</p>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`{
  "totalFrames": 24,
  "generator": "How Was Your Day Honey?",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "format": "txt"
}`}
            </pre>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Animation appears choppy</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Try using 24 FPS instead of 12 FPS</li>
                  <li>• Ensure consistent timing in your animation loop</li>
                  <li>• Use requestAnimationFrame for browser animations</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Characters don't align properly</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Use a monospace font (Courier New, Consolas, Monaco)</li>
                  <li>• Set line-height to 1 and white-space to pre</li>
                  <li>• Ensure consistent font size across all frames</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Colors not displaying</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Check if color data files (*_colors.json) exist</li>
                  <li>• Ensure you're applying colors using the provided examples</li>
                  <li>• Verify the color mode was set to two-tone or full-color</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Performance issues</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Preload all frames before starting animation</li>
                  <li>• Consider reducing frame rate or resolution scale</li>
                  <li>• Use efficient DOM manipulation techniques</li>
                  <li>• Implement frame caching for repeated playback</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy & Security</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">🔒 Your Privacy Matters</h3>
              <ul className="text-green-800 space-y-2">
                <li>• <strong>No uploads:</strong> Your videos never leave your browser</li>
                <li>• <strong>No tracking:</strong> We don't collect or store any personal data</li>
                <li>• <strong>No servers:</strong> All processing happens on your device</li>
                <li>• <strong>No limits:</strong> Process as many videos as you want</li>
              </ul>
              
              <p className="text-green-700 mt-4 text-sm">
                This is how video processing should be - private, secure, and entirely under your control.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-700 mb-4">
              If you encounter issues or have questions:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Check the troubleshooting section above</li>
              <li>Review the complete README.md in your downloaded ZIP</li>
              <li>Ensure your video meets the format requirements</li>
              <li>Try different conversion settings for better results</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}