import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MediaUploader from '../components/MediaUploader';
import mediaService from '../services/mediaService';

// Mock the media service
jest.mock('../services/mediaService', () => ({
  uploadMedia: jest.fn(),
  uploadMediaBatch: jest.fn(),
  validateFile: jest.fn(),
  generatePreview: jest.fn(),
}));

describe('MediaUploader Component', () => {
  const mockConversationId = 'test-conversation-id';
  const mockOnMediaUploaded = jest.fn();
  const mockOnMediaSelected = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mediaService.validateFile.mockImplementation((file) => ({
      valid: true,
      mediaType: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'document'
    }));
    
    mediaService.generatePreview.mockImplementation((file) => 
      Promise.resolve(file.type.startsWith('image/') ? 'mock-image-url' : 
                     file.type.startsWith('video/') ? 'mock-video-url' : 'mock-document-url')
    );
    
    mediaService.uploadMedia.mockImplementation((file) => 
      Promise.resolve({
        id: 'mock-media-id',
        mediaType: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 'document',
        filename: file.name,
        url: `/api/media/mock-media-id`
      })
    );
    
    mediaService.uploadMediaBatch.mockImplementation((files) => 
      Promise.resolve(files.map((file, index) => ({
        id: `mock-media-id-${index}`,
        mediaType: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 'document',
        filename: file.name,
        url: `/api/media/mock-media-id-${index}`
      })))
    );
  });
  
  test('renders the component correctly', () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
      />
    );
    
    // Check if the upload button is rendered
    expect(screen.getByText(/Upload Media/i)).toBeInTheDocument();
    
    // Check if the file input is hidden but present
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).not.toBeVisible();
  });
  
  test('allows single file selection', async () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
      />
    );
    
    // Create a mock file
    const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Check if the file preview is shown
    await waitFor(() => {
      expect(screen.getByText(/test-image.jpg/i)).toBeInTheDocument();
    });
    
    // Check if the onMediaSelected callback was called
    expect(mockOnMediaSelected).toHaveBeenCalledWith([{
      file,
      preview: 'mock-image-url',
      mediaType: 'image',
      caption: '',
      progress: 0
    }]);
  });
  
  test('allows multiple file selection when allowMultiple is true', async () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
        allowMultiple={true}
      />
    );
    
    // Create mock files
    const files = [
      new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' }),
      new File(['test video content'], 'test-video.mp4', { type: 'video/mp4' })
    ];
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files } });
    });
    
    // Check if both file previews are shown
    await waitFor(() => {
      expect(screen.getByText(/test-image.jpg/i)).toBeInTheDocument();
      expect(screen.getByText(/test-video.mp4/i)).toBeInTheDocument();
    });
    
    // Check if the onMediaSelected callback was called with both files
    expect(mockOnMediaSelected).toHaveBeenCalledWith([
      {
        file: files[0],
        preview: 'mock-image-url',
        mediaType: 'image',
        caption: '',
        progress: 0
      },
      {
        file: files[1],
        preview: 'mock-video-url',
        mediaType: 'video',
        caption: '',
        progress: 0
      }
    ]);
  });
  
  test('uploads a single file when upload button is clicked', async () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
      />
    );
    
    // Create a mock file
    const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Click the upload button
    await act(async () => {
      fireEvent.click(screen.getByText(/Upload/i));
    });
    
    // Check if the upload function was called with the correct parameters
    expect(mediaService.uploadMedia).toHaveBeenCalledWith(
      file,
      mockConversationId,
      expect.any(Function) // Progress callback
    );
    
    // Check if the onMediaUploaded callback was called
    await waitFor(() => {
      expect(mockOnMediaUploaded).toHaveBeenCalledWith([{
        id: 'mock-media-id',
        mediaType: 'image',
        filename: 'test-image.jpg',
        url: '/api/media/mock-media-id'
      }]);
    });
  });
  
  test('uploads multiple files when upload button is clicked', async () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
        allowMultiple={true}
      />
    );
    
    // Create mock files
    const files = [
      new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' }),
      new File(['test video content'], 'test-video.mp4', { type: 'video/mp4' })
    ];
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files } });
    });
    
    // Click the upload button
    await act(async () => {
      fireEvent.click(screen.getByText(/Upload/i));
    });
    
    // Check if the batch upload function was called with the correct parameters
    expect(mediaService.uploadMediaBatch).toHaveBeenCalledWith(
      files,
      mockConversationId,
      expect.any(Function), // Overall progress callback
      expect.any(Function), // File progress callback
      expect.any(Function)  // File complete callback
    );
    
    // Check if the onMediaUploaded callback was called with both media items
    await waitFor(() => {
      expect(mockOnMediaUploaded).toHaveBeenCalledWith([
        {
          id: 'mock-media-id-0',
          mediaType: 'image',
          filename: 'test-image.jpg',
          url: '/api/media/mock-media-id-0'
        },
        {
          id: 'mock-media-id-1',
          mediaType: 'video',
          filename: 'test-video.mp4',
          url: '/api/media/mock-media-id-1'
        }
      ]);
    });
  });
  
  test('validates files before upload', async () => {
    // Mock validation to fail for the second file
    mediaService.validateFile.mockImplementation((file) => {
      if (file.name === 'invalid.xyz') {
        return {
          valid: false,
          error: 'Unsupported file type'
        };
      }
      return {
        valid: true,
        mediaType: 'image'
      };
    });
    
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
        allowMultiple={true}
      />
    );
    
    // Create mock files - one valid, one invalid
    const files = [
      new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' }),
      new File(['invalid content'], 'invalid.xyz', { type: 'application/octet-stream' })
    ];
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files } });
    });
    
    // Should show error message for invalid file
    await waitFor(() => {
      expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
    });
    
    // Only the valid file should be in the selected files
    expect(mockOnMediaSelected).toHaveBeenCalledWith([
      expect.objectContaining({
        file: files[0],
        mediaType: 'image'
      })
    ]);
  });
  
  test('allows adding captions to files', async () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
      />
    );
    
    // Create a mock file
    const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Wait for the file to be processed
    await waitFor(() => {
      expect(screen.getByText(/test-image.jpg/i)).toBeInTheDocument();
    });
    
    // Find the caption input and add a caption
    const captionInput = screen.getByPlaceholderText(/Add a caption/i);
    await act(async () => {
      fireEvent.change(captionInput, { target: { value: 'Test caption' } });
    });
    
    // Verify the caption was added to the file
    expect(mockOnMediaSelected).toHaveBeenCalledWith([
      expect.objectContaining({
        file,
        caption: 'Test caption'
      })
    ]);
  });
  
  test('allows removing files before upload', async () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
        allowMultiple={true}
      />
    );
    
    // Create mock files
    const files = [
      new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' }),
      new File(['test video content'], 'test-video.mp4', { type: 'video/mp4' })
    ];
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files } });
    });
    
    // Wait for the files to be processed
    await waitFor(() => {
      expect(screen.getByText(/test-image.jpg/i)).toBeInTheDocument();
      expect(screen.getByText(/test-video.mp4/i)).toBeInTheDocument();
    });
    
    // Find the remove button for the first file and click it
    const removeButtons = screen.getAllByLabelText(/Remove file/i);
    await act(async () => {
      fireEvent.click(removeButtons[0]);
    });
    
    // Verify the first file was removed
    await waitFor(() => {
      expect(screen.queryByText(/test-image.jpg/i)).not.toBeInTheDocument();
      expect(screen.getByText(/test-video.mp4/i)).toBeInTheDocument();
    });
    
    // Verify onMediaSelected was called with only the second file
    expect(mockOnMediaSelected).toHaveBeenCalledWith([
      expect.objectContaining({
        file: files[1],
        mediaType: 'video'
      })
    ]);
  });
  
  test('shows progress during upload', async () => {
    // Mock uploadMedia to call the progress callback
    mediaService.uploadMedia.mockImplementation((file, conversationId, onProgress) => {
      // Simulate progress updates
      onProgress(25);
      onProgress(50);
      onProgress(75);
      onProgress(100);
      
      return Promise.resolve({
        id: 'mock-media-id',
        mediaType: 'image',
        filename: file.name,
        url: '/api/media/mock-media-id'
      });
    });
    
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
      />
    );
    
    // Create a mock file
    const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Click the upload button
    await act(async () => {
      fireEvent.click(screen.getByText(/Upload/i));
    });
    
    // Check that progress is displayed
    await waitFor(() => {
      // The progress should reach 100%
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });
  });
  
  test('disables the component when disabled prop is true', () => {
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
        disabled={true}
      />
    );
    
    // The upload button should be disabled
    expect(screen.getByText(/Upload Media/i).closest('button')).toBeDisabled();
  });
  
  test('handles upload errors gracefully', async () => {
    // Mock uploadMedia to throw an error
    mediaService.uploadMedia.mockImplementation(() => {
      return Promise.reject(new Error('Upload failed'));
    });
    
    render(
      <MediaUploader 
        conversationId={mockConversationId}
        onMediaUploaded={mockOnMediaUploaded}
        onMediaSelected={mockOnMediaSelected}
      />
    );
    
    // Create a mock file
    const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Get the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Click the upload button
    await act(async () => {
      fireEvent.click(screen.getByText(/Upload/i));
    });
    
    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
    });
    
    // The onMediaUploaded callback should not have been called
    expect(mockOnMediaUploaded).not.toHaveBeenCalled();
  });
});
