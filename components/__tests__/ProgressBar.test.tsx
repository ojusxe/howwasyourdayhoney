import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  const defaultProps = {
    progress: 50,
    currentFrame: 5,
    totalFrames: 10,
    status: 'processing' as const,
    message: undefined
  };

  it('should not render when status is idle', () => {
    const { container } = render(
      <ProgressBar {...defaultProps} status="idle" />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render processing status correctly', () => {
    render(<ProgressBar {...defaultProps} />);
    
    expect(screen.getByText('Processing Status')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Processing frame 5 of 10')).toBeInTheDocument();
    expect(screen.getByText('5/10 frames')).toBeInTheDocument();
  });

  it('should show custom message when provided', () => {
    render(
      <ProgressBar {...defaultProps} message="Converting frames to ASCII..." />
    );
    
    expect(screen.getByText('Converting frames to ASCII...')).toBeInTheDocument();
  });

  it('should render complete status', () => {
    render(
      <ProgressBar 
        {...defaultProps} 
        status="complete" 
        progress={100}
        currentFrame={10}
      />
    );
    
    expect(screen.getByText('Processing complete!')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/Successfully converted 10 frames/)).toBeInTheDocument();
  });

  it('should render error status', () => {
    render(
      <ProgressBar 
        {...defaultProps} 
        status="error" 
        message="Processing failed due to invalid format"
      />
    );
    
    expect(screen.getByText('Processing failed')).toBeInTheDocument();
    expect(screen.getByText('Processing failed due to invalid format')).toBeInTheDocument();
  });

  it('should show processing steps', () => {
    render(<ProgressBar {...defaultProps} progress={25} />);
    
    expect(screen.getByText('Video uploaded and validated')).toBeInTheDocument();
    expect(screen.getByText('Extracting frames from video')).toBeInTheDocument();
    expect(screen.getByText('Converting frames to ASCII')).toBeInTheDocument();
    expect(screen.getByText('Packaging frames for download')).toBeInTheDocument();
  });

  it('should update progress bar width', () => {
    const { rerender } = render(<ProgressBar {...defaultProps} progress={25} />);
    
    let progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toHaveStyle('width: 25%');
    
    rerender(<ProgressBar {...defaultProps} progress={75} />);
    
    progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toHaveStyle('width: 75%');
  });

  it('should show spinning icon for processing status', () => {
    render(<ProgressBar {...defaultProps} />);
    
    const spinningIcon = document.querySelector('.animate-spin');
    expect(spinningIcon).toBeInTheDocument();
  });

  it('should show checkmark icon for complete status', () => {
    render(
      <ProgressBar {...defaultProps} status="complete" progress={100} />
    );
    
    // Check for checkmark path
    const checkmark = screen.getByText('100%').parentElement?.querySelector('svg path[d*="M5 13l4 4L19 7"]');
    expect(checkmark).toBeInTheDocument();
  });

  it('should show error icon for error status', () => {
    render(
      <ProgressBar {...defaultProps} status="error" />
    );
    
    // Check for X mark path
    const errorIcon = screen.getByText('50%').parentElement?.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]');
    expect(errorIcon).toBeInTheDocument();
  });

  it('should handle zero total frames', () => {
    render(
      <ProgressBar {...defaultProps} totalFrames={0} currentFrame={0} />
    );
    
    expect(screen.queryByText('/0 frames')).not.toBeInTheDocument();
  });
});