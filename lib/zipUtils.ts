import JSZip from 'jszip';
import { ASCIIFrame, ZipPackageOptions } from './types';

/**
 * ZIP Packager for ASCII frames with README generation
 * Creates downloadable archives for "How Was Your Day Honey?" ASCII animations
 */
export class ZipPackager {
  /**
   * Create ZIP file containing ASCII frames and documentation
   */
  async createZip(
    frames: ASCIIFrame[],
    options: ZipPackageOptions = { includeReadme: true, frameFormat: 'txt' }
  ): Promise<Blob> {
    const zip = new JSZip();

    // add frames to the zip package
    await this.addFramesToZip(zip, frames, options.frameFormat);

    // include README if requested
    if (options.includeReadme) {
      const readmeContent = options.readmeContent || this.generateReadme(frames.length);
      zip.file('README.md', readmeContent);
    }

    // add info file about the application
    zip.file('ABOUT.txt', this.generateAboutFile());

    // add conversion metadata as json
    zip.file('metadata.json', JSON.stringify({
      totalFrames: frames.length,
      generatedAt: new Date().toISOString(),
      format: options.frameFormat,
      generator: 'How Was Your Day Honey?'
    }, null, 2));

    // generate compressed zip blob
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
  }

  /**
   * Add frames to ZIP in specified format
   */
  private async addFramesToZip(
    zip: JSZip,
    frames: ASCIIFrame[],
    format: 'txt' | 'json'
  ): Promise<void> {
    const framesFolder = zip.folder('frames');
    
    if (!framesFolder) {
      throw new Error('Failed to create frames folder in ZIP');
    }

    for (const frame of frames) {
      const filename = `frame_${frame.index.toString().padStart(4, '0')}`;
      
      if (format === 'txt') {
        // save as plain text file with ascii content
        framesFolder.file(`${filename}.txt`, frame.asciiContent);
        
        // save color data separately if available
        if (frame.colorData) {
          framesFolder.file(`${filename}_colors.json`, JSON.stringify(frame.colorData, null, 2));
        }
      } else {
        // save as json with complete metadata
        const frameData = {
          index: frame.index,
          timestamp: frame.timestamp,
          width: frame.width,
          height: frame.height,
          asciiContent: frame.asciiContent,
          colorData: frame.colorData
        };
        
        framesFolder.file(`${filename}.json`, JSON.stringify(frameData, null, 2));
      }
    }
  }

  /**
   * Generate comprehensive README with usage instructions
   */
  private generateReadme(frameCount: number): string {
    const timestamp = new Date().toISOString();
    
    return `# ASCII Frame Animation

Generated on: ${timestamp}
Total frames: ${frameCount}
Created with: How Was Your Day Honey?

## Animation Details

- **Frame Rate**: 24 FPS (recommended)
- **Character Set**: ·~ox+=*%$@
- **Width**: ~100 columns
- **Processing**: Client-side (your video never left your browser!)

## File Structure

\`\`\`
frames/
├── frame_0000.txt          # ASCII content for frame 0
├── frame_0000_colors.json  # Color data (if applicable)
├── frame_0001.txt          # ASCII content for frame 1
├── ...
metadata.json               # Conversion metadata
LICENSE-ATTRIBUTION.txt     # License information
README.md                   # This file
\`\`\`

## Displaying Frames

### Basic HTML Display

\`\`\`html
<!DOCTYPE html>
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
        // Load and display frames
        const frames = []; // Load your frame data here
        let currentFrame = 0;
        
        function displayFrame(frameContent) {
            document.getElementById('ascii-display').textContent = frameContent;
        }
        
        function animate() {
            displayFrame(frames[currentFrame]);
            currentFrame = (currentFrame + 1) % frames.length;
            setTimeout(animate, 42); // ~24 FPS
        }
        
        animate();
    </script>
</body>
</html>
\`\`\`

### JavaScript Animation Class

\`\`\`javascript
class ASCIIAnimator {
    constructor(frames, fps = 24) {
        this.frames = frames;
        this.fps = fps;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.intervalId = null;
    }
    
    play(element) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.intervalId = setInterval(() => {
            element.textContent = this.frames[this.currentFrame];
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }, 1000 / this.fps);
    }
    
    pause() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    stop() {
        this.pause();
        this.currentFrame = 0;
    }
}

// Usage
const animator = new ASCIIAnimator(frameContents);
const displayElement = document.getElementById('ascii-display');
animator.play(displayElement);
\`\`\`

### Terminal Display (Node.js)

\`\`\`javascript
const fs = require('fs');
const path = require('path');

class TerminalAnimator {
    constructor(framesDir, fps = 24) {
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
            // Clear terminal
            process.stdout.write('\\x1b[2J\\x1b[H');
            
            // Display frame
            process.stdout.write(this.frames[currentFrame]);
            
            currentFrame = (currentFrame + 1) % this.frames.length;
            setTimeout(animate, 1000 / this.fps);
        };
        
        animate();
    }
}

// Usage
const animator = new TerminalAnimator('./frames');
animator.play();
\`\`\`

### React Component

\`\`\`jsx
import React, { useState, useEffect } from 'react';

const ASCIIAnimation = ({ frames, fps = 24, autoPlay = true }) => {
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    
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
                fontSize: '12px',
                margin: 0
            }}>
                {frames[currentFrame] || ''}
            </pre>
            
            <div>
                <button onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={() => setCurrentFrame(0)}>Reset</button>
            </div>
        </div>
    );
};

export default ASCIIAnimation;
\`\`\`

## Performance Tips

1. **Preload frames**: Load all frame content into memory for smooth playback
2. **Use monospace fonts**: Ensures proper character alignment
3. **Optimize frame rate**: Lower FPS reduces CPU usage
4. **Consider frame size**: Smaller frames render faster
5. **Use requestAnimationFrame**: For smoother browser animations

## Color Support

This animation uses beautiful ASCII characters with optional color data. Some frames may have associated \`_colors.json\` files containing color information for enhanced display.

### Applying Colors (Optional)

\`\`\`javascript
function applyColors(element, asciiContent, colorData) {
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
}
\`\`\`

## About

This ASCII animation was generated using "How Was Your Day Honey?" - a web application that converts videos into beautiful ASCII art animations. See ABOUT.txt for more information.

## Support

For questions about displaying these ASCII frames, refer to the examples above or consult the documentation at the ASCII Frame Generator website.
`;
  }

  /**
   * Generate about file for the application
   */
  private generateAboutFile(): string {
    return `How Was Your Day Honey? - ASCII Animation Generator

This ASCII animation was created using "How Was Your Day Honey?" - a web application that transforms your videos into beautiful ASCII art animations.

Features:
- Client-side processing (your videos never leave your browser)
- Beautiful ASCII character mapping using ·~ox+=*%$@
- Optimized for terminal display and retro aesthetics
- Downloadable text files for easy sharing and playback

How to Play Your Animation:
1. Use the provided shell scripts or commands in the README
2. Each frame is a separate .txt file for maximum compatibility
3. Adjust timing between frames for smooth playback

Created with love for terminal art enthusiasts!

Generated on: ${new Date().toISOString()}
Visit: https://github.com/your-repo/how-was-your-day-honey
`;
  }

  /**
   * Calculate compression statistics
   */
  calculateCompressionStats(
    originalSize: number,
    compressedSize: number
  ): { ratio: number; savings: number; savingsPercent: number } {
    const ratio = originalSize / compressedSize;
    const savings = originalSize - compressedSize;
    const savingsPercent = (savings / originalSize) * 100;

    return {
      ratio: Math.round(ratio * 100) / 100,
      savings,
      savingsPercent: Math.round(savingsPercent * 100) / 100
    };
  }

  /**
   * Validate frames before packaging
   */
  validateFrames(frames: ASCIIFrame[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!frames || frames.length === 0) {
      errors.push('No frames provided for packaging');
      return { valid: false, errors };
    }

    // Check for missing frame indices
    const indices = frames.map(f => f.index).sort((a, b) => a - b);
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] !== i) {
        errors.push(`Missing frame at index ${i}`);
      }
    }

    // Check for empty content
    const emptyFrames = frames.filter(f => !f.asciiContent || f.asciiContent.trim().length === 0);
    if (emptyFrames.length > 0) {
      errors.push(`${emptyFrames.length} frames have empty content`);
    }

    // Check for consistent dimensions
    const firstFrame = frames[0];
    const inconsistentFrames = frames.filter(f => 
      f.width !== firstFrame.width || f.height !== firstFrame.height
    );
    if (inconsistentFrames.length > 0) {
      errors.push(`${inconsistentFrames.length} frames have inconsistent dimensions`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance for reuse
let zipPackagerInstance: ZipPackager | null = null;

export function getZipPackager(): ZipPackager {
  if (!zipPackagerInstance) {
    zipPackagerInstance = new ZipPackager();
  }
  return zipPackagerInstance;
}