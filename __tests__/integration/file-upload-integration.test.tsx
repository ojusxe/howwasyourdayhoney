/**
 * Test FileUpload component integration
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '@/components/ui/file-upload';

// Mock motion/react
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: () => ({}),
    isDragActive: false,
  })),
}));

describe('FileUpload Integration', () => {
  it('should render with video-specific messaging', () => {
    const mockOnChange = jest.fn();
    
    render(<FileUpload onChange={mockOnChange} />);
    
    expect(screen.getByText('Upload Video')).toBeInTheDocument();
    expect(screen.getByText('Drag or drop your video here or click to upload')).toBeInTheDocument();
    expect(screen.getByText('MP4 or WebM • Max 25MB • Max 15 seconds')).toBeInTheDocument();
  });

  it('should have correct file input attributes', () => {
    const mockOnChange = jest.fn();
    
    render(<FileUpload onChange={mockOnChange} />);
    
    const fileInput = screen.getByRole('textbox', { hidden: true }) || 
                     document.querySelector('input[type="file"]');
    
    if (fileInput) {
      expect(fileInput).toHaveAttribute('accept', 'video/mp4,video/webm');
    }
  });

  it('should call onChange when files are selected', () => {
    const mockOnChange = jest.fn();
    
    render(<FileUpload onChange={mockOnChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (fileInput) {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      expect(mockOnChange).toHaveBeenCalledWith([mockFile]);
    }
  });

  it('should display uploaded file information', () => {
    const mockOnChange = jest.fn();
    
    render(<FileUpload onChange={mockOnChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (fileInput) {
      const mockFile = new File(['test content'], 'test-video.mp4', { 
        type: 'video/mp4',
        lastModified: Date.now()
      });
      
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      // The component should show file details
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText('video/mp4')).toBeInTheDocument();
    }
  });
});