// Core conversion settings interface
export interface ConversionSettings {
  frameRate: 12 | 24;
  resolutionScale: 0.5 | 0.75 | 1.0;
  characterSet: 'default' | 'custom';
  customCharacters?: string;
  colorMode: 'blackwhite' | 'twotone' | 'fullcolor';
  twoToneColors?: [string, string];
  background: 'transparent' | 'black' | 'white';
}

// Processing job status and data
export interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  settings: ConversionSettings;
  frames: ASCIIFrame[];
  error?: string;
  totalFrames?: number;
  performanceMetrics?: PerformanceMetrics;
  optimizationRecommendations?: string[];
}

// Performance monitoring interfaces
export interface PerformanceMetrics {
  conversionTime: number;
  memoryUsage: number;
  frameCount: number;
  averageFrameTime: number;
  peakMemoryUsage: number;
  processingSteps: ProcessingStep[];
}

export interface ProcessingStep {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
}

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
  colorClass?: string; // For Ghostty-style color classification
}

// Extracted frame from video
export interface ExtractedFrame {
  index: number;
  timestamp: number;
  imageData: Uint8Array;
  width: number;
  height: number;
}

// Frame extraction options for ffmpeg
export interface FrameExtractionOptions {
  fps: number;
  scale: number;
  outputFormat: 'png' | 'jpeg';
}

// ASCII conversion options
export interface ASCIIConversionOptions {
  characterSet: string;
  colorMode: 'blackwhite' | 'twotone' | 'fullcolor';
  twoToneColors?: [string, string];
  background: 'transparent' | 'black' | 'white';
  colorThreshold: number;
}

// ZIP packaging options
export interface ZipPackageOptions {
  includeReadme: boolean;
  readmeContent?: string;
  frameFormat: 'txt' | 'json';
}

// API request/response interfaces
export interface ProcessRequest {
  settings: ConversionSettings;
}

export interface ProcessResponse {
  jobId: string;
  totalFrames: number;
  estimatedTime: number;
}

export interface DownloadRequest {
  jobId: string;
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

// Performance and metrics interfaces
export interface ConversionStats {
  totalFrames: number;
  processedFrames: number;
  averageProcessingTime: number;
  totalSize: number;
  compressionRatio: number;
}

export interface PerformanceBenchmark {
  videoSize: number;
  duration: number;
  settings: ConversionSettings;
  expectedProcessingTime: number;
  memoryUsage: number;
}

export interface PerformanceResult {
  actualProcessingTime: number;
  memoryUsed: number;
  framesPerSecond: number;
  success: boolean;
  error?: string;
}

export interface MemoryMetrics {
  peakUsage: number;
  averageUsage: number;
  gcCount: number;
}

// Component prop interfaces
export interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  acceptedFormats: string[];
  maxSize: number;
  maxDuration: number;
}

export interface SettingsPanelProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  disabled: boolean;
}

export interface ProgressBarProps {
  progress: number;
  currentFrame: number;
  totalFrames: number;
  status: 'idle' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface FramePreviewProps {
  frame: ASCIIFrame | null;
  settings: ConversionSettings;
}

export interface DownloadButtonProps {
  jobId: string | null;
  disabled: boolean;
  onDownload: () => void;
}

export interface ErrorDisplayProps {
  error: APIError | null;
  onRetry?: () => void;
  onDismiss: () => void;
}

// Default values and constants
export const DEFAULT_SETTINGS: ConversionSettings = {
  frameRate: 12,
  resolutionScale: 0.75,
  characterSet: 'default',
  colorMode: 'blackwhite',
  background: 'transparent'
};

export const DEFAULT_CHARACTER_SET = ' .:-=+*#%@';

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_DURATION = 15; // 15 seconds
export const JOB_TTL = 3600000; // 1 hour in milliseconds
export const MAX_CONCURRENT_JOBS = 5;
export const CLEANUP_INTERVAL = 300000; // 5 minutes