import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Documentation</h1>
          <p className="text-lg text-gray-600 mb-8">
            Learn how to use the ASCII Frame Generator and display your converted frames.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Start</h2>
            <p className="text-blue-800">
              Upload a video → Configure settings → Download ASCII frames → Display in your project
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <p className="text-gray-700 mb-4">
              The ASCII Frame Generator converts short videos (10-15 seconds, up to 25MB) 
              into ASCII art frames that can be displayed in terminals, web pages, or other applications.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Supported Formats</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Video formats:</strong> MP4, WebM</li>
              <li><strong>Maximum file size:</strong> 25MB</li>
              <li><strong>Maximum duration:</strong> 15 seconds</li>
              <li><strong>Frame rates:</strong> 12 FPS or 24 FPS</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Instructions</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Upload a video file using drag-and-drop or file selection</li>
              <li>Configure conversion settings (frame rate, resolution, colors)</li>
              <li>Click "Start Conversion" and wait for processing to complete</li>
              <li>Download the ZIP file containing your ASCII frames and documentation</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversion Settings</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Frame Rate</h3>
                <p className="text-sm text-gray-600 mb-2">Controls animation smoothness and file size</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>12 FPS:</strong> Smaller files, choppy animation</li>
                  <li><strong>24 FPS:</strong> Larger files, smooth animation</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Resolution Scale</h3>
                <p className="text-sm text-gray-600 mb-2">Affects detail level and processing time</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>50%:</strong> Fast processing, less detail</li>
                  <li><strong>75%:</strong> Balanced quality and speed</li>
                  <li><strong>100%:</strong> Full detail, slower processing</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Character Set</h3>
                <p className="text-sm text-gray-600 mb-2">Characters used for ASCII art</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Default:</strong> <code className="bg-white px-1 rounded"> .:-=+*#%@</code></li>
                  <li><strong>Custom:</strong> Define your own character set</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Color Modes</h3>
                <p className="text-sm text-gray-600 mb-2">How colors are handled in output</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Black & White:</strong> Monochrome ASCII</li>
                  <li><strong>Two-tone:</strong> Two custom colors</li>
                  <li><strong>Full-color:</strong> RGB color approximation</li>
                </ul>
              </div>
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
├── LICENSE-ATTRIBUTION.txt     # License information
└── README.md                   # Complete usage guide`}
            </pre>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Metadata Format</h3>
            <p className="text-gray-700 mb-4">The metadata.json file contains:</p>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`{
  "totalFrames": 24,
  "settings": {
    "frameRate": 12,
    "resolutionScale": 0.75,
    "characterSet": "default",
    "colorMode": "blackwhite",
    "background": "transparent"
  },
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">License & Attribution</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                This project uses conversion logic inspired by the{' '}
                <a 
                  href="https://github.com/ghostty-org/ghostty" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Ghostty terminal emulator
                </a>
                , which is licensed under the MIT License.
              </p>
              
              <p className="text-gray-700 mb-4">
                The ASCII conversion algorithms use Manhattan distance color thresholding 
                and character mapping techniques adapted from Ghostty's video-to-terminal script.
              </p>

              <p className="text-sm text-gray-600">
                Full license attribution is included in every downloaded ZIP file 
                as LICENSE-ATTRIBUTION.txt.
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