import { FFmpegWorker } from '../ffmpegWorker';
import { MAX_FILE_SIZE, MAX_DURATION } from '../types';

// Mock FFmpeg
jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    load: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    listDir: jest.fn().mockResolvedValue([]),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  }))
}));

jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn(),
  toBlobURL: jest.fn().mockResolvedValue('blob://test-url'),
}));

describe('FFmpegWorker', () => {
  let worker: FFmpegWorker;

  beforeEach(() => {
    worker = new FFmpegWorker();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob://test');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateVideo', () => {
    it('should reject files that are too large', async () => {
      const largeFile = new File([''], 'test.mp4', {
        type: 'video/mp4',
        size: MAX_FILE_SIZE + 1
      }) as File;

      const result = await worker.validateVideo(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject invalid file formats', async () => {
      const invalidFile = new File([''], 'test.avi', {
        type: 'video/avi',
        size: 1000
      }) as File;

      const result = await worker.validateVideo(invalidFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });

    it('should accept valid MP4 files', async () => {
      const validFile = new File([''], 'test.mp4', {
        type: 'video/mp4',
        size: 1000
      }) as File;

      // Mock video element
      const mockVideo = {
        duration: 10,
        onloadedmetadata: null as any,
        onerror: null as any,
        set src(value: string) {
          // Simulate successful load
          setTimeout(() => {
            if (this.onloadedmetadata) {
              this.onloadedmetadata();
            }
          }, 0);
        }
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockVideo as any);

      const result = await worker.validateVideo(validFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject videos that are too long', async () => {
      const validFile = new File([''], 'test.mp4', {
        type: 'video/mp4',
        size: 1000
      }) as File;

      // Mock video element with long duration
      const mockVideo = {
        duration: MAX_DURATION + 1,
        onloadedmetadata: null as any,
        onerror: null as any,
        set src(value: string) {
          setTimeout(() => {
            if (this.onloadedmetadata) {
              this.onloadedmetadata();
            }
          }, 0);
        }
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockVideo as any);

      const result = await worker.validateVideo(validFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed duration');
    });
  });

  describe('extractFrames', () => {
    it('should extract frames from video buffer', async () => {
      const videoBuffer = new ArrayBuffer(1000);
      const options = {
        fps: 12,
        scale: 1.0,
        outputFormat: 'png' as const
      };

      // Mock Image for dimension calculation
      const mockImage = {
        width: 640,
        height: 480,
        onload: null as any,
        onerror: null as any,
        set src(value: string) {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      };

      global.Image = jest.fn().mockImplementation(() => mockImage);
      global.Blob = jest.fn().mockImplementation(() => ({}));

      const frames = await worker.extractFrames(videoBuffer, options);

      expect(frames).toHaveLength(1);
      expect(frames[0]).toMatchObject({
        index: 0,
        timestamp: 0,
        width: 640,
        height: 480
      });
    });

    it('should call progress callback during extraction', async () => {
      const videoBuffer = new ArrayBuffer(1000);
      const options = {
        fps: 12,
        scale: 1.0,
        outputFormat: 'png' as const
      };
      const onProgress = jest.fn();

      // Mock Image
      const mockImage = {
        width: 640,
        height: 480,
        onload: null as any,
        onerror: null as any,
        set src(value: string) {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      };

      global.Image = jest.fn().mockImplementation(() => mockImage);
      global.Blob = jest.fn().mockImplementation(() => ({}));

      await worker.extractFrames(videoBuffer, options, onProgress);

      expect(onProgress).toHaveBeenCalledWith(1);
    });
  });

  describe('cleanup', () => {
    it('should clean up FFmpeg filesystem', async () => {
      await worker.cleanup();
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });
});