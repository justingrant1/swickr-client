import socketService from './socketService';
import encryptionService from './encryptionService';
import performanceService from './performanceService';

/**
 * Encrypted Presence Service
 * 
 * Provides end-to-end encrypted presence indicators and message delivery status
 * for the Swickr messaging application.
 */
class EncryptedPresenceService {
  constructor() {
    this.initialized = false;
    this.userKeys = null;
    this.userId = null;
    this.preferences = {
      encryptReadReceipts: true,
      encryptTypingIndicators: true,
      encryptPresenceUpdates: true
    };
    
    // Initialize socket event listeners
    this._initSocketListeners();
  }
  
  /**
   * Initialize the encrypted presence service with user keys
   * 
   * @param {Object} userKeys - User's encryption keys
   * @param {string} userId - User's ID
   */
  init(userKeys, userId) {
    if (!userKeys || !userId) {
      console.error('Cannot initialize encrypted presence service: missing keys or userId');
      return false;
    }
    
    this.userKeys = userKeys;
    this.userId = userId;
    this.initialized = true;
    
    // Request user preferences from server
    socketService.emit('get_encrypted_presence_preferences');
    
    console.log('Encrypted presence service initialized');
    return true;
  }
  
  /**
   * Check if encryption is available for presence data
   * 
   * @returns {boolean} Whether encryption is available
   */
  isEncryptionAvailable() {
    return this.initialized && !!this.userKeys;
  }
  
  /**
   * Initialize socket event listeners
   * @private
   */
  _initSocketListeners() {
    // Handle encrypted presence preferences
    socketService.on('encrypted_presence_preferences', (preferences) => {
      this.preferences = {
        ...this.preferences,
        ...preferences
      };
      console.log('Encrypted presence preferences updated:', this.preferences);
    });
    
    // Handle encrypted read receipts
    socketService.on('encrypted_read_receipt', async (data) => {
      try {
        if (!this.isEncryptionAvailable()) return;
        
        const decryptedData = await this._decryptPresenceData(data);
        if (!decryptedData) return;
        
        // Emit a standard read receipt event for the app to handle
        socketService.emit('message_read', {
          messageId: decryptedData.messageId,
          userId: decryptedData.userId,
          timestamp: decryptedData.timestamp
        });
      } catch (error) {
        console.error('Error processing encrypted read receipt:', error);
      }
    });
    
    // Handle encrypted typing indicators
    socketService.on('encrypted_typing', async (data) => {
      try {
        if (!this.isEncryptionAvailable()) return;
        
        const decryptedData = await this._decryptPresenceData(data);
        if (!decryptedData) return;
        
        // Emit a standard typing event for the app to handle
        socketService.emit('typing', {
          conversationId: decryptedData.conversationId,
          userId: decryptedData.userId
        });
      } catch (error) {
        console.error('Error processing encrypted typing indicator:', error);
      }
    });
    
    // Handle encrypted typing stopped indicators
    socketService.on('encrypted_typing_stopped', async (data) => {
      try {
        if (!this.isEncryptionAvailable()) return;
        
        const decryptedData = await this._decryptPresenceData(data);
        if (!decryptedData) return;
        
        // Emit a standard typing stopped event for the app to handle
        socketService.emit('typing_stopped', {
          conversationId: decryptedData.conversationId,
          userId: decryptedData.userId
        });
      } catch (error) {
        console.error('Error processing encrypted typing stopped indicator:', error);
      }
    });
    
    // Handle encrypted presence updates
    socketService.on('encrypted_presence_update', async (data) => {
      try {
        if (!this.isEncryptionAvailable()) return;
        
        const decryptedData = await this._decryptPresenceData(data);
        if (!decryptedData) return;
        
        // Emit a standard user status event for the app to handle
        socketService.emit('user_status', {
          userId: decryptedData.userId,
          status: decryptedData.status
        });
      } catch (error) {
        console.error('Error processing encrypted presence update:', error);
      }
    });
  }
  
  /**
   * Encrypt presence data for recipients
   * 
   * @param {Object} data - Presence data to encrypt
   * @param {Array} recipients - Recipients to encrypt for
   * @returns {Promise<Object>} Encrypted data
   * @private
   */
  async _encryptPresenceData(data, recipients) {
    if (!this.isEncryptionAvailable()) {
      throw new Error('Encryption not available');
    }
    
    try {
      // Use performance service to optimize encryption
      return await performanceService.optimizePresenceEncryption(
        encryptionService.encryptGroupMessage.bind(encryptionService),
        JSON.stringify(data),
        recipients
      );
    } catch (error) {
      console.error('Error encrypting presence data:', error);
      throw error;
    }
  }
  
  /**
   * Decrypt presence data
   * 
   * @param {Object} encryptedData - Encrypted presence data
   * @returns {Promise<Object>} Decrypted data
   * @private
   */
  async _decryptPresenceData(encryptedData) {
    if (!this.isEncryptionAvailable()) {
      return null;
    }
    
    try {
      // Generate cache key for this decryption operation
      const cacheKey = `decrypt:${encryptedData.iv}:${encryptedData.encryptedContent.substring(0, 20)}`;
      
      // Use performance service to cache decryption results
      return await performanceService.cacheOperation(cacheKey, async () => {
        const decryptedContent = await encryptionService.decryptMessage(
          encryptedData.encryptedContent,
          encryptedData.iv,
          this.userKeys.privateKey
        );
        
        return JSON.parse(decryptedContent);
      });
    } catch (error) {
      console.error('Error decrypting presence data:', error);
      return null;
    }
  }
  
  /**
   * Send an encrypted read receipt
   * 
   * @param {string} messageId - ID of the message that was read
   * @param {string} conversationId - ID of the conversation
   * @param {Array} recipients - Recipients to encrypt for
   * @returns {Promise<void>}
   */
  async sendEncryptedReadReceipt(messageId, conversationId, recipients) {
    if (!this.isEncryptionAvailable() || !this.preferences.encryptReadReceipts) {
      // Fall back to unencrypted read receipts
      socketService.emit('read_receipt', { messageId, conversationId });
      return;
    }
    
    // Check if we should throttle this update
    if (!performanceService.shouldSendPresenceUpdate(conversationId, this.userId, 'read')) {
      return;
    }
    
    try {
      // Create read receipt data
      const readReceiptData = {
        messageId,
        conversationId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      };
      
      // Encrypt the read receipt data
      const encryptedData = await this._encryptPresenceData(
        readReceiptData,
        recipients
      );
      
      // Send the encrypted read receipt
      socketService.emit('encrypted_read_receipt', {
        ...encryptedData,
        conversationId
      });
    } catch (error) {
      console.error('Error sending encrypted read receipt:', error);
      
      // Fall back to unencrypted read receipts
      socketService.emit('read_receipt', { messageId, conversationId });
    }
  }
  
  /**
   * Send an encrypted typing indicator
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {Array} recipients - Recipients to encrypt for
   * @returns {Promise<void>}
   */
  async sendEncryptedTypingIndicator(conversationId, recipients) {
    if (!this.isEncryptionAvailable() || !this.preferences.encryptTypingIndicators) {
      // Fall back to unencrypted typing indicators
      socketService.emit('typing', { conversationId });
      return;
    }
    
    // Check if we should throttle this update
    if (!performanceService.shouldSendPresenceUpdate(conversationId, this.userId, 'typing')) {
      return;
    }
    
    // Use debounce to avoid excessive encryption operations
    performanceService.debounce(`typing:${conversationId}`, async () => {
      try {
        // Create typing indicator data
        const typingData = {
          conversationId,
          userId: this.userId,
          timestamp: new Date().toISOString()
        };
        
        // Encrypt the typing indicator data
        const encryptedData = await this._encryptPresenceData(
          typingData,
          recipients
        );
        
        // Send the encrypted typing indicator
        socketService.emit('encrypted_typing', {
          ...encryptedData,
          conversationId
        });
      } catch (error) {
        console.error('Error sending encrypted typing indicator:', error);
        
        // Fall back to unencrypted typing indicators
        socketService.emit('typing', { conversationId });
      }
    }, 300); // Debounce typing indicators by 300ms
  }
  
  /**
   * Send an encrypted typing stopped indicator
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {Array} recipients - Recipients to encrypt for
   * @returns {Promise<void>}
   */
  async sendEncryptedTypingStoppedIndicator(conversationId, recipients) {
    if (!this.isEncryptionAvailable() || !this.preferences.encryptTypingIndicators) {
      // Fall back to unencrypted typing stopped indicators
      socketService.emit('typing_stopped', { conversationId });
      return;
    }
    
    try {
      // Create typing stopped indicator data
      const typingStoppedData = {
        conversationId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      };
      
      // Encrypt the typing stopped indicator data
      const encryptedData = await this._encryptPresenceData(
        typingStoppedData,
        recipients
      );
      
      // Send the encrypted typing stopped indicator
      socketService.emit('encrypted_typing_stopped', {
        ...encryptedData,
        conversationId
      });
    } catch (error) {
      console.error('Error sending encrypted typing stopped indicator:', error);
      
      // Fall back to unencrypted typing stopped indicators
      socketService.emit('typing_stopped', { conversationId });
    }
  }
  
  /**
   * Send an encrypted presence update
   * 
   * @param {string} status - User's status
   * @param {Array} recipients - Recipients to encrypt for
   * @returns {Promise<void>}
   */
  async sendEncryptedPresenceUpdate(status, recipients) {
    if (!this.isEncryptionAvailable() || !this.preferences.encryptPresenceUpdates) {
      // Fall back to unencrypted presence updates
      socketService.emit('status', status);
      return;
    }
    
    // Check if we should throttle this update
    if (!performanceService.shouldSendPresenceUpdate('global', this.userId, 'presence')) {
      return;
    }
    
    // Use batch operation for presence updates
    performanceService.batchOperation('presence_updates', { status, recipients }, async (items) => {
      try {
        // Process each item in the batch
        return Promise.all(items.map(async ({ status, recipients }) => {
          // Create presence update data
          const presenceData = {
            userId: this.userId,
            status,
            timestamp: new Date().toISOString()
          };
          
          // Encrypt the presence update data
          const encryptedData = await this._encryptPresenceData(
            presenceData,
            recipients
          );
          
          // Send the encrypted presence update
          socketService.emit('encrypted_presence_update', encryptedData);
          
          return { success: true };
        }));
      } catch (error) {
        console.error('Error sending encrypted presence updates:', error);
        throw error;
      }
    });
  }
  
  /**
   * Update encrypted presence preferences
   * 
   * @param {Object} preferences - New preferences
   * @returns {Promise<void>}
   */
  async updatePreferences(preferences) {
    this.preferences = {
      ...this.preferences,
      ...preferences
    };
    
    // Send preferences to server
    socketService.emit('update_encrypted_presence_preferences', this.preferences);
  }
  
  /**
   * Get current encrypted presence preferences
   * 
   * @returns {Object} Current preferences
   */
  getPreferences() {
    return { ...this.preferences };
  }
  
  /**
   * Get performance metrics for encrypted presence
   * 
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return performanceService.getMetrics();
  }
  
  /**
   * Optimize performance settings based on device capabilities
   * 
   * @returns {Promise<void>}
   */
  async optimizeForDevice() {
    // Check device capabilities
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowPowerDevice = isMobile && navigator.hardwareConcurrency <= 4;
    
    // Adjust performance settings based on device
    if (isLowPowerDevice) {
      performanceService.updateConfig({
        debounce: {
          typing: 500, // Increase debounce time for typing
          presence: 5000 // Reduce presence update frequency
        },
        worker: {
          useWorker: false // Disable worker on low-power devices
        },
        cache: {
          maxSize: 50 // Reduce cache size
        }
      });
    } else {
      // High-performance device
      performanceService.updateConfig({
        debounce: {
          typing: 200, // Faster typing response
          presence: 1000 // More frequent presence updates
        },
        worker: {
          useWorker: true,
          maxConcurrent: 8 // More concurrent operations
        },
        cache: {
          maxSize: 200 // Larger cache
        }
      });
    }
    
    console.log('Performance optimized for device:', isMobile ? 'mobile' : 'desktop');
  }
}

const encryptedPresenceService = new EncryptedPresenceService();
export default encryptedPresenceService;
