/**
 * SettingsPanel component tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPanel from '@/components/SettingsPanel';
import { ConversionSettings, DEFAULT_SETTINGS } from '@/lib/types';

describe('SettingsPanel', () => {
  const mockOnSettingsChange = jest.fn();

  const defaultProps = {
    settings: DEFAULT_SETTINGS,
    onSettingsChange: mockOnSettingsChange,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all setting controls', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    expect(screen.getByLabelText(/frame rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resolution scale/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/character set/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/color mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/background/i)).toBeInTheDocument();
  });

  it('displays current settings values', () => {
    const customSettings: ConversionSettings = {
      frameRate: 24,
      resolutionScale: 1.0,
      characterSet: 'custom',
      customCharacters: '.-+*#',
      colorMode: 'fullcolor',
      background: 'black'
    };

    render(<SettingsPanel {...defaultProps} settings={customSettings} />);
    
    expect(screen.getByDisplayValue('24')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
    expect(screen.getByDisplayValue('.-+*#')).toBeInTheDocument();
    expect(screen.getByDisplayValue('fullcolor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('black')).toBeInTheDocument();
  });

  it('handles frame rate changes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    const frameRateSelect = screen.getByLabelText(/frame rate/i);
    fireEvent.change(frameRateSelect, { target: { value: '24' } });
    
    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      frameRate: 24
    });
  });

  it('handles resolution scale changes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    const resolutionSelect = screen.getByLabelText(/resolution scale/i);
    fireEvent.change(resolutionSelect, { target: { value: '1' } });
    
    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      resolutionScale: 1.0
    });
  });

  it('shows custom character input when custom character set is selected', () => {
    const customSettings: ConversionSettings = {
      ...DEFAULT_SETTINGS,
      characterSet: 'custom'
    };

    render(<SettingsPanel {...defaultProps} settings={customSettings} />);
    
    expect(screen.getByLabelText(/custom characters/i)).toBeInTheDocument();
  });

  it('hides custom character input when default character set is selected', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    expect(screen.queryByLabelText(/custom characters/i)).not.toBeInTheDocument();
  });

  it('handles custom character changes', () => {
    const customSettings: ConversionSettings = {
      ...DEFAULT_SETTINGS,
      characterSet: 'custom'
    };

    render(<SettingsPanel {...defaultProps} settings={customSettings} />);
    
    const customInput = screen.getByLabelText(/custom characters/i);
    fireEvent.change(customInput, { target: { value: '.-+*#@' } });
    
    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...customSettings,
      customCharacters: '.-+*#@'
    });
  });

  it('shows two-tone color inputs when two-tone mode is selected', () => {
    const twoToneSettings: ConversionSettings = {
      ...DEFAULT_SETTINGS,
      colorMode: 'twotone'
    };

    render(<SettingsPanel {...defaultProps} settings={twoToneSettings} />);
    
    expect(screen.getByLabelText(/dark color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/light color/i)).toBeInTheDocument();
  });

  it('hides two-tone color inputs for other color modes', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    expect(screen.queryByLabelText(/dark color/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/light color/i)).not.toBeInTheDocument();
  });

  it('handles two-tone color changes', () => {
    const twoToneSettings: ConversionSettings = {
      ...DEFAULT_SETTINGS,
      colorMode: 'twotone',
      twoToneColors: ['#000000', '#FFFFFF']
    };

    render(<SettingsPanel {...defaultProps} settings={twoToneSettings} />);
    
    const darkColorInput = screen.getByLabelText(/dark color/i);
    fireEvent.change(darkColorInput, { target: { value: '#FF0000' } });
    
    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...twoToneSettings,
      twoToneColors: ['#FF0000', '#FFFFFF']
    });
  });

  it('disables all controls when disabled prop is true', () => {
    render(<SettingsPanel {...defaultProps} disabled={true} />);
    
    expect(screen.getByLabelText(/frame rate/i)).toBeDisabled();
    expect(screen.getByLabelText(/resolution scale/i)).toBeDisabled();
    expect(screen.getByLabelText(/character set/i)).toBeDisabled();
    expect(screen.getByLabelText(/color mode/i)).toBeDisabled();
    expect(screen.getByLabelText(/background/i)).toBeDisabled();
  });

  it('validates custom character input', () => {
    const customSettings: ConversionSettings = {
      ...DEFAULT_SETTINGS,
      characterSet: 'custom'
    };

    render(<SettingsPanel {...defaultProps} settings={customSettings} />);
    
    const customInput = screen.getByLabelText(/custom characters/i);
    
    // Test empty input
    fireEvent.change(customInput, { target: { value: '' } });
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    
    // Test single character
    fireEvent.change(customInput, { target: { value: '.' } });
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    
    // Test valid input
    fireEvent.change(customInput, { target: { value: '.-+' } });
    expect(screen.queryByText(/at least 2 characters/i)).not.toBeInTheDocument();
  });

  it('shows helpful descriptions for each setting', () => {
    render(<SettingsPanel {...defaultProps} />);
    
    expect(screen.getByText(/frames per second/i)).toBeInTheDocument();
    expect(screen.getByText(/output resolution/i)).toBeInTheDocument();
    expect(screen.getByText(/characters used/i)).toBeInTheDocument();
    expect(screen.getByText(/color output/i)).toBeInTheDocument();
    expect(screen.getByText(/background color/i)).toBeInTheDocument();
  });
});