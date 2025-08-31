import JSZip from 'jszip';
import { ASCIIFrame, ZipPackageOptions, ConversionSettings } from './types';

/**
 * ZIP Packager for ASCII frames with README generation
 * Includes proper license attribution for Ghostty-inspired logic
 */
export class ZipPackager {
  /**
   * Create ZIP file containing ASCII frames and documentation
   */
  async createZip(
    frames: ASCIIFrame[],
    settings: ConversionSettings,
    options: ZipPackageOptions = { includeReadme: true, frameFormat: 'txt' }
  ): Promise<Blob> {
    const zip = new JSZip();

    // add frames to the zip package
    await this.addFramesToZip(zip, frames, options.frameFormat);

    // include README if requested
    if (options.includeReadme) {
      const readmeContent = options.readmeContent || this.generateReadme(settings, frames.length);
      zip.file('README.md', readmeContent);
    }

    // add license attribution for ghostty-inspired logic
    zip.file('LICENSE-ATTRIBUTION.txt', this.generateLicenseAttribution());

    // add conversion metadata as json
    zip.file('metadata.json', JSON.stringify({
      totalFrames: frames.length,
      settings,
      generatedAt: new Date().toISOString(),
      format: options.frameFormat
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
  private generateReadme(settings: ConversionSettings, frameCount: number): string {
    const timestamp = new Date().toISOString();
    
    return `# ASCII Frame Animation

Generated on: ${timestamp}
Total frames: ${frameCount}

## Conversion Settings

- **Frame Rate**: ${settings.frameRate} FPS
- **Resolution Scale**: ${(settings.resolutionScale * 100).toFixed(0)}%
- **Character Set**: ${settings.characterSet}${settings.customCharacters ? ` (${settings.customCharacters})` : ''}
- **Color Mode**: ${settings.colorMode}
- **Background**: ${settings.background}
${settings.twoToneColors ? `- **Two-tone Colors**: ${settings.twoToneColors.join(', ')}\n` : ''}

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
            setTimeout(animate, ${Math.round(1000 / settings.frameRate)}); // ${settings.frameRate} FPS
        }
        
        animate();
    </script>
</body>
</html>
\`\`\`

### JavaScript Animation Class

\`\`\`javascript
class ASCIIAnimator {
    constructor(frames, fps = ${settings.frameRate}) {
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
    constructor(framesDir, fps = ${settings.frameRate}) {
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

const ASCIIAnimation = ({ frames, fps = ${settings.frameRate}, autoPlay = true }) => {
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

${settings.colorMode !== 'blackwhite' ? `This animation includes color data. Each frame may have an associated \`_colors.json\` file containing color information for each character.

### Applying Colors

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
` : 'This animation uses black and white ASCII characters only.'}

## License

This ASCII animation was generated using conversion logic inspired by the Ghostty terminal emulator project, which is licensed under the MIT License. See LICENSE-ATTRIBUTION.txt for full attribution details.

## Support

For questions about displaying these ASCII frames, refer to the examples above or consult the documentation at the ASCII Frame Generator website.
`;
  }

  /**
   * Generate license attribution file
   */
  private generateLicenseAttribution(): string {
    return `ASCII Frame Generator - License Attribution

This ASCII animation was generated using conversion algorithms inspired by the Ghostty terminal emulator project.

Ghostty Project Information:
- Repository: https://github.com/ghostty-org/ghostty
- License: MIT License
- Original conversion logic: bin/video-to-terminal script

MIT License (Ghostty)

Copyright (c) 2024 Ghostty Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

ASCII Frame Generator

The ASCII Frame Generator application that created this animation is a separate
project that uses conversion logic inspired by Ghostty's MIT-licensed algorithms.
The generated ASCII frames and this documentation are provided as-is for your use.

Generated on: ${new Date().toISOString()}
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