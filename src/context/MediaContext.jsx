import React, { createContext, useContext, useState, useCallback, useReducer } from 'react';
import mediaService from '../services/mediaService';

// Create context
const MediaContext = createContext();

// Media reducer for more complex state management
const mediaReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MEDIA_LIST':
      return {
        ...state,
        mediaList: action.payload.media,
        pagination: action.payload.pagination || state.pagination
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: {
          ...state.filter,
          ...action.payload
        }
      };
    case 'RESET_FILTER':
      return {
        ...state,
        filter: {
          mediaType: null,
          limit: 50,
          offset: 0
        }
      };
    case 'APPEND_MEDIA':
      return {
        ...state,
        mediaList: [...state.mediaList, ...action.payload.media],
        pagination: action.payload.pagination || state.pagination
      };
    case 'REMOVE_MEDIA':
      return {
        ...state,
        mediaList: state.mediaList.filter(media => media.id !== action.payload)
      };
    case 'RESET':
      return {
        mediaList: [],
        pagination: {
          total: 0,
          limit: 50,
          offset: 0,
          hasMore: false
        },
        loading: false,
        error: null,
        filter: {
          mediaType: null,
          limit: 50,
          offset: 0
        }
      };
    default:
      return state;
  }
};

/**
 * Media Provider Component
 * 
 * Provides media management functionality to the application
 */
export const MediaProvider = ({ children }) => {
  const [mediaUploads, setMediaUploads] = useState({});
  const [mediaCache, setMediaCache] = useState({});
  const [loadingMedia, setLoadingMedia] = useState({});
  const [mediaErrors, setMediaErrors] = useState({});
  
  // Media gallery state with reducer for more complex state management
  const [galleryState, dispatch] = useReducer(mediaReducer, {
    mediaList: [],
    pagination: {
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false
    },
    loading: false,
    error: null,
    filter: {
      mediaType: null,
      limit: 50,
      offset: 0
    }
  });

  // Process media items and add thumbnail URLs
  const processMediaItems = (mediaItems) => {
    if (!mediaItems || !Array.isArray(mediaItems)) return [];
    
    return mediaItems.map(media => {
      // Ensure we have a valid media object
      if (!media) return null;
      
      // Add formatted size for display
      const formattedSize = media.size ? mediaService.formatFileSize(media.size) : 'Unknown size';
      
      // Process metadata based on media type
      let processedMetadata = { ...media.metadata };
      
      if (media.mediaType === 'image') {
        // Add aspect ratio if dimensions are available
        if (processedMetadata.width && processedMetadata.height) {
          processedMetadata.aspectRatio = processedMetadata.width / processedMetadata.height;
        }
      } else if (media.mediaType === 'video' || media.mediaType === 'audio') {
        // Format duration if available
        if (processedMetadata.duration) {
          const minutes = Math.floor(processedMetadata.duration / 60);
          const seconds = Math.floor(processedMetadata.duration % 60);
          processedMetadata.formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      
      return {
        ...media,
        formattedSize,
        metadata: processedMetadata,
        // Ensure URLs are properly set
        url: media.url || mediaService.getMediaUrl(media.id),
        thumbnailUrl: media.thumbnailUrl || (media.id ? mediaService.getMediaThumbnailUrl(media.id) : null)
      };
    }).filter(Boolean); // Remove any null items
  };

  /**
   * Upload a media file
   * 
   * @param {File} file - The file to upload
   * @param {string} conversationId - The conversation ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Uploaded media object
   */
  const uploadMedia = useCallback(async (file, conversationId, onProgress) => {
    try {
      // Set loading state
      setLoadingMedia(prev => ({
        ...prev,
        [file.name]: true
      }));

      // Clear any previous errors
      setMediaErrors(prev => ({
        ...prev,
        [file.name]: null
      }));

      // Upload the file
      const media = await mediaService.uploadMedia(file, conversationId, onProgress);

      // Update uploads state
      setMediaUploads(prev => ({
        ...prev,
        [media.id]: media
      }));

      // Clear loading state
      setLoadingMedia(prev => ({
        ...prev,
        [file.name]: false
      }));

      return media;
    } catch (error) {
      // Set error state
      setMediaErrors(prev => ({
        ...prev,
        [file.name]: error.message || 'Upload failed'
      }));

      // Clear loading state
      setLoadingMedia(prev => ({
        ...prev,
        [file.name]: false
      }));

      throw error;
    }
  }, []);

  /**
   * Get media for a conversation
   * 
   * @param {string} conversationId - The conversation ID
   * @param {Object} options - Query options
   * @param {boolean} append - Whether to append to existing media list
   * @returns {Promise<Array<Object>>} Array of media objects
   */
  const getConversationMedia = useCallback(async (conversationId, options = {}, append = false) => {
    try {
      // Set loading state
      if (!append) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }

      // Clear any previous errors
      dispatch({ type: 'SET_ERROR', payload: null });

      // Get media for conversation
      const result = await mediaService.getConversationMedia(conversationId, options);

      // Process media items to add thumbnail URLs if not present
      if (result.media && Array.isArray(result.media)) {
        result.media = processMediaItems(result.media);
      }

      // Update state based on append flag
      if (append) {
        dispatch({ 
          type: 'APPEND_MEDIA', 
          payload: {
            media: result.media,
            pagination: result.pagination
          }
        });
      } else {
        dispatch({ 
          type: 'SET_MEDIA_LIST', 
          payload: {
            media: result.media,
            pagination: result.pagination
          }
        });
      }

      // Update cache
      setMediaCache(prev => ({
        ...prev,
        [conversationId]: result.media
      }));

      // Clear loading state
      dispatch({ type: 'SET_LOADING', payload: false });

      return result;
    } catch (error) {
      // Set error state
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Failed to load media'
      });

      // Clear loading state
      dispatch({ type: 'SET_LOADING', payload: false });

      throw error;
    }
  }, []);

  /**
   * Load more media for the current conversation
   * 
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<Array<Object>>} Array of media objects
   */
  const loadMoreMedia = useCallback(async (conversationId) => {
    if (!galleryState.pagination.hasMore || galleryState.loading) {
      return;
    }

    const newOffset = galleryState.pagination.offset + galleryState.pagination.limit;
    
    const options = {
      ...galleryState.filter,
      offset: newOffset
    };

    return getConversationMedia(conversationId, options, true);
  }, [galleryState, getConversationMedia]);

  /**
   * Set media filter
   * 
   * @param {Object} filter - Filter options
   * @param {string} conversationId - The conversation ID to refetch
   */
  const setMediaFilter = useCallback(async (filter, conversationId) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
    
    if (conversationId) {
      const options = {
        ...galleryState.filter,
        ...filter,
        offset: 0 // Reset offset when changing filters
      };
      
      return getConversationMedia(conversationId, options);
    }
  }, [galleryState.filter, getConversationMedia]);

  /**
   * Reset media filter
   * 
   * @param {string} conversationId - The conversation ID to refetch
   */
  const resetMediaFilter = useCallback(async (conversationId) => {
    dispatch({ type: 'RESET_FILTER' });
    
    if (conversationId) {
      return getConversationMedia(conversationId, { 
        mediaType: null,
        limit: 50,
        offset: 0
      });
    }
  }, [getConversationMedia]);

  /**
   * Download a media file
   * 
   * @param {string} mediaId - The media ID
   * @param {string} filename - The filename to save as
   */
  const downloadMedia = useCallback((mediaId, filename) => {
    const url = mediaService.getMediaUrl(mediaId);
    mediaService.downloadFile(url, filename);
  }, []);

  /**
   * Delete a media file
   * 
   * @param {string} mediaId - The media ID
   * @returns {Promise<boolean>} Success indicator
   */
  const deleteMedia = useCallback(async (mediaId) => {
    try {
      // Set loading state
      setLoadingMedia(prev => ({
        ...prev,
        [mediaId]: true
      }));

      // Clear any previous errors
      setMediaErrors(prev => ({
        ...prev,
        [mediaId]: null
      }));

      // Delete the media
      await mediaService.deleteMedia(mediaId);

      // Update uploads state
      setMediaUploads(prev => {
        const newUploads = { ...prev };
        delete newUploads[mediaId];
        return newUploads;
      });

      // Update gallery state
      dispatch({ type: 'REMOVE_MEDIA', payload: mediaId });

      // Update cache for all conversations
      setMediaCache(prev => {
        const newCache = { ...prev };
        
        // Remove the media from all conversation caches
        Object.keys(newCache).forEach(conversationId => {
          if (Array.isArray(newCache[conversationId])) {
            newCache[conversationId] = newCache[conversationId].filter(
              item => item.id !== mediaId
            );
          }
        });
        
        return newCache;
      });

      // Clear loading state
      setLoadingMedia(prev => ({
        ...prev,
        [mediaId]: false
      }));

      return true;
    } catch (error) {
      // Set error state
      setMediaErrors(prev => ({
        ...prev,
        [mediaId]: error.message || 'Failed to delete media'
      }));

      // Clear loading state
      setLoadingMedia(prev => ({
        ...prev,
        [mediaId]: false
      }));

      throw error;
    }
  }, []);

  // Context value
  const value = {
    // Media uploads
    mediaUploads,
    loadingMedia,
    mediaErrors,
    uploadMedia,
    downloadMedia,
    deleteMedia,
    
    // Media gallery
    galleryState,
    getConversationMedia,
    loadMoreMedia,
    setMediaFilter,
    resetMediaFilter
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};

/**
 * Hook to use the media context
 * 
 * @returns {Object} Media context
 */
export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};

export default MediaContext;
