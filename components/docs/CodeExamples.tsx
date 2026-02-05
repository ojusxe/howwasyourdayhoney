import { CodeBlock } from "@/components/ui/code-block";

export default function CodeExamples() {
  return (
    <section>
      <h2 className="text-xl font-bold text-green-400 mb-4 font-mono">displaying ASCII frames</h2>
      
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <p className="text-green-300 text-sm font-mono">
          <span className="text-green-400">note:</span> all code examples below are included in the README.md file of your downloaded ZIP.
        </p>
      </div>

      <h3 className="text-lg font-semibold text-white mb-3 font-mono">html/javascript</h3>
      <p className="text-gray-400 mb-4 text-sm font-mono">basic web page animation:</p>
      
      <div className="mb-6">
        <CodeBlock 
          language="html"
          code={`<!DOCTYPE html>
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
        />
      </div>

      <h3 className="text-lg font-semibold text-white mb-3 font-mono">react component</h3>
      <p className="text-gray-400 mb-4 text-sm font-mono">for react applications:</p>
      
      <div className="mb-6">
        <CodeBlock 
          language="tsx"
          code={`import React, { useState, useEffect } from 'react';

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
        />
      </div>

      <h3 className="text-lg font-semibold text-white mb-3 font-mono">terminal animation (node.js)</h3>
      <p className="text-gray-400 mb-4 text-sm font-mono">for command-line applications:</p>
      
      <div className="mb-6">
        <CodeBlock 
          language="javascript"
          code={`const fs = require('fs');
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
        />
      </div>
    </section>
  );
}
