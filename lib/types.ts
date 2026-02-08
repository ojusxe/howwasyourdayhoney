export interface ASCIIFrame {
  index: number;
  timestamp: number;
  asciiContent: string;
  width: number;
  height: number;
  colorData?: ColorPixel[][];
}

export interface VideoProcessingSettings {
  contrast: number;
  brightness: number;
  width: number;
  useCustomCharacterSet: boolean;
  customCharacterSet: string;
}

export type ViewState = "landing" | "upload" | "processing" | "player" | "docs";

export interface ColorPixel {
  char: string;
  color: string;
  background?: string;
  colorClass?: string;
}

export interface ExtractedFrame {
  index: number;
  timestamp: number;
  imageData: Uint8Array;
  width: number;
  height: number;
}

export interface ZipPackageOptions {
  includeReadme: boolean;
  readmeContent?: string;
  frameFormat: 'txt' | 'json';
}

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

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_DURATION = 30;
export const DEFAULT_FPS = 24;

// Ordered from lightest to darkest for precise luminance mapping
export const OPTIMIZED_CHARACTER_SET = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';