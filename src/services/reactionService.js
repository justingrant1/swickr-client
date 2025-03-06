import axios from 'axios';
import { API_URL } from '../config';
import performanceService from './performanceService';

/**
 * Reaction Service
 * 
 * Handles message reaction operations
 */
const reactionService = {
  /**
   * Get all reactions for a message
   * 
   * @param {string} messageId - ID of the message
   * @returns {Promise<Object>} Reactions data
   */
  getReactions: async (messageId) => {
    try {
      // Use the cacheReactions method from performanceService to cache reactions
      return await performanceService.cacheReactions(messageId, async () => {
        const startTime = performance.now();
        
        const response = await axios.get(`${API_URL}/api/reactions/message/${messageId}`, {
          withCredentials: true
        });
        
        const endTime = performance.now();
        
        // Track network payload size
        if (response.headers['content-length']) {
          performanceService.trackReactionNetworkPayload(parseInt(response.headers['content-length']));
        } else if (response.data) {
          // Estimate size if content-length not available
          const payloadSize = JSON.stringify(response.data).length;
          performanceService.trackReactionNetworkPayload(payloadSize);
        }
        
        // Track active reaction count
        if (response.data && Array.isArray(response.data)) {
          performanceService.trackActiveReactionCount(messageId, response.data.length);
        }
        
        return response.data;
      });
    } catch (error) {
      console.error('Error fetching reactions:', error);
      throw error;
    }
  },
  
  /**
   * Add a reaction to a message
   * 
   * @param {string} messageId - ID of the message
   * @param {string} emoji - Emoji to add as reaction
   * @returns {Promise<Object>} Created reaction
   */
  addReaction: async (messageId, emoji) => {
    try {
      // Use the batchReactionUpdate method for potential batching
      return await performanceService.batchReactionUpdate(
        messageId,
        emoji,
        async (msgId, emojis) => {
          // Handle both single emoji and array of emojis (for batching)
          const isArray = Array.isArray(emojis);
          const startTime = performance.now();
          
          let response;
          
          if (isArray && emojis.length > 1) {
            // Batch request
            response = await axios.post(
              `${API_URL}/api/reactions/message/${msgId}/batch`,
              { emojis },
              { withCredentials: true }
            );
          } else {
            // Single request
            const singleEmoji = isArray ? emojis[0] : emojis;
            response = await axios.post(
              `${API_URL}/api/reactions/message/${msgId}`,
              { emoji: singleEmoji },
              { withCredentials: true }
            );
          }
          
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          // Track network payload size
          if (response.headers['content-length']) {
            performanceService.trackReactionNetworkPayload(parseInt(response.headers['content-length']));
          }
          
          // Track batch metrics if it was a batch operation
          if (isArray && emojis.length > 1) {
            performanceService.trackBatchReactions('add', msgId, emojis, processingTime);
          } else {
            // Track individual operation
            performanceService.trackReactionAddLatency(processingTime);
          }
          
          // Invalidate cache for this message
          performanceService.invalidateReactionCache(msgId);
          
          // Track optimistic update success
          performanceService.trackOptimisticUpdate(true);
          
          return response.data;
        },
        'add'
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
      
      // Track optimistic update failure
      performanceService.trackOptimisticUpdate(false);
      
      throw error;
    }
  },
  
  /**
   * Add multiple reactions to a message in a single request
   * 
   * @param {string} messageId - ID of the message
   * @param {Array<string>} emojis - Array of emojis to add as reactions
   * @returns {Promise<Object>} Added reactions data
   */
  addReactionsBatch: async (messageId, emojis) => {
    try {
      // Track performance
      const startTime = performance.now();
      
      const response = await axios.post(
        `${API_URL}/api/reactions/message/${messageId}/batch`,
        { emojis },
        { withCredentials: true }
      );
      
      // Track network request completion time
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Track batch operation metrics using the new method
      performanceService.trackBatchReactions('add', messageId, emojis, processingTime);
      
      // Track payload size
      if (response.headers['content-length']) {
        performanceService.trackReactionNetworkPayload(parseInt(response.headers['content-length']));
      } else {
        const payloadSize = JSON.stringify(response.data).length;
        performanceService.trackReactionNetworkPayload(payloadSize);
      }
      
      // Invalidate cache
      performanceService.invalidateReactionCache(messageId);
      
      // Update active reaction count if response contains count data
      if (response.data && response.data.count !== undefined) {
        performanceService.trackActiveReactionCount(messageId, response.data.count);
      }
      
      return response.data;
    } catch (error) {
      // Track failed optimistic update
      performanceService.trackOptimisticUpdate(false);
      console.error('Error adding reactions batch:', error);
      throw error;
    }
  },
  
  /**
   * Remove a reaction from a message
   * 
   * @param {string} messageId - ID of the message
   * @param {string} emoji - Emoji to remove
   * @returns {Promise<Object>} Response data
   */
  removeReaction: async (messageId, emoji) => {
    try {
      // Use the batchReactionUpdate method for potential batching
      return await performanceService.batchReactionUpdate(
        messageId,
        emoji,
        async (msgId, emojis) => {
          // Handle both single emoji and array of emojis (for batching)
          const isArray = Array.isArray(emojis);
          const startTime = performance.now();
          
          let response;
          
          if (isArray && emojis.length > 1) {
            // Batch request
            response = await axios.delete(
              `${API_URL}/api/reactions/message/${msgId}/batch`,
              { 
                data: { emojis },
                withCredentials: true 
              }
            );
          } else {
            // Single request
            const singleEmoji = isArray ? emojis[0] : emojis;
            response = await axios.delete(
              `${API_URL}/api/reactions/message/${msgId}/${encodeURIComponent(singleEmoji)}`,
              { withCredentials: true }
            );
          }
          
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          // Track network payload size
          if (response.headers['content-length']) {
            performanceService.trackReactionNetworkPayload(parseInt(response.headers['content-length']));
          }
          
          // Track batch metrics if it was a batch operation
          if (isArray && emojis.length > 1) {
            performanceService.trackBatchReactions('remove', msgId, emojis, processingTime);
          } else {
            // Track individual operation
            performanceService.trackReactionRemoveLatency(processingTime);
          }
          
          // Invalidate cache for this message
          performanceService.invalidateReactionCache(msgId);
          
          // Track optimistic update success
          performanceService.trackOptimisticUpdate(true);
          
          return response.data;
        },
        'remove'
      );
    } catch (error) {
      console.error('Error removing reaction:', error);
      
      // Track optimistic update failure
      performanceService.trackOptimisticUpdate(false);
      
      throw error;
    }
  },
  
  /**
   * Remove multiple reactions from a message in a single request
   * 
   * @param {string} messageId - ID of the message
   * @param {Array<string>} emojis - Array of emojis to remove
   * @returns {Promise<Object>} Response data
   */
  removeReactionsBatch: async (messageId, emojis) => {
    try {
      // Track performance
      const startTime = performance.now();
      
      const response = await axios.delete(
        `${API_URL}/api/reactions/message/${messageId}/batch`,
        { 
          data: { emojis },
          withCredentials: true 
        }
      );
      
      // Track network request completion time
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Track batch operation metrics using the new method
      performanceService.trackBatchReactions('remove', messageId, emojis, processingTime);
      
      // Track payload size
      if (response.headers['content-length']) {
        performanceService.trackReactionNetworkPayload(parseInt(response.headers['content-length']));
      } else {
        const payloadSize = JSON.stringify(response.data).length;
        performanceService.trackReactionNetworkPayload(payloadSize);
      }
      
      // Invalidate cache
      performanceService.invalidateReactionCache(messageId);
      
      // Update active reaction count if response contains count data
      if (response.data && response.data.count !== undefined) {
        performanceService.trackActiveReactionCount(messageId, response.data.count);
      }
      
      return response.data;
    } catch (error) {
      // Track failed optimistic update
      performanceService.trackOptimisticUpdate(false);
      console.error('Error removing reactions batch:', error);
      throw error;
    }
  },
  
  /**
   * Get common emoji reactions
   * 
   * @returns {Array<string>} Array of common emoji reactions
   */
  getCommonEmojis: () => {
    return ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '🙏'];
  }
};

export default reactionService;
