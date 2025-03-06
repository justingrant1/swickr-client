import axios from 'axios';
import { API_URL } from '../config';
import performanceService from './performanceService';

/**
 * Media Service
 * 
 * Handles media file operations including uploads, validation, and processing
 */
const mediaService = {
  /**
   * Upload a single media file
   * 
   * @param {File} file - The file to upload
   * @param {string} conversationId - The conversation ID to associate with the upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} The uploaded media information
   */
  uploadMedia: async (file, conversationId, onProgress) => {
    if (!file || !conversationId) {
      throw new Error('File and conversation ID are required');
    }
    
    // Validate file before upload
    const validation = mediaService.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    
    try {
      // Add file metadata if possible
      const mediaType = mediaService.getMediaType(file);
      formData.append('mediaType', mediaType);
      
      // Extract and add image dimensions for better thumbnails and previews
      if (mediaType === 'image') {
        try {
          const dimensions = await mediaService.getImageDimensions(file);
          formData.append('width', dimensions.width);
          formData.append('height', dimensions.height);
        } catch (error) {
          console.warn('Could not get image dimensions:', error);
        }
      } else if (mediaType === 'video') {
        try {
          const duration = await mediaService.getVideoDuration(file);
          formData.append('duration', duration);
        } catch (error) {
          console.warn('Could not get video duration:', error);
        }
      } else if (mediaType === 'audio') {
        try {
          const duration = await mediaService.getVideoDuration(file); // Same method works for audio
          formData.append('duration', duration);
        } catch (error) {
          console.warn('Could not get audio duration:', error);
        }
      }
      
      // Upload the file with progress tracking
      const response = await axios.post(`${API_URL}/api/media/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
        // Add timeout and retry configuration
        timeout: 120000, // 2 minutes timeout for larger files
        maxContentLength: 100 * 1024 * 1024, // 100MB max content length
        maxBodyLength: 100 * 1024 * 1024 // 100MB max body length
      });
      
      return response.data.media;
    } catch (error) {
      // Enhanced error handling with more specific messages
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const serverError = error.response.data.error || error.response.data.message || 'Server error';
        
        // Map common error codes to user-friendly messages
        if (error.response.status === 413) {
          throw new Error('File is too large to upload. Maximum file size is 100MB.');
        } else if (error.response.status === 415) {
          throw new Error('File type is not supported. Please try a different file format.');
        } else if (error.response.status === 403) {
          throw new Error('You do not have permission to upload to this conversation.');
        } else if (error.response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else {
          throw new Error(`Upload failed: ${serverError}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection and try again.');
      } else if (error.code === 'ECONNABORTED') {
        // Request timeout
        throw new Error('Upload timed out. Please try again with a smaller file or check your connection.');
      } else if (error.message && error.message.includes('Network Error')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    }
  },
  
  /**
   * Upload multiple media files
   * 
   * @param {Array<File>} files - Array of files to upload
   * @param {string} conversationId - The conversation ID to associate with the uploads
   * @param {Function} onProgress - Progress callback function for each file
   * @param {Function} onFileComplete - Callback when each file completes
   * @returns {Promise<Array<Object>>} Array of uploaded media information
   */
  uploadMultipleMedia: async (files, conversationId, onProgress, onFileComplete) => {
    if (!files || !files.length || !conversationId) {
      throw new Error('Files and conversation ID are required');
    }
    
    const results = [];
    const errors = [];
    
    // Calculate total size for overall progress tracking
    const totalSize = files.reduce((total, file) => total + file.size, 0);
    let uploadedSize = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const currentFileIndex = i;
      
      try {
        // Track progress for individual file and update overall progress
        const fileProgress = (progress) => {
          if (onProgress) {
            const fileContribution = (file.size / totalSize) * progress;
            const overallProgress = Math.round((uploadedSize / totalSize) * 100 + fileContribution);
            onProgress(overallProgress, currentFileIndex, files.length, progress);
          }
        };
        
        const result = await mediaService.uploadMedia(file, conversationId, fileProgress);
        results.push(result);
        
        // Update uploaded size after successful upload
        uploadedSize += file.size;
        
        // Notify that a file is complete
        if (onFileComplete) {
          onFileComplete(result, currentFileIndex, files.length, null);
        }
      } catch (error) {
        console.error(`Error uploading file ${currentFileIndex + 1}/${files.length}:`, error);
        errors.push({ file: file.name, error: error.message });
        
        // Notify that a file failed
        if (onFileComplete) {
          onFileComplete(null, currentFileIndex, files.length, error.message);
        }
      }
    }
    
    // If all uploads failed, throw an error
    if (errors.length === files.length) {
      throw new Error(`Failed to upload all files: ${errors.map(e => e.file).join(', ')}`);
    }
    
    // If some uploads failed, include error information in the result
    if (errors.length > 0) {
      return {
        media: results,
        errors: errors,
        partial: true
      };
    }
    
    return results;
  },
  
  /**
   * Upload multiple media files in a batch
   * 
   * @param {Array} files - Array of files to upload
   * @param {string} conversationId - ID of the conversation
   * @param {Function} onProgress - Progress callback for overall progress
   * @param {Function} onFileProgress - Progress callback for individual file progress
   * @param {Function} onFileComplete - Callback when a single file is complete
   * @returns {Promise<Array>} - Array of uploaded media objects
   */
  uploadMediaBatch: async (files, conversationId, onProgress, onFileProgress, onFileComplete) => {
    if (!files || !files.length) {
      throw new Error('No files provided for upload');
    }

    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    // Validate all files first
    const invalidFiles = [];
    const validFiles = [];

    for (const file of files) {
      const validation = mediaService.validateFile(file);
      if (!validation.valid) {
        invalidFiles.push({
          file,
          error: validation.error
        });
      } else {
        validFiles.push(file);
      }
    }

    // If there are no valid files, throw an error
    if (validFiles.length === 0) {
      throw new Error(`No valid files to upload. Errors: ${invalidFiles.map(f => `${f.file.name}: ${f.error}`).join(', ')}`);
    }

    // If using the batch upload endpoint
    if (validFiles.length > 1) {
      try {
        // Extract dimensions for images
        const dimensions = {};
        const durations = {};
        
        // Process files to extract metadata
        for (const file of validFiles) {
          const mediaType = mediaService.getMediaType(file);
          
          // Extract image dimensions
          if (mediaType === 'image') {
            try {
              const img = await mediaService.createImageFromFile(file);
              dimensions[file.name] = {
                width: img.width,
                height: img.height
              };
            } catch (error) {
              console.warn(`Failed to extract dimensions for ${file.name}:`, error);
            }
          }
          
          // Extract video/audio duration
          if (mediaType === 'video' || mediaType === 'audio') {
            try {
              const duration = await mediaService.getMediaDuration(file);
              durations[file.name] = { duration };
            } catch (error) {
              console.warn(`Failed to extract duration for ${file.name}:`, error);
            }
          }
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        
        // Add dimensions and durations as JSON strings
        if (Object.keys(dimensions).length > 0) {
          formData.append('dimensions', JSON.stringify(dimensions));
        }
        
        if (Object.keys(durations).length > 0) {
          formData.append('durations', JSON.stringify(durations));
        }
        
        // Add all files
        validFiles.forEach(file => {
          formData.append('files', file);
        });
        
        // Make the request with progress tracking
        const response = await axios.post(`${API_URL}/api/media/upload/batch`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000, // 2 minutes timeout for batch uploads
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        });
        
        // Handle response
        if (response.status === 207) {
          // Partial success
          console.warn('Some files failed to upload:', response.data.errors);
          
          // Call onFileComplete for each successful file
          if (onFileComplete && response.data.media) {
            response.data.media.forEach(media => {
              onFileComplete(media);
            });
          }
          
          // Return successful uploads
          return response.data.media;
        } else {
          // All files uploaded successfully
          
          // Call onFileComplete for each file
          if (onFileComplete && response.data.media) {
            response.data.media.forEach(media => {
              onFileComplete(media);
            });
          }
          
          return response.data.media;
        }
      } catch (error) {
        console.error('Batch upload failed:', error);
        
        // Fallback to individual uploads if batch fails
        console.log('Falling back to individual uploads...');
        return mediaService.uploadFilesIndividually(validFiles, conversationId, onProgress, onFileProgress, onFileComplete);
      }
    } else {
      // Only one valid file, use individual upload
      return mediaService.uploadFilesIndividually(validFiles, conversationId, onProgress, onFileProgress, onFileComplete);
    }
  },
  
  /**
   * Upload files individually (used as fallback if batch upload fails)
   * 
   * @param {Array} files - Array of files to upload
   * @param {string} conversationId - ID of the conversation
   * @param {Function} onProgress - Progress callback for overall progress
   * @param {Function} onFileProgress - Progress callback for individual file progress
   * @param {Function} onFileComplete - Callback when a single file is complete
   * @returns {Promise<Array>} - Array of uploaded media objects
   */
  uploadFilesIndividually: async (files, conversationId, onProgress, onFileProgress, onFileComplete) => {
    const results = [];
    const errors = [];
    let overallProgress = 0;
    
    // Upload each file individually
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = i;
      
      try {
        // Create a progress handler for this specific file
        const fileProgressHandler = (progress) => {
          if (onFileProgress) {
            onFileProgress(fileIndex, progress);
          }
          
          // Update overall progress
          if (onProgress) {
            const fileWeight = 1 / files.length;
            const fileContribution = progress * fileWeight;
            const newOverallProgress = Math.min(
              Math.round(overallProgress + fileContribution),
              fileIndex === files.length - 1 ? 100 : 99 // Only reach 100% when all files are done
            );
            
            if (newOverallProgress > overallProgress) {
              overallProgress = newOverallProgress;
              onProgress(overallProgress);
            }
          }
        };
        
        // Upload the file
        const result = await mediaService.uploadMedia(file, conversationId, fileProgressHandler);
        results.push(result);
        
        // Call the completion callback
        if (onFileComplete) {
          onFileComplete(result);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({
          file,
          error: error.message || 'Upload failed'
        });
      }
    }
    
    // If all files failed, throw an error
    if (results.length === 0 && errors.length > 0) {
      throw new Error(`All files failed to upload. Errors: ${errors.map(e => `${e.file.name}: ${e.error}`).join(', ')}`);
    }
    
    // Return successful uploads
    return results;
  },
  
  /**
   * Get media for a conversation
   * 
   * @param {string} conversationId - The conversation ID
   * @param {Object} options - Options for filtering media
   * @param {string} options.mediaType - Filter by media type (image, video, audio, document)
   * @param {number} options.limit - Maximum number of items to return
   * @param {number} options.offset - Number of items to skip
   * @param {string} options.sort - Sort order (newest, oldest, largest)
   * @returns {Promise<Object>} Object containing media array and pagination info
   */
  getConversationMedia: async (conversationId, options = {}) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/media/conversation/${conversationId}`, 
        { 
          params: options,
          withCredentials: true 
        }
      );
      
      return {
        media: response.data.media || [],
        pagination: response.data.pagination || {
          total: 0,
          limit: options.limit || 50,
          offset: options.offset || 0,
          hasMore: false
        }
      };
    } catch (error) {
      console.error('Error getting conversation media:', error);
      throw error;
    }
  },
  
  /**
   * Download a file from a URL
   * 
   * @param {string} url - The URL of the file to download
   * @param {string} filename - The filename to save as
   */
  downloadFile: (url, filename) => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    
    // Set the download attributes
    link.href = url.startsWith('http') ? url : `${API_URL}${url}`;
    link.download = filename || 'download';
    
    // Append to the document
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  },
  
  /**
   * Validate a file for upload
   * 
   * @param {File} file - The file to validate
   * @returns {Object} Validation result with valid flag and error message
   */
  validateFile: (file) => {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    // Check file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size exceeds maximum limit (${mediaService.formatFileSize(MAX_FILE_SIZE)})`
      };
    }
    
    // Validate file type
    const mediaType = mediaService.getMediaType(file);
    if (mediaType === 'unknown') {
      return { valid: false, error: 'Unsupported file type' };
    }
    
    // Additional validation based on media type
    if (mediaType === 'image') {
      // Validate image dimensions, format, etc. if needed
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        return { valid: false, error: 'Unsupported image format' };
      }
    } else if (mediaType === 'video') {
      // Validate video format, duration, etc. if needed
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validVideoTypes.includes(file.type)) {
        return { valid: false, error: 'Unsupported video format' };
      }
    } else if (mediaType === 'audio') {
      // Validate audio format, duration, etc. if needed
      const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
      if (!validAudioTypes.includes(file.type)) {
        return { valid: false, error: 'Unsupported audio format' };
      }
    } else if (mediaType === 'document') {
      // Validate document format, etc. if needed
      const validDocumentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
      ];
      if (!validDocumentTypes.includes(file.type)) {
        return { valid: false, error: 'Unsupported document format' };
      }
    }
    
    return { valid: true };
  },
  
  /**
   * Get the media type based on file MIME type
   * 
   * @param {File} file - The file to check
   * @returns {string} The media type (image, video, audio, document, or unknown)
   */
  getMediaType: (file) => {
    if (!file || !file.type) {
      return 'unknown';
    }
    
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (
      mimeType.startsWith('application/') || 
      mimeType.startsWith('text/') ||
      mimeType === 'application/pdf' ||
      mimeType.includes('document') ||
      mimeType.includes('sheet') ||
      mimeType.includes('presentation')
    ) {
      return 'document';
    }
    
    return 'unknown';
  },
  
  /**
   * Format file size in human-readable format
   * 
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Generate a file preview URL
   * 
   * @param {File} file - The file to generate a preview for
   * @returns {Promise<string>} The preview URL
   */
  generatePreview: async (file) => {
    return new Promise((resolve, reject) => {
      try {
        const mediaType = mediaService.getMediaType(file);
        
        if (mediaType === 'image') {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        } else if (mediaType === 'video') {
          resolve(URL.createObjectURL(file));
        } else if (mediaType === 'audio') {
          resolve(URL.createObjectURL(file));
        } else {
          // For documents, use a generic icon based on file type
          const extension = file.name.split('.').pop().toLowerCase();
          resolve(`/assets/file-icons/${extension}.png`);
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Get the media URL for a media ID
   * 
   * @param {string} mediaId - The media ID
   * @returns {string} The media URL
   */
  getMediaUrl: (mediaId) => {
    if (!mediaId) return '';
    
    // If it's already a full URL, return it
    if (mediaId.startsWith('http')) {
      return mediaId;
    }
    
    // If it's a relative URL, prepend the API URL
    if (mediaId.startsWith('/')) {
      return `${API_URL}${mediaId}`;
    }
    
    // Otherwise, construct the URL
    return `${API_URL}/api/media/${mediaId}`;
  },
  
  /**
   * Get the media thumbnail URL for a media ID
   * 
   * @param {string} mediaId - The media ID
   * @returns {string} The media thumbnail URL
   */
  getMediaThumbnailUrl: (mediaId) => {
    if (!mediaId) {
      return '';
    }
    
    return `${API_URL}/api/media/thumbnail/${mediaId}`;
  },
  
  /**
   * Delete a media file
   * 
   * @param {string} mediaId - The media ID to delete
   * @returns {Promise<Object>} The deletion result
   */
  deleteMedia: async (mediaId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/media/${mediaId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  },
  
  /**
   * Get image dimensions
   * 
   * @param {File} file - The image file
   * @returns {Promise<Object>} The image dimensions (width and height)
   */
  getImageDimensions: (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },
  
  /**
   * Get video duration
   * 
   * @param {File} file - The video file
   * @returns {Promise<number>} The video duration in seconds
   */
  getVideoDuration: (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  },
  
  /**
   * Create an image from a file
   * 
   * @param {File} file - The image file
   * @returns {Promise<Image>} The image object
   */
  createImageFromFile: (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },
  
  /**
   * Get media duration
   * 
   * @param {File} file - The media file
   * @returns {Promise<number>} The media duration in seconds
   */
  getMediaDuration: (file) => {
    return new Promise((resolve, reject) => {
      const media = document.createElement('video');
      media.preload = 'metadata';
      media.onloadedmetadata = () => {
        URL.revokeObjectURL(media.src);
        resolve(media.duration);
      };
      media.onerror = reject;
      media.src = URL.createObjectURL(file);
    });
  },
  
  /**
   * Get media statistics
   * 
   * @returns {Promise<Object>} Media statistics including cache usage, performance metrics, etc.
   */
  getMediaStats: async () => {
    try {
      const startTime = performance.now();
      const response = await axios.get(`${API_URL}/api/media/stats`, {
        withCredentials: true
      });
      const endTime = performance.now();
      
      // Record the API call performance
      performanceService.recordMediaMetric('download', endTime - startTime);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching media statistics:', error);
      if (error.response && error.response.status === 403) {
        throw new Error('You do not have permission to view media statistics');
      } else {
        throw new Error('Failed to fetch media statistics');
      }
    }
  },
  
  /**
   * Regenerate thumbnails for existing media
   * 
   * @param {Object} options - Options for thumbnail regeneration
   * @param {Array<string>} options.mediaIds - Optional array of specific media IDs to regenerate
   * @param {string} options.conversationId - Optional conversation ID to filter media
   * @param {boolean} options.forceAll - Whether to force regeneration for all media
   * @param {boolean} options.webpOnly - Whether to only generate WebP thumbnails
   * @param {Function} onProgress - Optional progress callback
   * @returns {Promise<Object>} Result of the regeneration operation
   */
  regenerateThumbnails: async (options = {}, onProgress) => {
    try {
      const startTime = performance.now();
      
      const response = await axios.post(`${API_URL}/api/media/regenerate-thumbnails`, options, {
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      
      const endTime = performance.now();
      
      // Record the API call performance
      performanceService.recordMediaMetric('processing', endTime - startTime);
      
      return response.data;
    } catch (error) {
      console.error('Error regenerating thumbnails:', error);
      if (error.response && error.response.status === 403) {
        throw new Error('You do not have permission to regenerate thumbnails');
      } else {
        throw new Error('Failed to regenerate thumbnails: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      }
    }
  },
  
  /**
   * Get the WebP thumbnail URL for a media ID
   * 
   * @param {string} mediaId - The media ID
   * @returns {string} The WebP thumbnail URL
   */
  getWebpThumbnailUrl: (mediaId) => {
    if (!mediaId) return '';
    return `${API_URL}/api/media/thumbnail/${mediaId}?format=webp`;
  },
  
  /**
   * Track media upload performance
   * 
   * @param {number} uploadTime - Time taken to upload in milliseconds
   * @param {number} originalSize - Original file size in bytes
   * @param {number} optimizedSize - Optimized file size in bytes (if available)
   * @param {string} mediaType - Type of media (image, video, audio, document)
   */
  trackMediaPerformance: (uploadTime, originalSize, optimizedSize, mediaType) => {
    // Record upload time
    performanceService.recordMediaMetric('upload', uploadTime);
    
    // Record size metrics if available
    if (originalSize && optimizedSize) {
      performanceService.recordMediaMetric('size', null, {
        original: originalSize,
        optimized: optimizedSize
      });
    }
    
    // Record media type
    if (mediaType) {
      performanceService.recordMediaMetric('type', null, { type: mediaType });
    }
  },
  
  /**
   * Get media with performance optimization
   * 
   * @param {string} mediaId - The media ID
   * @returns {Promise<Object>} The media object with optimized delivery
   */
  getOptimizedMedia: async (mediaId) => {
    try {
      const startTime = performance.now();
      
      // Check if we should use the cache
      const config = performanceService.getConfig();
      const useCache = config.media?.useCache ?? true;
      
      if (useCache) {
        // Try to get from cache first
        const cacheKey = `media_${mediaId}`;
        const cachedMedia = localStorage.getItem(cacheKey);
        
        if (cachedMedia) {
          try {
            const media = JSON.parse(cachedMedia);
            const cacheEndTime = performance.now();
            
            // Record cache hit
            performanceService.recordMediaMetric('cache', null, { hit: true });
            performanceService.recordMediaMetric('download', cacheEndTime - startTime);
            
            return media;
          } catch (e) {
            // Invalid cache, continue with API call
            localStorage.removeItem(cacheKey);
          }
        } else {
          // Record cache miss
          performanceService.recordMediaMetric('cache', null, { hit: false });
        }
      }
      
      // Fetch from API
      const response = await axios.get(`${API_URL}/api/media/${mediaId}`, {
        withCredentials: true
      });
      
      const endTime = performance.now();
      
      // Record download time
      performanceService.recordMediaMetric('download', endTime - startTime);
      
      // Cache the result if caching is enabled
      if (useCache) {
        const cacheKey = `media_${mediaId}`;
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching optimized media:', error);
      throw new Error('Failed to fetch media: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  },
  
  /**
   * Get media thumbnail with performance optimization
   * 
   * @param {string} mediaId - The media ID
   * @param {boolean} useWebp - Whether to use WebP format (if available)
   * @returns {string} The optimized thumbnail URL
   */
  getOptimizedThumbnailUrl: (mediaId, useWebp = true) => {
    if (!mediaId) return '';
    
    // Check if WebP should be used
    const config = performanceService.getConfig();
    const shouldUseWebp = useWebp && (config.media?.useWebp ?? true);
    
    if (shouldUseWebp) {
      return mediaService.getWebpThumbnailUrl(mediaId);
    } else {
      return mediaService.getMediaThumbnailUrl(mediaId);
    }
  },
};

export default mediaService;
