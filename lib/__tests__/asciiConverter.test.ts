import { ASCIIConverter } from '../asciiConverter';
import { ASCIIConversionOptions, DEFAULT_CHARACTER_SET } from '../types';

describe('ASCIIConverter', () => {
  let converter: ASCIIConverter;

  beforeEach(() => {
    converter = new ASCIIConverter();
  });

  describe('convertFrame', () => {
    it('should convert image data to ASCII frame', () => {
      // Create test image data (2x2 pixels)
      const imageData = new ImageData(2, 2);
      
      // Set pixel values: black, white, gray, red
      imageData.data.set([
        0, 0, 0, 255,       // Black pixel
        255, 255, 255, 255, // White pixel
        128, 128, 128, 255, // Gray pixel
        255, 0, 0, 255      // Red pixel
      ]);

      const options: ASCIIConversionOptions = {
        characterSet: DEFAULT_CHARACTER_SET,
        colorMode: 'blackwhite',
        background: 'transparent',
        colorThreshold: 50
      };

      const result = converter.convertFrame(imageData, options);

      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(result.asciiContent).toContain('\n'); // Should have newline for second row
      expect(result.asciiContent.length).toBeGreaterThan(2); // Should have characters + newline
    });

    it('should handle transparent pixels correctly', () => {
      const imageData = new ImageData(2, 1);
      
      // Set one transparent and one opaque pixel
      imageData.data.set([
        0, 0, 0, 0,         // Transparent pixel
        255, 255, 255, 255  // White pixel
      ]);

      const options: ASCIIConversionOptions = {
        characterSet: DEFAULT_CHARACTER_SET,
        colorMode: 'blackwhite',
        background: 'transparent',
        colorThreshold: 50
      };

      const result = converter.convertFrame(imageData, options);
      
      expect(result.asciiContent[0]).toBe(' '); // First character should be space for transparent
    });

    it('should apply two-tone color mode', () => {
      const imageData = new ImageData(2, 1);
      
      imageData.data.set([
        0, 0, 0, 255,       // Black pixel
        255, 255, 255, 255  // White pixel
      ]);

      const options: ASCIIConversionOptions = {
        characterSet: DEFAULT_CHARACTER_SET,
        colorMode: 'twotone',
        twoToneColors: ['#000000', '#ffffff'],
        background: 'transparent',
        colorThreshold: 50
      };

      const result = converter.convertFrame(imageData, options);
      
      expect(result.colorData).toBeDefined();
      expect(result.colorData![0]).toHaveLength(2);
    });

    it('should apply full color mode', () => {
      const imageData = new ImageData(1, 1);
      
      imageData.data.set([255, 0, 0, 255]); // Red pixel

      const options: ASCIIConversionOptions = {
        characterSet: DEFAULT_CHARACTER_SET,
        colorMode: 'fullcolor',
        background: 'black',
        colorThreshold: 50
      };

      const result = converter.convertFrame(imageData, options);
      
      expect(result.colorData).toBeDefined();
      expect(result.colorData![0][0].color).toContain('rgb');
    });
  });

  describe('validateCharacterSet', () => {
    it('should accept valid character sets', () => {
      const result = converter.validateCharacterSet(' .:-=+*#%@');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty character sets', () => {
      const result = converter.validateCharacterSet('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject character sets that are too short', () => {
      const result = converter.validateCharacterSet('a');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 2 characters');
    });

    it('should reject character sets that are too long', () => {
      const longCharset = 'a'.repeat(51);
      const result = converter.validateCharacterSet(longCharset);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot exceed 50 characters');
    });

    it('should reject character sets with duplicates', () => {
      const result = converter.validateCharacterSet('aab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('duplicate characters');
    });
  });

  describe('getCharacterSet', () => {
    it('should return default character set for default option', () => {
      const result = converter.getCharacterSet('default');
      expect(result).toBe(DEFAULT_CHARACTER_SET);
    });

    it('should return custom character set when valid', () => {
      const customSet = ' .-+*#@';
      const result = converter.getCharacterSet('custom', customSet);
      expect(result).toBe(customSet);
    });

    it('should fallback to default when custom set is invalid', () => {
      const invalidSet = 'a'; // Too short
      const result = converter.getCharacterSet('custom', invalidSet);
      expect(result).toBe(DEFAULT_CHARACTER_SET);
    });
  });

  describe('createImageDataFromPNG', () => {
    it('should create image data from PNG buffer', async () => {
      // Mock canvas and image
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue({
          drawImage: jest.fn(),
          getImageData: jest.fn().mockReturnValue(new ImageData(10, 10))
        })
      };

      const mockImage = {
        width: 10,
        height: 10,
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

      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      global.Image = jest.fn().mockImplementation(() => mockImage);
      global.Blob = jest.fn().mockImplementation(() => ({}));
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob://test');
      global.URL.revokeObjectURL = jest.fn();

      const pngBuffer = new Uint8Array([1, 2, 3, 4]);
      const result = await converter.createImageDataFromPNG(pngBuffer);

      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(10);
      expect(result.height).toBe(10);
    });

    it('should handle image load errors', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        set src(value: string) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      };

      global.Image = jest.fn().mockImplementation(() => mockImage);
      global.Blob = jest.fn().mockImplementation(() => ({}));
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob://test');
      global.URL.revokeObjectURL = jest.fn();

      const pngBuffer = new Uint8Array([1, 2, 3, 4]);
      
      await expect(converter.createImageDataFromPNG(pngBuffer)).rejects.toThrow('Failed to load image');
    });
  });
});