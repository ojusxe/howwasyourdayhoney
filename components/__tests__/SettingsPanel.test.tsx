import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPanel from '../SettingsPanel';
import { DEFAULT_SETTINGS } from '@/lib/types';

describe('SettingsPanel', () => {
  const defaultProps = {
    settings: DEFAULT_SETTINGS,
    onSettingsChange: jest.fn(),
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all setting sections', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    expect(screen.getByText('Conversion Settings')).toBeInTheDocument();
    expect(screen.getByText('Frame Rate')).toBeInTheDocument();
    expect(screen.getByText('Resolution Scale')).toBeInTheDocument();
    expect(screen.getByText('Character Set')).toBeInTheDocument();
    expect(screen.getByText('Color Mode')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();
  });

  it('should handle frame rate changes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    const fps24Radio = screen.getByDisplayValue('24');
    fireEvent.click(fps24Radio);
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      frameRate: 24
    });
  });

  it('should handle resolution scale changes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    const scale50Radio = screen.getByDisplayValue('0.5');
    fireEvent.click(scale50Radio);
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      resolutionScale: 0.5
    });
  });

  it('should handle character set changes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    const customRadio = screen.getByDisplayValue('custom');
    fireEvent.click(customRadio);
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      characterSet: 'custom'
    });
  });

  it('should show custom character input when custom is selected', () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      characterSet: 'custom' as const
    };
    
    render(<SettingsPanel {...defaultProps} settings={customSettings} />);
    
    const customInput = screen.getByPlaceholderText('Enter custom characters (e.g., .oO@)');
    expect(customInput).toBeInTheDocument();
  });

  it('should handle custom character input', () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      characterSet: 'custom' as const
    };
    
    render(<SettingsPanel {...defaultProps} settings={customSettings} />);
    
    const customInput = screen.getByPlaceholderText('Enter custom characters (e.g., .oO@)');
    fireEvent.change(customInput, { target: { value: '.oO@' } });
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      ...customSettings,
      customCharacters: '.oO@'
    });
  });

  it('should handle color mode changes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    const twoToneRadio = screen.getByDisplayValue('twotone');
    fireEvent.click(twoToneRadio);
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      colorMode: 'twotone'
    });
  });

  it('should show color pickers for two-tone mode', () => {
    const twoToneSettings = {
      ...DEFAULT_SETTINGS,
      colorMode: 'twotone' as const,
      twoToneColors: ['#000000', '#ffffff'] as [string, string]
    };
    
    render(<SettingsPanel {...defaultProps} settings={twoToneSettings} />);
    
    const colorInputs = screen.getAllByDisplayValue('#000000');
    expect(colorInputs.length).toBeGreaterThan(0);
  });

  it('should handle color picker changes', () => {
    const twoToneSettings = {
      ...DEFAULT_SETTINGS,
      colorMode: 'twotone' as const,
      twoToneColors: ['#000000', '#ffffff'] as [string, string]
    };
    
    render(<SettingsPanel {...defaultProps} settings={twoToneSettings} />);
    
    const colorInput = screen.getAllByDisplayValue('#000000')[0];
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      ...twoToneSettings,
      twoToneColors: ['#ff0000', '#ffffff']
    });
  });

  it('should handle background changes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    const blackRadio = screen.getByDisplayValue('black');
    fireEvent.click(blackRadio);
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      background: 'black'
    });
  });

  it('should disable all inputs when disabled prop is true', () => {
    render(<SettingsPanel {...defaultProps} disabled={true} />);
    
    const fps12Radio = screen.getByDisplayValue('12');
    const scale75Radio = screen.getByDisplayValue('0.75');
    const defaultRadio = screen.getByDisplayValue('default');
    
    expect(fps12Radio).toBeDisabled();
    expect(scale75Radio).toBeDisabled();
    expect(defaultRadio).toBeDisabled();
  });
});