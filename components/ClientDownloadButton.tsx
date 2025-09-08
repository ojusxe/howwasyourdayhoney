'use client';

import { useState } from 'react';
import JSZip from 'jszip';

interface ClientDownloadButtonProps {
  frames: string[];
  disabled?: boolean;
  onDownload?: () => void;
  filename?: string;
}

export default function ClientDownloadButton({ 
  frames, 
  disabled, 
  onDownload,
  filename = 'ascii-animation'
}: ClientDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateZip = async () => {
    if (disabled || frames.length === 0) return;

    setIsGenerating(true);

    try {
      const zip = new JSZip();

      // Add each frame as a text file
      frames.forEach((frame, index) => {
        const frameNumber = (index + 1).toString().padStart(4, '0');
        zip.file(`frame-${frameNumber}.txt`, frame);
      });

      // Add README with instructions
      const readme = `# ASCII Animation Files

This archive contains ${frames.length} ASCII art frames extracted from your video.

## Files
- frame-XXXX.txt: Individual ASCII frames (frame-0001.txt, frame-0002.txt, etc.)

## Usage
You can display these frames in sequence to create an ASCII animation:

### Terminal Animation (Linux/macOS)
\`\`\`bash
for file in frame-*.txt; do
  clear
  cat "$file"
  sleep 0.04  # ~24 FPS
done
\`\`\`

### PowerShell Animation (Windows)
\`\`\`powershell
Get-ChildItem frame-*.txt | ForEach-Object {
  Clear-Host
  Get-Content $_.FullName
  Start-Sleep -Milliseconds 42  # ~24 FPS
}
\`\`\`

## Frame Details
- Total frames: ${frames.length}
- Frame Rate: 24 FPS (cinema standard)
- Character width: ~120 columns for optimal detail
- Generated with "How Was Your Day Honey?" ASCII converter

Enjoy your ASCII animation!
`;

      zip.file('README.md', readme);

      // Generate and download the zip
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Create download link
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onDownload?.();
    } catch (error) {
      console.error('Failed to generate ZIP:', error);
      alert('Failed to generate download. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={generateZip}
        disabled={disabled || isGenerating || frames.length === 0}
        className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Generating ZIP...</span>
          </span>
        ) : (
          `Download ASCII Files (${frames.length} frames)`
        )}
      </button>
      
      {frames.length > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          ZIP will contain {frames.length} text files + README
        </p>
      )}
    </div>
  );
}