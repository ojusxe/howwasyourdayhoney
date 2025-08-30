/**
 * ProgressBar component tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from '@/components/ProgressBar';

describe('ProgressBar', () => {
  const defaultProps = {
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    status: 'idle' as const,
    message: undefined
  };

  it('renders nothing when status is idle', () => {
    const { container } = render(<ProgressBar {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows progress bar when processing', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={50} 
      currentFrame={25} 
      totalFrames={50} 
    />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('25 / 50 frames')).toBeInTheDocument();
  });

  it('shows correct progress percentage', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={75} 
    />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows completion state', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="complete" 
      progress={100} 
      currentFrame={50} 
      totalFrames={50} 
    />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Complete!')).toBeInTheDocument();
    expect(screen.getByText('50 / 50 frames')).toBeInTheDocument();
  });

  it('shows error state with message', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="error" 
      message="Processing failed" 
    />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Processing failed')).toBeInTheDocument();
  });

  it('shows error state without message', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="error" 
    />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('An error occurred during processing')).toBeInTheDocument();
  });

  it('applies correct CSS classes for different states', () => {
    const { rerender } = render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={50} 
    />);
    
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar.querySelector('.bg-blue-500')).toBeInTheDocument();
    
    rerender(<ProgressBar 
      {...defaultProps} 
      status="complete" 
      progress={100} 
    />);
    
    progressBar = screen.getByRole('progressbar');
    expect(progressBar.querySelector('.bg-green-500')).toBeInTheDocument();
    
    rerender(<ProgressBar 
      {...defaultProps} 
      status="error" 
    />);
    
    expect(screen.getByText('Error').closest('div')).toHaveClass('bg-red-50');
  });

  it('handles zero total frames gracefully', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={25} 
      currentFrame={0} 
      totalFrames={0} 
    />);
    
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('0 / 0 frames')).toBeInTheDocument();
  });

  it('shows processing animation', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={30} 
    />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows indeterminate progress when progress is 0 but status is processing', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={0} 
    />);
    
    expect(screen.getByText('Starting...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('formats frame count correctly', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={50} 
      currentFrame={123} 
      totalFrames={456} 
    />);
    
    expect(screen.getByText('123 / 456 frames')).toBeInTheDocument();
  });

  it('shows estimated time remaining when available', () => {
    render(<ProgressBar 
      {...defaultProps} 
      status="processing" 
      progress={25} 
      message="Estimated time: 2 minutes" 
    />);
    
    expect(screen.getByText('Estimated time: 2 minutes')).toBeInTheDocument();
  });
});