import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import mediaService from '../services/mediaService';

// Mock axios
const mockAxios = new MockAdapter(axios);

describe('Media Service', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  describe('uploadMedia', () => {
    test('should upload a single file successfully', async () => {
      // Mock response
      mockAxios.onPost('/api/media/upload').reply(200, {
        success: true,
        message: 'Media uploaded successfully',
        media: {
          id: 'test-media-id',
          mediaType: 'image',
          filename: 'test-image.jpg',
          url: '/api/media/test-media-id',
          thumbnailUrl: '/api/media/thumbnail/test-media-id',
          metadata: { width: 800, height: 600 }
        }
      });

      // Create a test file
      const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
      const conversationId = 'test-conversation-id';
      
      // Mock progress callback
      const onProgress = jest.fn();
      
      // Call the service
      const result = await mediaService.uploadMedia(file, conversationId, onProgress);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('test-media-id');
      expect(result.mediaType).toBe('image');
      expect(result.filename).toBe('test-image.jpg');
    });

    test('should handle upload errors', async () => {
      // Mock error response
      mockAxios.onPost('/api/media/upload').reply(400, {
        success: false,
        error: 'Invalid file type'
      });

      // Create a test file
      const file = new File(['test content'], 'test.xyz', { type: 'application/octet-stream' });
      const conversationId = 'test-conversation-id';
      
      // Call the service and expect it to throw
      await expect(mediaService.uploadMedia(file, conversationId)).rejects.toThrow('Invalid file type');
    });

    test('should handle network errors', async () => {
      // Mock network error
      mockAxios.onPost('/api/media/upload').networkError();

      // Create a test file
      const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
      const conversationId = 'test-conversation-id';
      
      // Call the service and expect it to throw
      await expect(mediaService.uploadMedia(file, conversationId)).rejects.toThrow();
    });
  });

  describe('uploadMediaBatch', () => {
    test('should upload multiple files successfully', async () => {
      // Mock batch upload response
      mockAxios.onPost('/api/media/upload/batch').reply(200, {
        success: true,
        message: 'All media uploaded successfully',
        media: [
          {
            id: 'test-image-id',
            mediaType: 'image',
            filename: 'test-image.jpg',
            url: '/api/media/test-image-id',
            thumbnailUrl: '/api/media/thumbnail/test-image-id',
            metadata: { width: 800, height: 600 }
          },
          {
            id: 'test-video-id',
            mediaType: 'video',
            filename: 'test-video.mp4',
            url: '/api/media/test-video-id',
            thumbnailUrl: '/api/media/thumbnail/test-video-id',
            metadata: { duration: 30 }
          }
        ],
        total: 2
      });

      // Create test files
      const files = [
        new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' }),
        new File(['test video content'], 'test-video.mp4', { type: 'video/mp4' })
      ];
      const conversationId = 'test-conversation-id';
      
      // Mock callbacks
      const onProgress = jest.fn();
      const onFileProgress = jest.fn();
      const onFileComplete = jest.fn();
      
      // Call the service
      const result = await mediaService.uploadMediaBatch(
        files, 
        conversationId, 
        onProgress, 
        onFileProgress, 
        onFileComplete
      );
      
      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].mediaType).toBe('image');
      expect(result[1].mediaType).toBe('video');
    });

    test('should handle partial success', async () => {
      // Mock partial success response
      mockAxios.onPost('/api/media/upload/batch').reply(207, {
        success: true,
        message: 'Some uploads completed with errors',
        media: [
          {
            id: 'test-image-id',
            mediaType: 'image',
            filename: 'test-image.jpg',
            url: '/api/media/test-image-id'
          }
        ],
        errors: [
          {
            filename: 'invalid.xyz',
            error: 'Unsupported file type'
          }
        ],
        total: 2,
        successful: 1,
        failed: 1
      });

      // Create test files
      const files = [
        new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' }),
        new File(['invalid content'], 'invalid.xyz', { type: 'application/octet-stream' })
      ];
      const conversationId = 'test-conversation-id';
      
      // Call the service
      const result = await mediaService.uploadMediaBatch(files, conversationId);
      
      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].mediaType).toBe('image');
    });

    test('should fall back to individual uploads if batch fails', async () => {
      // Mock batch upload failure
      mockAxios.onPost('/api/media/upload/batch').reply(500, {
        success: false,
        error: 'Server error'
      });
      
      // Mock individual uploads success
      mockAxios.onPost('/api/media/upload').reply(200, (config) => {
        // Extract filename from FormData
        const formData = config.data;
        const file = formData.get('file');
        const filename = file.name;
        
        return {
          success: true,
          message: 'Media uploaded successfully',
          media: {
            id: `test-${filename}-id`,
            mediaType: filename.includes('image') ? 'image' : 'video',
            filename: filename,
            url: `/api/media/test-${filename}-id`
          }
        };
      });

      // Create test files
      const files = [
        new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' }),
        new File(['test video content'], 'test-video.mp4', { type: 'video/mp4' })
      ];
      const conversationId = 'test-conversation-id';
      
      // Call the service
      const result = await mediaService.uploadMediaBatch(files, conversationId);
      
      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('validateFile', () => {
    test('should validate supported image file', () => {
      const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
      const result = mediaService.validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.mediaType).toBe('image');
    });

    test('should validate supported video file', () => {
      const file = new File(['test video content'], 'test-video.mp4', { type: 'video/mp4' });
      const result = mediaService.validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.mediaType).toBe('video');
    });

    test('should validate supported document file', () => {
      const file = new File(['test document content'], 'test-doc.pdf', { type: 'application/pdf' });
      const result = mediaService.validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.mediaType).toBe('document');
    });

    test('should reject unsupported file type', () => {
      const file = new File(['test content'], 'test.xyz', { type: 'application/octet-stream' });
      const result = mediaService.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    test('should reject files exceeding size limit', () => {
      // Create a large file (101MB)
      const largeContent = new ArrayBuffer(101 * 1024 * 1024);
      const file = new File([largeContent], 'large-file.jpg', { type: 'image/jpeg' });
      
      const result = mediaService.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum size');
    });
  });

  describe('generatePreview', () => {
    test('should generate preview URL for image', async () => {
      // Create a test image file
      const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
      
      // Mock URL.createObjectURL
      const mockUrl = 'blob:test-url';
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
      
      const result = await mediaService.generatePreview(file);
      
      expect(result).toBe(mockUrl);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    test('should generate preview URL for video', async () => {
      // Create a test video file
      const file = new File(['test video content'], 'test-video.mp4', { type: 'video/mp4' });
      
      // Mock URL.createObjectURL
      const mockUrl = 'blob:test-url';
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
      
      const result = await mediaService.generatePreview(file);
      
      expect(result).toBe(mockUrl);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    test('should generate generic preview for document', async () => {
      // Create a test document file
      const file = new File(['test document content'], 'test-doc.pdf', { type: 'application/pdf' });
      
      const result = await mediaService.generatePreview(file);
      
      // Should return a path to a static document icon
      expect(result).toContain('/assets/icons/');
    });
  });

  describe('getMediaForConversation', () => {
    test('should fetch media for a conversation', async () => {
      // Mock response
      mockAxios.onGet('/api/media/conversation/test-conversation-id').reply(200, {
        success: true,
        media: [
          {
            id: 'media-1',
            mediaType: 'image',
            filename: 'image1.jpg',
            url: '/api/media/media-1'
          },
          {
            id: 'media-2',
            mediaType: 'video',
            filename: 'video1.mp4',
            url: '/api/media/media-2'
          }
        ]
      });

      const conversationId = 'test-conversation-id';
      const result = await mediaService.getMediaForConversation(conversationId);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('should handle errors when fetching media', async () => {
      // Mock error response
      mockAxios.onGet('/api/media/conversation/invalid-id').reply(404, {
        success: false,
        error: 'Conversation not found'
      });

      const conversationId = 'invalid-id';
      
      await expect(mediaService.getMediaForConversation(conversationId)).rejects.toThrow('Conversation not found');
    });
  });
});
