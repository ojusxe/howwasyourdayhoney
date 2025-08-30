import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DownloadButton from '../DownloadButton';

// Mock fetch
global.fetch = jest.fn();

describe('DownloadButton', () => {
  const defaultProps = {
    jobId: 'test-job-id',
    disabled: false,
    onDownload: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'blob://test-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock DOM methods
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
          style: {}
        } as any;
      }
      return document.createElement(tagName);
    });
    
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  it('should render download button', () => {
    render(<DownloadButton {...defaultProps} />);
    
    expect(screen.getByText('Download ZIP')).toBeInTheDocument();
    expect(screen.getByText(/ZIP file with usage instructions/)).toBeInTheDocument();
  });

  it('should show disabled state', () => {
    render(<DownloadButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Download Not Ready')).toBeInTheDocument();
  });

  it('should show disabled state when no jobId', () => {
    render(<DownloadButton {...defaultProps} jobId={null} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should handle successful download', async () => {
    // Mock successful HEAD request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: jest.fn((header) => {
          if (header === 'Content-Disposition') {
            return 'attachment; filename="test-frames.zip"';
          }
          return null;
        })
      }
    });

    // Mock successful download request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['test content']))
    });

    render(<DownloadButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show downloading state
    await waitFor(() => {
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });

    // Wait for download to complete
    await waitFor(() => {
      expect(screen.getByText('Download ZIP')).toBeInTheDocument();
    });

    expect(defaultProps.onDownload).toHaveBeenCalled();
  });

  it('should handle download error', async () => {
    // Mock failed HEAD request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false
    });

    render(<DownloadButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Download not available')).toBeInTheDocument();
    });

    expect(defaultProps.onDownload).not.toHaveBeenCalled();
  });

  it('should handle network error', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<DownloadButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should dismiss error message', async () => {
    // Mock error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    render(<DownloadButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('should prevent multiple simultaneous downloads', async () => {
    // Mock slow response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, headers: { get: () => null } }), 100))
    );

    render(<DownloadButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    
    // Click multiple times quickly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only make one request
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should extract filename from Content-Disposition header', async () => {
    const mockFilename = 'ascii-frames-test-123.zip';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: jest.fn(() => `attachment; filename="${mockFilename}"`)
      }
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['test']))
    });

    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {}
    };

    (document.createElement as jest.Mock).mockReturnValue(mockAnchor);

    render(<DownloadButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAnchor.download).toBe(mockFilename);
    });
  });

  it('should use default filename when header is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: jest.fn(() => null)
      }
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['test']))
    });

    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {}
    };

    (document.createElement as jest.Mock).mockReturnValue(mockAnchor);

    render(<DownloadButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAnchor.download).toBe('ascii-frames.zip');
    });
  });
});