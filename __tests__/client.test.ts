/**
 * Client-side processing tests for "How Was Your Day Honey?"
 */

import { convertFrameToAscii } from '@/lib/clientAsciiConverter';
import { DEFAULT_CHARACTER_SET } from '@/lib/types';

// Mock browser APIs for testing
global.createImageBitmap = jest.fn();
global.OffscreenCanvas = jest.fn();

describe('Client-side ASCII Conversion', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('convertFrameToAscii', () => {
    it('should handle basic conversion options', async () => {
      // Mock ImageBitmap
      const mockImageBitmap = {
        width: 100,
        height: 50,
        close: jest.fn()
      };

      // Mock Canvas context
      const mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(100 * 50 * 4).fill(128), // Gray pixels
          width: 100,
          height: 50
        }))
      };

      // Mock OffscreenCanvas
      const mockCanvas = {
        getContext: jest.fn(() => mockContext)
      };

      (global.createImageBitmap as jest.Mock).mockResolvedValue(mockImageBitmap);
      (global.OffscreenCanvas as jest.Mock).mockImplementation(() => mockCanvas);

      const mockBlob = new Blob(['test'], { type: 'image/png' });
      
      const result = await convertFrameToAscii(mockBlob, {
        width: 100,
        characterSet: DEFAULT_CHARACTER_SET
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(mockImageBitmap.close).toHaveBeenCalled();
    });

    it('should use default character set when not provided', async () => {
      const mockImageBitmap = {
        width: 10,
        height: 10,
        close: jest.fn()
      };

      const mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(10 * 10 * 4).fill(255), // White pixels
          width: 10,
          height: 10
        }))
      };

      const mockCanvas = {
        getContext: jest.fn(() => mockContext)
      };

      (global.createImageBitmap as jest.Mock).mockResolvedValue(mockImageBitmap);
      (global.OffscreenCanvas as jest.Mock).mockImplementation(() => mockCanvas);

      const mockBlob = new Blob(['test'], { type: 'image/png' });
      
      const result = await convertFrameToAscii(mockBlob);

      expect(result).toBeDefined();
      // Should use default character set
      expect(result).toMatch(/[·~ox+=*%$@\s\n]/);
    });

    it('should handle different image sizes', async () => {
      const mockImageBitmap = {
        width: 200,
        height: 100,
        close: jest.fn()
      };

      const mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(100 * 50 * 4).fill(64), // Darker pixels
          width: 100,
          height: 50
        }))
      };

      const mockCanvas = {
        getContext: jest.fn(() => mockContext)
      };

      (global.createImageBitmap as jest.Mock).mockResolvedValue(mockImageBitmap);
      (global.OffscreenCanvas as jest.Mock).mockImplementation(() => mockCanvas);

      const mockBlob = new Blob(['test'], { type: 'image/png' });
      
      const result = await convertFrameToAscii(mockBlob, { width: 50 });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockImageBitmap.close).toHaveBeenCalled();
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockImageBitmap, 0, 0, 50, 12);
    });

    it('should throw error when createImageBitmap is not supported', async () => {
      const originalCreateImageBitmap = global.createImageBitmap;
      delete (global as any).createImageBitmap;

      const mockBlob = new Blob(['test'], { type: 'image/png' });

      await expect(convertFrameToAscii(mockBlob)).rejects.toThrow(
        'Your browser does not support ImageBitmap API'
      );

      // Restore
      global.createImageBitmap = originalCreateImageBitmap;
    });
  });
});

describe('Character Set', () => {
  it('should use the correct default character set', () => {
    expect(DEFAULT_CHARACTER_SET).toBe('·~ox+=*%$@');
  });

  it('should have characters ordered from light to dark', () => {
    // The character set should represent luminance from light to dark
    const chars = DEFAULT_CHARACTER_SET.split('');
    expect(chars).toHaveLength(10);
    expect(chars[0]).toBe('·'); // Lightest
    expect(chars[chars.length - 1]).toBe('@'); // Darkest
  });
});