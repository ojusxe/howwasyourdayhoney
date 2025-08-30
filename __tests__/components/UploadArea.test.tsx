/**
 * UploadArea component tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadArea from '@/components/UploadArea';

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

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

  it('renders upload area with correct text', () => {
    render(<UploadArea {...defaultProps} />);
    
    expect(screen.getByText(/drag.*drop.*video/i)).toBeInTheDocument();
    expect(screen.getByText(/browse files/i)).toBeInTheDocument();
  });

  it('shows accepted formats and limits', () => {
    render(<UploadArea {...defaultProps} />);
    
    expect(screen.getByText(/mp4.*webm/i)).toBeInTheDocument();
    expect(screen.getByText(/25mb/i)).toBeInTheDocument();
    expect(screen.getByText(/15.*second/i)).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    render(<UploadArea {...defaultProps} />);
    
    const fileInput = screen.getByLabelText(/choose video file/i);
    const validFile = createMockFile('test.mp4', 10 * 1024 * 1024, 'video/mp4');
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(validFile);
    });
  });

  it('rejects files that are too large', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<UploadArea {...defaultProps} />);
    
    const fileInput = screen.getByLabelText(/choose video file/i);
    const largeFile = createMockFile('large.mp4', 30 * 1024 * 1024, 'video/mp4');
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      expect(defaultProps.onFileSelect).not.toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('rejects unsupported file formats', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<UploadArea {...defaultProps} />);
    
    const fileInput = screen.getByLabelText(/choose video file/i);
    const invalidFile = createMockFile('test.avi', 10 * 1024 * 1024, 'video/avi');
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/unsupported.*format/i)).toBeInTheDocument();
      expect(defaultProps.onFileSelect).not.toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('handles drag and drop', async () => {
    render(<UploadArea {...defaultProps} />);
    
    const dropZone = screen.getByTestId('upload-dropzone');
    const validFile = createMockFile('test.mp4', 10 * 1024 * 1024, 'video/mp4');
    
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('border-blue-400');
    
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [validFile] }
    });
    
    await waitFor(() => {
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(validFile);
    });
  });

  it('shows processing state correctly', () => {
    render(<UploadArea {...defaultProps} isProcessing={true} />);
    
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('prevents multiple file selection', async () => {
    render(<UploadArea {...defaultProps} />);
    
    const fileInput = screen.getByLabelText(/choose video file/i);
    const file1 = createMockFile('test1.mp4', 10 * 1024 * 1024, 'video/mp4');
    const file2 = createMockFile('test2.mp4', 10 * 1024 * 1024, 'video/mp4');
    
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });
    
    await waitFor(() => {
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file1);
      expect(defaultProps.onFileSelect).toHaveBeenCalledTimes(1);
    });
  });

  it('clears error state when valid file is selected', async () => {
    render(<UploadArea {...defaultProps} />);
    
    const fileInput = screen.getByLabelText(/choose video file/i);
    
    // First, select invalid file
    const invalidFile = createMockFile('test.avi', 10 * 1024 * 1024, 'video/avi');
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/unsupported.*format/i)).toBeInTheDocument();
    });
    
    // Then select valid file
    const validFile = createMockFile('test.mp4', 10 * 1024 * 1024, 'video/mp4');
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(screen.queryByText(/unsupported.*format/i)).not.toBeInTheDocument();
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(validFile);
    });
  });
});