import { io } from 'socket.io-client';

// Socket.io instance
let socket = null;

// Event listeners
const listeners = new Map();

// Activity tracking
let lastActivityTime = Date.now();
let activityInterval = null;

// Socket service for real-time messaging
const socketService = {
  // Initialize socket connection
  init: (token) => {
    if (socket) {
      // Close existing connection if any
      socket.disconnect();
    }

    // Create new socket connection with auth token
    socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Set up default event handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Start tracking user activity
      startActivityTracking();
      
      // Notify all connect listeners
      if (listeners.has('connect')) {
        listeners.get('connect').forEach(callback => callback());
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      
      // Stop activity tracking
      stopActivityTracking();
      
      // Notify all disconnect listeners
      if (listeners.has('disconnect')) {
        listeners.get('disconnect').forEach(callback => callback(reason));
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      // Notify all error listeners
      if (listeners.has('error')) {
        listeners.get('error').forEach(callback => callback(error));
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt: ${attemptNumber}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      
      // Restart activity tracking
      startActivityTracking();
    });

    // Set up message event handlers
    socket.on('new_message', (message) => {
      console.log('Received message:', message);
      // Notify all message listeners
      if (listeners.has('new_message')) {
        listeners.get('new_message').forEach(callback => callback(message));
      }
      
      // Automatically send delivery confirmation
      if (message.senderId !== socket.userId) {
        socket.emit('message_delivered', {
          messageId: message.id,
          conversationId: message.conversationId
        });
      }
    });

    socket.on('message_sent', (data) => {
      console.log('Message sent confirmation:', data);
      // Notify all message sent listeners
      if (listeners.has('message_sent')) {
        listeners.get('message_sent').forEach(callback => callback(data));
      }
    });

    socket.on('message_delivered', (data) => {
      console.log('Message delivered confirmation:', data);
      // Notify all message delivered listeners
      if (listeners.has('message_delivered')) {
        listeners.get('message_delivered').forEach(callback => callback(data));
      }
    });

    socket.on('typing', (data) => {
      console.log('Typing indicator:', data);
      // Notify all typing listeners
      if (listeners.has('typing')) {
        listeners.get('typing').forEach(callback => callback(data));
      }
    });

    socket.on('typing_stopped', (data) => {
      console.log('Typing stopped indicator:', data);
      // Notify all typing stopped listeners
      if (listeners.has('typing_stopped')) {
        listeners.get('typing_stopped').forEach(callback => callback(data));
      }
    });

    socket.on('read_receipt', (data) => {
      console.log('Read receipt:', data);
      // Notify all read receipt listeners
      if (listeners.has('read_receipt')) {
        listeners.get('read_receipt').forEach(callback => callback(data));
      }
    });

    socket.on('user_status', (data) => {
      console.log('User status update:', data);
      // Notify all user status listeners
      if (listeners.has('user_status')) {
        listeners.get('user_status').forEach(callback => callback(data));
      }
    });
    
    socket.on('conversation_presence', (data) => {
      console.log('Conversation presence update:', data);
      // Notify all conversation presence listeners
      if (listeners.has('conversation_presence')) {
        listeners.get('conversation_presence').forEach(callback => callback(data));
      }
    });
    
    socket.on('conversation_participants', (data) => {
      console.log('Conversation participants:', data);
      // Notify all conversation participants listeners
      if (listeners.has('conversation_participants')) {
        listeners.get('conversation_participants').forEach(callback => callback(data));
      }
    });
    
    // Set up reaction event handlers
    socket.on('message:reaction:add', (data) => {
      console.log('Message reaction added:', data);
      // Notify all reaction add listeners
      if (listeners.has('message:reaction:add')) {
        listeners.get('message:reaction:add').forEach(callback => callback(data));
      }
    });
    
    socket.on('message:reaction:remove', (data) => {
      console.log('Message reaction removed:', data);
      // Notify all reaction remove listeners
      if (listeners.has('message:reaction:remove')) {
        listeners.get('message:reaction:remove').forEach(callback => callback(data));
      }
    });
    
    // Set up media event handlers
    socket.on('media_upload_progress', (data) => {
      console.log('Media upload progress:', data);
      // Notify all media upload progress listeners
      if (listeners.has('media_upload_progress')) {
        listeners.get('media_upload_progress').forEach(callback => callback(data));
      }
    });
    
    socket.on('media_upload_complete', (data) => {
      console.log('Media upload complete:', data);
      // Notify all media upload complete listeners
      if (listeners.has('media_upload_complete')) {
        listeners.get('media_upload_complete').forEach(callback => callback(data));
      }
    });

    return socket;
  },

  // Disconnect socket
  disconnect: () => {
    // Stop activity tracking
    stopActivityTracking();
    
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Check if socket is connected
  isConnected: () => {
    return socket?.connected || false;
  },

  // Send a private message to a user
  sendPrivateMessage: (recipientId, content, media = null, encryptionData = null) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }
    
    try {
      // Generate a message ID
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create message object
      const messageData = {
        id: messageId,
        recipientId,
        content,
        timestamp: new Date(),
        media
      };
      
      // Add encryption data if available
      if (encryptionData) {
        messageData.isEncrypted = true;
        messageData.encryptedContent = encryptionData.encryptedContent;
        messageData.iv = encryptionData.iv;
        messageData.recipientKeys = encryptionData.recipientKeys;
      } else {
        messageData.isEncrypted = false;
      }
      
      // Emit message event
      socket.emit('private-message', messageData);
      
      return { success: true, messageId, messageData };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message || 'Failed to send message' };
    }
  },

  // Send a message to a conversation
  sendConversationMessage: (conversationId, content, media = null, encryptionData = null) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }
    
    try {
      // Generate a message ID
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create message object
      const messageData = {
        id: messageId,
        conversationId,
        content,
        timestamp: new Date()
      };
      
      // Add media data if available
      if (media) {
        messageData.mediaId = media.id;
        messageData.mediaType = media.type;
        messageData.mediaUrl = media.url;
        messageData.mediaCaption = media.caption;
        messageData.mediaSize = media.size;
        messageData.mediaMimeType = media.mimeType;
      }
      
      // Add encryption data if available
      if (encryptionData) {
        messageData.isEncrypted = true;
        messageData.encryptedContent = encryptionData.encryptedContent;
        messageData.iv = encryptionData.iv;
        messageData.recipientKeys = encryptionData.recipientKeys;
      } else {
        messageData.isEncrypted = false;
      }
      
      // Emit message event
      socket.emit('message', messageData);
      
      return { success: true, messageId, messageData };
    } catch (error) {
      console.error('Error sending conversation message:', error);
      return { success: false, error: error.message || 'Failed to send message' };
    }
  },

  // Send typing indicator
  sendTypingIndicator: (conversationId) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('typing', { conversationId });
    
    return { success: true };
  },
  
  // Send typing stopped indicator
  sendTypingStoppedIndicator: (conversationId) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('typing_stopped', { conversationId });
    
    return { success: true };
  },
  
  // Send read receipt for a specific message
  sendReadReceipt: (messageId, conversationId) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('read_receipt', {
      messageId,
      conversationId
    });
    
    return { success: true };
  },

  // Mark all messages in a conversation as read
  markConversationAsRead: (conversationId) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('read_receipt', {
      conversationId
    });
    
    return { success: true };
  },
  
  // Add a reaction to a message
  addReaction: (messageId, emoji) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }
    
    try {
      // Update last activity time
      updateLastActivity();
      
      // Send reaction
      socket.emit('message:reaction:add', {
        messageId,
        emoji
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Remove a reaction from a message
  removeReaction: (messageId, emoji) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }
    
    try {
      // Update last activity time
      updateLastActivity();
      
      // Send reaction removal
      socket.emit('message:reaction:remove', {
        messageId,
        emoji
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user status
  updateStatus: (status) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    // Validate status
    if (!['online', 'away', 'busy', 'offline'].includes(status)) {
      return { success: false, error: 'Invalid status' };
    }

    socket.emit('status', status);
    
    return { success: true };
  },

  // Join a conversation room
  joinConversation: (conversationId) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('join_conversation', { conversationId });
    
    return { success: true };
  },

  // Leave a conversation room
  leaveConversation: (conversationId) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('leave_conversation', { conversationId });
    
    return { success: true };
  },
  
  // Report media upload progress
  reportMediaUploadProgress: (conversationId, mediaId, progress) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('media_upload_progress', {
      conversationId,
      mediaId,
      progress
    });
    
    return { success: true };
  },
  
  // Report media upload complete
  reportMediaUploadComplete: (conversationId, mediaId) => {
    if (!socket || !socket.connected) {
      return { success: false, error: 'Socket not connected' };
    }

    socket.emit('media_upload_complete', {
      conversationId,
      mediaId
    });
    
    return { success: true };
  },

  // Add event listener
  on: (event, callback) => {
    if (typeof callback !== 'function') {
      console.error('Callback must be a function');
      return;
    }

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      if (listeners.has(event)) {
        listeners.get(event).delete(callback);
      }
    };
  },

  // Remove event listener
  off: (event, callback) => {
    if (!listeners.has(event)) {
      return;
    }

    if (callback) {
      listeners.get(event).delete(callback);
    } else {
      listeners.delete(event);
    }
  }
};

// Start tracking user activity
function startActivityTracking() {
  // Stop any existing interval
  stopActivityTracking();
  
  // Track user activity
  const trackActivity = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;
    
    // If user has been active in the last 5 minutes, report activity
    if (timeSinceLastActivity < 5 * 60 * 1000 && socket?.connected) {
      socket.emit('user_activity');
    }
    
    // If user has been inactive for more than 10 minutes, set status to away
    if (timeSinceLastActivity > 10 * 60 * 1000 && socket?.connected) {
      socket.emit('status', 'away');
    }
  };
  
  // Set up activity listeners
  window.addEventListener('mousemove', updateLastActivity);
  window.addEventListener('keydown', updateLastActivity);
  window.addEventListener('click', updateLastActivity);
  window.addEventListener('touchstart', updateLastActivity);
  window.addEventListener('scroll', updateLastActivity);
  
  // Set up interval to check activity
  activityInterval = setInterval(trackActivity, 60 * 1000); // Check every minute
}

// Stop tracking user activity
function stopActivityTracking() {
  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }
  
  // Remove activity listeners
  window.removeEventListener('mousemove', updateLastActivity);
  window.removeEventListener('keydown', updateLastActivity);
  window.removeEventListener('click', updateLastActivity);
  window.removeEventListener('touchstart', updateLastActivity);
  window.removeEventListener('scroll', updateLastActivity);
}

// Update last activity time
function updateLastActivity() {
  lastActivityTime = Date.now();
}

export default socketService;
