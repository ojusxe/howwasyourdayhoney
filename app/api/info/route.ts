import { NextResponse } from 'next/server';

export async function GET() {
  const info = {
    videoRequirements: {
      formats: ['MP4', 'WebM'],
      maxSize: '25MB',
      maxDuration: '15 seconds',
      recommendedResolution: '1920x1080 or lower',
      recommendedFrameRate: '24-30 FPS'
    },
    asciiConversion: {
      outputColumns: 100,
      outputFPS: 24,
      fontRatio: 0.44, // Width to height ratio of terminal characters
      characterSet: '·~ox+=*%$@', // Luminance-based characters
      colorSupport: {
        blackwhite: 'Pure ASCII with luminance mapping',
        twotone: 'Two-color ASCII with distance-based color detection',
        fullcolor: 'Full-color ASCII with RGB color preservation'
      }
    },
    limitations: {
      serverSide: 'Currently using mock processing for demonstration',
      ffmpeg: 'FFmpeg.wasm requires browser environment for full video processing',
      performance: 'Processing time depends on video length and quality settings',
      memory: 'Large videos may exceed memory limits in browser environment'
    },
    ghosttyLogic: {
      luminanceFormula: 'Relative luminance: 0.2126*R + 0.7152*G + 0.0722*B',
      colorDistance: 'Manhattan distance: |R1-R2| + |G1-G2| + |B1-B2|',
      characterMapping: 'Luminance scaled to 0-9 range mapped to character set',
      aspectRatio: 'Images are squished by font ratio (0.44) to maintain proportions'
    },
    bestPractices: {
      videoContent: [
        'High contrast videos work best',
        'Avoid very dark or very bright scenes',
        'Simple shapes and movements are more recognizable',
        'Text and graphics convert better than complex scenes'
      ],
      settings: [
        'Use 12 FPS for smoother playback on slower devices',
        'Use 0.5 resolution scale for faster processing',
        'Black & white mode for classic ASCII art look',
        'Two-tone mode for specific color themes'
      ]
    }
  };

  return NextResponse.json(info);
}