import socketService from './socketService';

/**
 * Presence Service
 * 
 * Manages user presence, online status, and message delivery status
 */
const presenceService = {
  /**
   * User presence states
   */
  STATES: {
    ONLINE: 'online',
    AWAY: 'away',
    BUSY: 'busy',
    OFFLINE: 'offline'
  },

  /**
   * Message delivery states
   */
  DELIVERY_STATUS: {
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed'
  },

  /**
   * Active users cache
   * Map of userId -> { status, lastSeen }
   */
  _activeUsers: new Map(),

  /**
   * Message status cache
   * Map of messageId -> { status, timestamp }
   */
  _messageStatus: new Map(),

  /**
   * Status change callbacks
   */
  _statusCallbacks: new Set(),

  /**
   * Message status change callbacks
   */
  _messageStatusCallbacks: new Set(),

  /**
   * Initialize presence service
   * Sets up socket listeners for presence events
   */
  init() {
    // Set up socket event listeners
    socketService.on('user_status', this._handleUserStatusUpdate.bind(this));
    socketService.on('message_sent', this._handleMessageSent.bind(this));
    socketService.on('message_delivered', this._handleMessageDelivered.bind(this));
    socketService.on('read_receipt', this._handleReadReceipt.bind(this));
    
    // Set up periodic presence updates
    this._setupPeriodicPresenceUpdate();
    
    return this;
  },

  /**
   * Set up periodic presence updates
   * Sends "online" status every 5 minutes to keep presence active
   */
  _setupPeriodicPresenceUpdate() {
    // Clear any existing interval
    if (this._presenceInterval) {
      clearInterval(this._presenceInterval);
    }
    
    // Set up new interval - update presence every 5 minutes
    this._presenceInterval = setInterval(() => {
      // Only send if socket is connected
      if (socketService.isConnected()) {
        this.updateStatus(this.STATES.ONLINE);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Clean up on window unload
    window.addEventListener('beforeunload', () => {
      if (this._presenceInterval) {
        clearInterval(this._presenceInterval);
      }
      
      // Try to send offline status before page unloads
      if (socketService.isConnected()) {
        socketService.updateStatus(this.STATES.OFFLINE);
      }
    });
  },

  /**
   * Handle user status update from socket
   * 
   * @param {Object} data - Status update data
   * @param {string} data.userId - User ID
   * @param {string} data.status - New status
   */
  _handleUserStatusUpdate(data) {
    const { userId, status } = data;
    
    // Update user status in cache
    this._activeUsers.set(userId, {
      status,
      lastSeen: new Date()
    });
    
    // Notify all callbacks
    this._notifyStatusCallbacks(userId, status);
  },

  /**
   * Handle message sent confirmation from socket
   * 
   * @param {Object} data - Message data
   * @param {string} data.messageId - Message ID
   */
  _handleMessageSent(data) {
    const { messageId } = data;
    
    // Update message status in cache
    this._messageStatus.set(messageId, {
      status: this.DELIVERY_STATUS.SENT,
      timestamp: new Date()
    });
    
    // Notify all callbacks
    this._notifyMessageStatusCallbacks(messageId, this.DELIVERY_STATUS.SENT);
  },

  /**
   * Handle message delivered confirmation from socket
   * 
   * @param {Object} data - Message data
   * @param {string} data.messageId - Message ID
   * @param {string} data.userId - User ID who received the message
   */
  _handleMessageDelivered(data) {
    const { messageId, userId } = data;
    
    // Update message status in cache
    this._messageStatus.set(messageId, {
      status: this.DELIVERY_STATUS.DELIVERED,
      timestamp: new Date(),
      userId
    });
    
    // Notify all callbacks
    this._notifyMessageStatusCallbacks(messageId, this.DELIVERY_STATUS.DELIVERED, userId);
  },

  /**
   * Handle read receipt from socket
   * 
   * @param {Object} data - Read receipt data
   * @param {string} data.conversationId - Conversation ID
   * @param {string} data.userId - User ID who read the message
   * @param {string} data.messageId - Message ID (optional, if specific message)
   */
  _handleReadReceipt(data) {
    const { conversationId, userId, messageId } = data;
    
    if (messageId) {
      // Update specific message status
      this._messageStatus.set(messageId, {
        status: this.DELIVERY_STATUS.READ,
        timestamp: new Date(),
        userId
      });
      
      // Notify all callbacks for this message
      this._notifyMessageStatusCallbacks(messageId, this.DELIVERY_STATUS.READ, userId);
    }
    
    // If we have a conversation ID, we can also notify about all messages in that conversation
    // being read by this user, but we'd need a way to look up messages by conversation
  },

  /**
   * Notify all status change callbacks
   * 
   * @param {string} userId - User ID
   * @param {string} status - New status
   */
  _notifyStatusCallbacks(userId, status) {
    this._statusCallbacks.forEach(callback => {
      try {
        callback(userId, status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  },

  /**
   * Notify all message status change callbacks
   * 
   * @param {string} messageId - Message ID
   * @param {string} status - New status
   * @param {string} userId - User ID (optional)
   */
  _notifyMessageStatusCallbacks(messageId, status, userId = null) {
    this._messageStatusCallbacks.forEach(callback => {
      try {
        callback(messageId, status, userId);
      } catch (error) {
        console.error('Error in message status callback:', error);
      }
    });
  },

  /**
   * Update current user's status
   * 
   * @param {string} status - New status (online, away, busy, offline)
   * @returns {boolean} Success
   */
  updateStatus(status) {
    // Validate status
    if (!Object.values(this.STATES).includes(status)) {
      console.error(`Invalid status: ${status}`);
      return false;
    }
    
    // Send status update via socket
    return socketService.updateStatus(status).success;
  },

  /**
   * Get a user's current status
   * 
   * @param {string} userId - User ID
   * @returns {Object} User status info or null if not found
   */
  getUserStatus(userId) {
    return this._activeUsers.get(userId) || null;
  },

  /**
   * Get all active users
   * 
   * @returns {Array} Array of user objects with status
   */
  getActiveUsers() {
    const result = [];
    this._activeUsers.forEach((data, userId) => {
      result.push({
        userId,
        ...data
      });
    });
    return result;
  },

  /**
   * Get message delivery status
   * 
   * @param {string} messageId - Message ID
   * @returns {Object} Message status info or null if not found
   */
  getMessageStatus(messageId) {
    return this._messageStatus.get(messageId) || null;
  },

  /**
   * Mark a message as sending
   * Used when a message is being sent but not yet confirmed
   * 
   * @param {string} messageId - Message ID
   */
  markMessageAsSending(messageId) {
    this._messageStatus.set(messageId, {
      status: this.DELIVERY_STATUS.SENDING,
      timestamp: new Date()
    });
    
    // Notify all callbacks
    this._notifyMessageStatusCallbacks(messageId, this.DELIVERY_STATUS.SENDING);
  },

  /**
   * Mark a message as failed
   * Used when a message fails to send
   * 
   * @param {string} messageId - Message ID
   * @param {string} error - Error message
   */
  markMessageAsFailed(messageId, error = '') {
    this._messageStatus.set(messageId, {
      status: this.DELIVERY_STATUS.FAILED,
      timestamp: new Date(),
      error
    });
    
    // Notify all callbacks
    this._notifyMessageStatusCallbacks(messageId, this.DELIVERY_STATUS.FAILED);
  },

  /**
   * Send a read receipt for a message
   * 
   * @param {string} messageId - Message ID
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} Success
   */
  sendReadReceipt(messageId, conversationId) {
    return socketService.sendReadReceipt(messageId, conversationId).success;
  },

  /**
   * Mark all messages in a conversation as read
   * 
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} Success
   */
  markConversationAsRead(conversationId) {
    return socketService.markConversationAsRead(conversationId).success;
  },

  /**
   * Subscribe to user status changes
   * 
   * @param {Function} callback - Callback function(userId, status)
   * @returns {Function} Unsubscribe function
   */
  subscribeToStatusChanges(callback) {
    if (typeof callback !== 'function') {
      console.error('Callback must be a function');
      return () => {};
    }
    
    this._statusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this._statusCallbacks.delete(callback);
    };
  },

  /**
   * Subscribe to message status changes
   * 
   * @param {Function} callback - Callback function(messageId, status, userId)
   * @returns {Function} Unsubscribe function
   */
  subscribeToMessageStatusChanges(callback) {
    if (typeof callback !== 'function') {
      console.error('Callback must be a function');
      return () => {};
    }
    
    this._messageStatusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this._messageStatusCallbacks.delete(callback);
    };
  },

  /**
   * Clean up resources
   */
  cleanup() {
    // Clear interval
    if (this._presenceInterval) {
      clearInterval(this._presenceInterval);
      this._presenceInterval = null;
    }
    
    // Clear caches
    this._activeUsers.clear();
    this._messageStatus.clear();
    
    // Clear callbacks
    this._statusCallbacks.clear();
    this._messageStatusCallbacks.clear();
  }
};

export default presenceService;
