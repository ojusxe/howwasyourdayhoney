/**
 * Test Ghostty-inspired ASCII conversion logic
 */

import { ASCIIConverter } from '@/lib/asciiConverter';

describe('Ghostty ASCII Logic', () => {
  let converter: ASCIIConverter;

  beforeEach(() => {
    converter = new ASCIIConverter();
  });

  it('should use Ghostty character set', () => {
    const characterSet = converter.getCharacterSet('default');
    expect(characterSet).toBe('·~ox+=*%$@'); // Ghostty-inspired charset
  });

  it('should convert blue pixels correctly', () => {
    // Create image data with Ghostty blue color
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Fill with Ghostty blue (0, 0, 230)
    for (let i = 0; i < width * height; i++) {
      const baseIndex = i * 4;
      data[baseIndex] = 0;     // R
      data[baseIndex + 1] = 0; // G
      data[baseIndex + 2] = 230; // B (Ghostty blue)
      data[baseIndex + 3] = 255; // A
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: 'srgb' as PredefinedColorSpace
    };

    const options = {
      characterSet: '·~ox+=*%$@',
      colorMode: 'blackwhite' as const,
      background: 'transparent' as const,
      colorThreshold: 50
    };

    const frame = converter.convertFrame(imageData, options);
    
    // Should detect blue and generate appropriate characters
    expect(frame.asciiContent).toBeTruthy();
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.height).toBeGreaterThan(0);
    
    // Should not be all spaces (blue should be detected)
    expect(frame.asciiContent.replace(/\s/g, '').length).toBeGreaterThan(0);
  });

  it('should convert white pixels correctly', () => {
    // Create image data with Ghostty white color
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Fill with Ghostty white (215, 215, 215)
    for (let i = 0; i < width * height; i++) {
      const baseIndex = i * 4;
      data[baseIndex] = 215;     // R
      data[baseIndex + 1] = 215; // G
      data[baseIndex + 2] = 215; // B (Ghostty white)
      data[baseIndex + 3] = 255; // A
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: 'srgb' as PredefinedColorSpace
    };

    const options = {
      characterSet: '·~ox+=*%$@',
      colorMode: 'blackwhite' as const,
      background: 'transparent' as const,
      colorThreshold: 50
    };

    const frame = converter.convertFrame(imageData, options);
    
    // Should detect white and generate appropriate characters
    expect(frame.asciiContent).toBeTruthy();
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.height).toBeGreaterThan(0);
    
    // Should not be all spaces (white should be detected)
    expect(frame.asciiContent.replace(/\s/g, '').length).toBeGreaterThan(0);
  });

  it('should apply font ratio scaling', () => {
    // Create a wide image
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Fill with gray
    for (let i = 0; i < width * height; i++) {
      const baseIndex = i * 4;
      data[baseIndex] = 128;     // R
      data[baseIndex + 1] = 128; // G
      data[baseIndex + 2] = 128; // B
      data[baseIndex + 3] = 255; // A
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: 'srgb' as PredefinedColorSpace
    };

    const options = {
      characterSet: '·~ox+=*%$@',
      colorMode: 'blackwhite' as const,
      background: 'transparent' as const,
      colorThreshold: 50
    };

    const frame = converter.convertFrame(imageData, options);
    
    // Should apply font ratio (0.44) to height
    expect(frame.height).toBeLessThan(frame.width);
    expect(frame.height / frame.width).toBeLessThan(0.5); // Should be around 0.44
  });

  it('should handle two-tone color mode with Ghostty logic', () => {
    const width = 20;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Create mixed blue and white pixels
    for (let i = 0; i < width * height; i++) {
      const baseIndex = i * 4;
      const x = i % width;
      
      if (x < width / 2) {
        // Blue half
        data[baseIndex] = 0;     // R
        data[baseIndex + 1] = 0; // G
        data[baseIndex + 2] = 230; // B (Ghostty blue)
      } else {
        // White half
        data[baseIndex] = 215;     // R
        data[baseIndex + 1] = 215; // G
        data[baseIndex + 2] = 215; // B (Ghostty white)
      }
      data[baseIndex + 3] = 255; // A
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: 'srgb' as PredefinedColorSpace
    };

    const options = {
      characterSet: '·~ox+=*%$@',
      colorMode: 'twotone' as const,
      twoToneColors: ['#0000E6', '#D7D7D7'] as [string, string],
      background: 'transparent' as const,
      colorThreshold: 50
    };

    const frame = converter.convertFrame(imageData, options);
    
    // Should have color data for two-tone mode
    expect(frame.colorData).toBeDefined();
    expect(frame.colorData!.length).toBeGreaterThan(0);
    
    // Should contain both colors
    const colors = frame.colorData!.flat().map(pixel => pixel?.color).filter(Boolean);
    expect(colors.length).toBeGreaterThan(0);
  });

  it('should validate character sets properly', () => {
    const validation1 = converter.validateCharacterSet('·~ox+=*%$@');
    expect(validation1.valid).toBe(true);

    const validation2 = converter.validateCharacterSet('');
    expect(validation2.valid).toBe(false);
    expect(validation2.error).toContain('empty');

    const validation3 = converter.validateCharacterSet('a');
    expect(validation3.valid).toBe(false);
    expect(validation3.error).toContain('at least 2');

    const validation4 = converter.validateCharacterSet('aa');
    expect(validation4.valid).toBe(false);
    expect(validation4.error).toContain('duplicate');
  });
});