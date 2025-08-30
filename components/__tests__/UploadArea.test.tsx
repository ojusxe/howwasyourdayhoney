import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadArea from '../UploadArea';

describe('UploadArea', () => {
  const defaultProps = {
    onFileSelect: jest.fn(),
    isProcessing: false,
    acceptedFormats: ['video/mp4', 'video/webm'],
    maxSize: 25 * 1024 * 1024, // 25MB
    maxDuration: 15
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload area with correct text', () => {
    render(<UploadArea {...defaultProps} />);
    
    expect(screen.getByText('Upload your video')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop or click to select')).toBeInTheDocument();
    expect(screen.getByText('Maximum size: 25MB')).toBeInTheDocument();
    expect(screen.getByText('Maximum duration: 15 seconds')).toBeInTheDocument();
  });

  it('should show processing state', () => {
    render(<UploadArea {...defaultProps} isProcessing={true} />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should handle file selection via input', () => {
    render(<UploadArea {...defaultProps} />);
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file);
  });

  it('should handle drag and drop', () => {
    render(<UploadArea {...defaultProps} />);
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const uploadArea = screen.getByRole('button');
    
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file);
  });

  it('should show drag over state', () => {
    render(<UploadArea {...defaultProps} />);
    
    const uploadArea = screen.getByRole('button');
    
    fireEvent.dragOver(uploadArea);
    expect(uploadArea).toHaveClass('dragover');
    
    fireEvent.dragLeave(uploadArea);
    expect(uploadArea).not.toHaveClass('dragover');
  });

  it('should be disabled when processing', () => {
    render(<UploadArea {...defaultProps} isProcessing={true} />);
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('should accept correct file formats', () => {
    render(<UploadArea {...defaultProps} />);
    
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('video/mp4,video/webm');
  });
});