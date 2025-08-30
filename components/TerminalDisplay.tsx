/**
 * Terminal Display Component
 * Renders ASCII frames in a terminal-like interface similar to Ghostty
 */

import React from 'react';
import { ASCIIFrame } from '@/lib/types';

interface TerminalDisplayProps {
  frame: ASCIIFrame | null;
  title?: string;
  fontSize?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function TerminalDisplay({ 
  frame, 
  title = "ASCII Video", 
  fontSize = 'medium',
  className = '' 
}: TerminalDisplayProps) {
  if (!frame) {
    return (
      <div className={`terminal-display ${className}`}>
        <div className="terminal-header">
          <div className="terminal-controls">
            <div className="control-button close"></div>
            <div className="control-button minimize"></div>
            <div className="control-button maximize"></div>
          </div>
          <div className="terminal-title">{title}</div>
        </div>
        <div className="terminal-content">
          <div className="terminal-prompt">Waiting for video conversion...</div>
        </div>
      </div>
    );
  }

  // Process the ASCII content to add Ghostty-style blue highlighting
  const processedContent = frame.asciiContent
    .split('\n')
    .map((line, lineIndex) => {
      // Convert line to HTML with blue character highlighting
      let processedLine = '';
      let inBlueSpan = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const colorPixel = frame.colorData?.[lineIndex]?.[i];
        
        if (colorPixel?.colorClass === 'b' && !inBlueSpan) {
          processedLine += '<span class="b">';
          inBlueSpan = true;
        } else if (colorPixel?.colorClass !== 'b' && inBlueSpan) {
          processedLine += '</span>';
          inBlueSpan = false;
        }
        
        processedLine += char;
      }
      
      if (inBlueSpan) {
        processedLine += '</span>';
      }
      
      return processedLine;
    });

  return (
    <div className={`terminal-display ${fontSize} ${className}`}>
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="control-button close"></div>
          <div className="control-button minimize"></div>
          <div className="control-button maximize"></div>
        </div>
        <div className="terminal-title">{title}</div>
      </div>
      <div className="terminal-content">
        {processedContent.map((line, index) => (
          <div 
            key={index} 
            className="terminal-line"
            dangerouslySetInnerHTML={{ __html: line }}
          />
        ))}
      </div>
      
      <style jsx>{`
        .terminal-display {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .terminal-header {
          background: #2d2d2d;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #333;
        }
        
        .terminal-controls {
          display: flex;
          gap: 6px;
          margin-right: 12px;
        }
        
        .control-button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .control-button.close {
          background: #ff5f56;
        }
        
        .control-button.minimize {
          background: #ffbd2e;
        }
        
        .control-button.maximize {
          background: #27ca3f;
        }
        
        .terminal-title {
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          flex: 1;
          text-align: center;
        }
        
        .terminal-content {
          background: #000;
          color: #fff;
          padding: 12px;
          overflow-x: auto;
          min-height: 200px;
        }
        
        .terminal-line {
          white-space: pre;
          line-height: 1.2;
        }
        
        .terminal-prompt {
          color: #888;
          font-style: italic;
        }
        
        /* Ghostty-style blue highlighting */
        .terminal-content :global(.b) {
          color: #0066ff;
          font-weight: bold;
        }
        
        /* Font sizes */
        .small .terminal-content {
          font-size: 10px;
        }
        
        .medium .terminal-content {
          font-size: 12px;
        }
        
        .large .terminal-content {
          font-size: 14px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .terminal-display {
            border-radius: 4px;
          }
          
          .terminal-content {
            padding: 8px;
            font-size: 10px;
          }
          
          .large .terminal-content {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}