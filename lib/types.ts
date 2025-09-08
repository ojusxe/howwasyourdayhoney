// Core types for "How Was Your Day Honey?" ASCII animation generator

// ASCII frame data structure
export interface ASCIIFrame {
  index: number;
  timestamp: number;
  asciiContent: string;
  width: number;
  height: number;
  colorData?: ColorPixel[][];
}

// Color pixel for colored ASCII output
export interface ColorPixel {
  char: string;
  color: string;
  background?: string;
  colorClass?: string; // For color classification
}

// Frame extracted from video source
export interface ExtractedFrame {
  index: number;
  timestamp: number;
  imageData: Uint8Array;
  width: number;
  height: number;
}

// ZIP packaging options
export interface ZipPackageOptions {
  includeReadme: boolean;
  readmeContent?: string;
  frameFormat: 'txt' | 'json';
}

// Error handling types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  FORMAT_ERROR = 'FORMAT_ERROR'
}

export interface APIError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

// Component prop interfaces
export interface ProgressBarProps {
  progress: number;
  currentFrame: number;
  totalFrames: number;
  status: 'idle' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface ErrorDisplayProps {
  error: APIError | null;
  onRetry?: () => void;
  onDismiss: () => void;
}

// Application constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB - increased for better video support
export const MAX_DURATION = 30; // 30 seconds - more flexible for various content
export const DEFAULT_FPS = 24; // Standard 24 FPS for smooth animation

// Optimized character set for maximum visual accuracy
// Ordered from lightest to darkest for precise luminance mapping
export const OPTIMIZED_CHARACTER_SET = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';