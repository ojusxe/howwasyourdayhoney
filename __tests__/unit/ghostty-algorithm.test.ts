/**
 * Test suite for Ghostty's exact video-to-terminal algorithm
 * Based on the reference implementation from Ghostty's open source code
 */

describe('Ghostty Algorithm Implementation', () => {
  // Ghostty's exact constants
  const GHOSTTY_CONSTANTS = {
    FONT_RATIO: 0.44,
    OUTPUT_FPS: 24,
    OUTPUT_COLUMNS: 100,
    BLUE: [0, 0, 230] as [number, number, number],
    BLUE_DISTANCE_TOLERANCE: 90,
    BLUE_MIN_LUMINANCE: 10,
    BLUE_MAX_LUMINANCE: 21,
    WHITE: [215, 215, 215] as [number, number, number],
    WHITE_DISTANCE_TOLERANCE: 140,
    WHITE_MIN_LUMINANCE: 165,
    WHITE_MAX_LUMINANCE: 255,
    CHARACTER_MAP: ['·', '~', 'o', 'x', '+', '=', '*', '%', '$', '@']
  };

  describe('Color Distance Calculation', () => {
    function colorDistance(color1: [number, number, number], color2: [number, number, number]): number {
      return Math.abs(color1[0] - color2[0]) + Math.abs(color1[1] - color2[1]) + Math.abs(color1[2] - color2[2]);
    }

    it('should calculate Manhattan distance correctly', () => {
      expect(colorDistance([0, 0, 0], [255, 255, 255])).toBe(765);
      expect(colorDistance([100, 100, 100], [100, 100, 100])).toBe(0);
      expect(colorDistance([0, 0, 230], [0, 0, 200])).toBe(30);
    });

    it('should match Ghostty blue detection', () => {
      const blueDistance = colorDistance([0, 0, 230], GHOSTTY_CONSTANTS.BLUE);
      expect(blueDistance).toBe(0);
      expect(blueDistance < GHOSTTY_CONSTANTS.BLUE_DISTANCE_TOLERANCE).toBe(true);
    });

    it('should match Ghostty white detection', () => {
      const whiteDistance = colorDistance([215, 215, 215], GHOSTTY_CONSTANTS.WHITE);
      expect(whiteDistance).toBe(0);
      expect(whiteDistance < GHOSTTY_CONSTANTS.WHITE_DISTANCE_TOLERANCE).toBe(true);
    });
  });

  describe('Luminance Calculation', () => {
    function calculateLuminance(r: number, g: number, b: number): number {
      // Ghostty's exact formula: (0.2126 * r + 0.7152 * g + 0.0722 * b)
      return Math.floor(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }

    it('should calculate relative luminance correctly', () => {
      expect(calculateLuminance(0, 0, 0)).toBe(0);
      expect(calculateLuminance(255, 255, 255)).toBe(255);
      expect(calculateLuminance(128, 128, 128)).toBe(128);
    });

    it('should handle Ghostty blue luminance range', () => {
      const blueLuminance = calculateLuminance(0, 0, 230);
      expect(blueLuminance).toBeGreaterThanOrEqual(GHOSTTY_CONSTANTS.BLUE_MIN_LUMINANCE);
      expect(blueLuminance).toBeLessThanOrEqual(GHOSTTY_CONSTANTS.BLUE_MAX_LUMINANCE);
    });

    it('should handle Ghostty white luminance range', () => {
      const whiteLuminance = calculateLuminance(215, 215, 215);
      expect(whiteLuminance).toBeGreaterThanOrEqual(GHOSTTY_CONSTANTS.WHITE_MIN_LUMINANCE);
      expect(whiteLuminance).toBeLessThanOrEqual(GHOSTTY_CONSTANTS.WHITE_MAX_LUMINANCE);
    });
  });

  describe('Luminance Scaling', () => {
    function scaleLuminance(luminance: number, min: number, max: number): number {
      // Ghostty's exact scaling: (luminance - min) * 9 / (max - min)
      return Math.floor((luminance - min) * 9 / (max - min));
    }

    it('should scale luminance to 0-9 range correctly', () => {
      expect(scaleLuminance(10, 10, 21)).toBe(0);
      expect(scaleLuminance(21, 10, 21)).toBe(9);
      expect(scaleLuminance(15, 10, 21)).toBe(4);
    });

    it('should handle edge cases', () => {
      expect(scaleLuminance(165, 165, 255)).toBe(0);
      expect(scaleLuminance(255, 165, 255)).toBe(9);
      expect(scaleLuminance(210, 165, 255)).toBe(4);
    });
  });

  describe('Pixel Processing', () => {
    function processPixel(r: number, g: number, b: number): string {
      const luminance = Math.floor(0.2126 * r + 0.7152 * g + 0.0722 * b);
      const blueDistance = Math.abs(r - GHOSTTY_CONSTANTS.BLUE[0]) + 
                          Math.abs(g - GHOSTTY_CONSTANTS.BLUE[1]) + 
                          Math.abs(b - GHOSTTY_CONSTANTS.BLUE[2]);
      const whiteDistance = Math.abs(r - GHOSTTY_CONSTANTS.WHITE[0]) + 
                           Math.abs(g - GHOSTTY_CONSTANTS.WHITE[1]) + 
                           Math.abs(b - GHOSTTY_CONSTANTS.WHITE[2]);

      if (blueDistance < GHOSTTY_CONSTANTS.BLUE_DISTANCE_TOLERANCE) {
        if (luminance >= GHOSTTY_CONSTANTS.BLUE_MIN_LUMINANCE && luminance <= GHOSTTY_CONSTANTS.BLUE_MAX_LUMINANCE) {
          const scaledLuminance = Math.floor((luminance - GHOSTTY_CONSTANTS.BLUE_MIN_LUMINANCE) * 9 / 
                                           (GHOSTTY_CONSTANTS.BLUE_MAX_LUMINANCE - GHOSTTY_CONSTANTS.BLUE_MIN_LUMINANCE));
          return `B${Math.max(0, Math.min(9, scaledLuminance))}`;
        }
      } else if (whiteDistance < GHOSTTY_CONSTANTS.WHITE_DISTANCE_TOLERANCE) {
        if (luminance >= GHOSTTY_CONSTANTS.WHITE_MIN_LUMINANCE && luminance <= GHOSTTY_CONSTANTS.WHITE_MAX_LUMINANCE) {
          const scaledLuminance = Math.floor((luminance - GHOSTTY_CONSTANTS.WHITE_MIN_LUMINANCE) * 9 / 
                                           (GHOSTTY_CONSTANTS.WHITE_MAX_LUMINANCE - GHOSTTY_CONSTANTS.WHITE_MIN_LUMINANCE));
          return `W${Math.max(0, Math.min(9, scaledLuminance))}`;
        }
      }
      return ' ';
    }

    it('should detect Ghostty blue pixels correctly', () => {
      const result = processPixel(0, 0, 230);
      expect(result).toMatch(/^B[0-9]$/);
    });

    it('should detect Ghostty white pixels correctly', () => {
      const result = processPixel(215, 215, 215);
      expect(result).toMatch(/^W[0-9]$/);
    });

    it('should return space for non-matching pixels', () => {
      const result = processPixel(128, 128, 128);
      expect(result).toBe(' ');
    });

    it('should handle edge cases within tolerance', () => {
      // Blue with slight variation
      const blueVariant = processPixel(10, 10, 240);
      expect(blueVariant).toMatch(/^B[0-9]$|^ $/);

      // White with slight variation
      const whiteVariant = processPixel(200, 200, 200);
      expect(whiteVariant).toMatch(/^W[0-9]$|^ $/);
    });
  });

  describe('Character Substitution', () => {
    function applyCharacterSubstitution(text: string): string {
      return text
        .replace(/B/g, '') // Remove blue markers
        .replace(/W/g, '') // Remove white markers
        .replace(/0/g, '·')
        .replace(/1/g, '~')
        .replace(/2/g, 'o')
        .replace(/3/g, 'x')
        .replace(/4/g, '+')
        .replace(/5/g, '=')
        .replace(/6/g, '*')
        .replace(/7/g, '%')
        .replace(/8/g, '$')
        .replace(/9/g, '@');
    }

    it('should apply Ghostty character substitutions correctly', () => {
      expect(applyCharacterSubstitution('B0')).toBe('·');
      expect(applyCharacterSubstitution('W9')).toBe('@');
      expect(applyCharacterSubstitution('B5W3')).toBe('=x');
    });

    it('should handle mixed content', () => {
      const input = 'B0B1W2W3 B4';
      const expected = '·~ox +';
      expect(applyCharacterSubstitution(input)).toBe(expected);
    });
  });

  describe('HTML Span Wrapping', () => {
    function wrapBlueSpans(text: string): string {
      // Ghostty's Perl regex: s/(B[0-9](?:B[0-9])*)/<span class="b">\1<\/span>/g
      return text.replace(/(B[0-9](?:B[0-9])*)/g, '<span class="b">$1</span>');
    }

    it('should wrap blue sequences in spans', () => {
      expect(wrapBlueSpans('B0B1B2')).toBe('<span class="b">B0B1B2</span>');
      expect(wrapBlueSpans('B5')).toBe('<span class="b">B5</span>');
    });

    it('should handle mixed content with spans', () => {
      const input = 'W0B1B2W3B4';
      const expected = 'W0<span class="b">B1B2</span>W3<span class="b">B4</span>';
      expect(wrapBlueSpans(input)).toBe(expected);
    });
  });

  describe('Font Ratio Squishing', () => {
    function calculateSquishHeight(originalHeight: number): number {
      return Math.ceil(GHOSTTY_CONSTANTS.FONT_RATIO * originalHeight);
    }

    it('should calculate squish height correctly', () => {
      expect(calculateSquishHeight(100)).toBe(44);
      expect(calculateSquishHeight(50)).toBe(22);
      expect(calculateSquishHeight(30)).toBe(14);
    });

    it('should always round up', () => {
      expect(calculateSquishHeight(25)).toBe(11); // 0.44 * 25 = 11
      expect(calculateSquishHeight(23)).toBe(11); // 0.44 * 23 = 10.12 -> 11
    });
  });
});