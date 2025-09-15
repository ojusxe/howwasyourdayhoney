/**
 * Client-side processing tests for "How Was Your Day Honey?"
 */

import { convertFrameToAscii } from '@/lib/clientAsciiConverter';
import { OPTIMIZED_CHARACTER_SET } from '@/lib/types';

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
        width: 120,
        characterSet: OPTIMIZED_CHARACTER_SET
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
      // Should use optimized character set
      expect(result).toMatch(/[ .'`^",:;Il!i><~+_\-?\]\[}{1)(|\\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$\s\n]/);
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
  it('should use the optimized character set', () => {
    expect(OPTIMIZED_CHARACTER_SET).toBe(' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$');
  });

  it('should have characters ordered from light to dark', () => {
    // The character set should represent luminance from light to dark
    const chars = OPTIMIZED_CHARACTER_SET.split('');
    expect(chars.length).toBeGreaterThan(50); // Should have 70+ characters
    expect(chars[0]).toBe(' '); // Lightest (space)
    expect(chars[chars.length - 1]).toBe('$'); // Darkest
  });

  it('should work with custom character sets', async () => {
    const customCharSet = '.:-=+*#%@';
    
    const mockImageBitmap = {
      width: 10,
      height: 10,
      close: jest.fn()
    };

    const mockContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(10 * 10 * 4).fill(128), // Mid-gray pixels
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
    
    const result = await convertFrameToAscii(mockBlob, {
      characterSet: customCharSet,
      width: 10
    });

    expect(result).toBeDefined();
    // Should only contain characters from the custom set
    const resultChars = new Set(result.replace(/\n/g, ''));
    const customChars = new Set(customCharSet);
    
    for (const char of resultChars) {
      expect(customChars.has(char)).toBe(true);
    }
  });
});