import { ZipPackager } from '../zipUtils';
import { ASCIIFrame, ConversionSettings, DEFAULT_SETTINGS } from '../types';

// Mock JSZip
const mockZip = {
  file: jest.fn(),
  folder: jest.fn().mockReturnValue({
    file: jest.fn()
  }),
  generateAsync: jest.fn().mockResolvedValue(new Blob(['test']))
};

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => mockZip);
});

describe('ZipPackager', () => {
  let packager: ZipPackager;
  let testFrames: ASCIIFrame[];
  let testSettings: ConversionSettings;

  beforeEach(() => {
    packager = new ZipPackager();
    
    testFrames = [
      {
        index: 0,
        timestamp: 0,
        asciiContent: '  @@  \n @  @ \n  @@  ',
        width: 6,
        height: 3
      },
      {
        index: 1,
        timestamp: 0.083,
        asciiContent: ' @@@@ \n@    @\n @@@@ ',
        width: 6,
        height: 3
      }
    ];

    testSettings = {
      ...DEFAULT_SETTINGS,
      frameRate: 12,
      colorMode: 'blackwhite'
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createZip', () => {
    it('should create ZIP with frames and README', async () => {
      const result = await packager.createZip(testFrames, testSettings);

      expect(result).toBeInstanceOf(Blob);
      expect(mockZip.file).toHaveBeenCalledWith('README.md', expect.any(String));
      expect(mockZip.file).toHaveBeenCalledWith('LICENSE-ATTRIBUTION.txt', expect.any(String));
      expect(mockZip.file).toHaveBeenCalledWith('metadata.json', expect.any(String));
      expect(mockZip.folder).toHaveBeenCalledWith('frames');
    });

    it('should create ZIP without README when disabled', async () => {
      const options = { includeReadme: false, frameFormat: 'txt' as const };
      
      await packager.createZip(testFrames, testSettings, options);

      expect(mockZip.file).not.toHaveBeenCalledWith('README.md', expect.any(String));
      expect(mockZip.file).toHaveBeenCalledWith('LICENSE-ATTRIBUTION.txt', expect.any(String));
    });

    it('should use custom README content when provided', async () => {
      const customReadme = 'Custom README content';
      const options = { 
        includeReadme: true, 
        readmeContent: customReadme,
        frameFormat: 'txt' as const 
      };
      
      await packager.createZip(testFrames, testSettings, options);

      expect(mockZip.file).toHaveBeenCalledWith('README.md', customReadme);
    });

    it('should handle JSON frame format', async () => {
      const options = { includeReadme: true, frameFormat: 'json' as const };
      const mockFramesFolder = { file: jest.fn() };
      mockZip.folder.mockReturnValue(mockFramesFolder);
      
      await packager.createZip(testFrames, testSettings, options);

      expect(mockFramesFolder.file).toHaveBeenCalledWith(
        'frame_0000.json',
        expect.stringContaining('"index": 0')
      );
      expect(mockFramesFolder.file).toHaveBeenCalledWith(
        'frame_0001.json',
        expect.stringContaining('"index": 1')
      );
    });

    it('should handle frames with color data', async () => {
      const framesWithColor = testFrames.map(frame => ({
        ...frame,
        colorData: [[{ char: '@', color: 'red' }]]
      }));

      const mockFramesFolder = { file: jest.fn() };
      mockZip.folder.mockReturnValue(mockFramesFolder);
      
      await packager.createZip(framesWithColor, testSettings);

      expect(mockFramesFolder.file).toHaveBeenCalledWith(
        'frame_0000_colors.json',
        expect.any(String)
      );
    });
  });

  describe('validateFrames', () => {
    it('should validate correct frames', () => {
      const result = packager.validateFrames(testFrames);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty frame array', () => {
      const result = packager.validateFrames([]);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No frames provided for packaging');
    });

    it('should detect missing frame indices', () => {
      const framesWithGap = [
        { ...testFrames[0], index: 0 },
        { ...testFrames[1], index: 2 } // Missing index 1
      ];
      
      const result = packager.validateFrames(framesWithGap);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing frame at index 1');
    });

    it('should detect empty frame content', () => {
      const framesWithEmpty = [
        testFrames[0],
        { ...testFrames[1], asciiContent: '' }
      ];
      
      const result = packager.validateFrames(framesWithEmpty);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('1 frames have empty content');
    });

    it('should detect inconsistent frame dimensions', () => {
      const framesWithDifferentSize = [
        testFrames[0],
        { ...testFrames[1], width: 10, height: 5 }
      ];
      
      const result = packager.validateFrames(framesWithDifferentSize);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('1 frames have inconsistent dimensions');
    });
  });

  describe('calculateCompressionStats', () => {
    it('should calculate compression statistics', () => {
      const stats = packager.calculateCompressionStats(1000, 500);
      
      expect(stats.ratio).toBe(2);
      expect(stats.savings).toBe(500);
      expect(stats.savingsPercent).toBe(50);
    });

    it('should handle no compression case', () => {
      const stats = packager.calculateCompressionStats(1000, 1000);
      
      expect(stats.ratio).toBe(1);
      expect(stats.savings).toBe(0);
      expect(stats.savingsPercent).toBe(0);
    });
  });
});