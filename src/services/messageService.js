import axios from 'axios';
import socketService from './socketService';
import encryptionService from './encryptionService';
import mediaService from './mediaService';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Message service
const messageService = {
  // Get user conversations
  getConversations: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/messages/conversations', {
        params: { page, limit }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get conversations error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch conversations' 
      };
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/messages/${conversationId}`, {
        params: { page, limit }
      });
      
      // Join the conversation room via WebSocket when loading messages
      socketService.joinConversation(conversationId);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get messages error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch messages' 
      };
    }
  },

  /**
   * Send a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {Object} mediaInfo - Media information (optional)
   * @returns {Promise<Object>} Response with message data
   */
  sendMessage: async (conversationId, content, mediaInfo = null) => {
    try {
      // If we have media info but no content, set a default content
      if (mediaInfo && !content.trim()) {
        if (mediaInfo.mediaType === 'image') {
          content = '📷 Image';
        } else if (mediaInfo.mediaType === 'video') {
          content = '🎬 Video';
        } else if (mediaInfo.mediaType === 'audio') {
          content = '🎵 Audio';
        } else if (mediaInfo.mediaType === 'document') {
          content = '📄 Document';
        }
      }

      // Get conversation members to encrypt message for each recipient
      const conversationResponse = await api.get(`/conversations/${conversationId}/members`);
      const members = conversationResponse.data.members || [];
      
      // Get current user's private key from secure storage
      const userKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
      const privateKeyString = userKeys.privateKey;
      
      if (!privateKeyString) {
        throw new Error('Encryption keys not found. Please generate new keys in settings.');
      }
      
      // Prepare message payload
      const payload = {
        conversationId,
        content: content // Store original content temporarily
      };
      
      // Add media information if available
      if (mediaInfo) {
        payload.mediaId = mediaInfo.id;
        payload.mediaType = mediaInfo.mediaType;
        payload.mediaUrl = mediaInfo.url;
        if (mediaInfo.caption) {
          payload.mediaCaption = mediaInfo.caption;
        }
      }
      
      // If we have recipients with public keys, encrypt the message
      if (members.length > 0 && members.every(m => m.publicKey)) {
        try {
          // Encrypt the message for all recipients
          const encryptedData = await encryptionService.encryptGroupMessage(
            content,
            members.map(m => ({ userId: m.userId, publicKey: m.publicKey }))
          );
          
          // Replace content with encrypted data
          payload.content = '';
          payload.encryptedContent = encryptedData.encryptedMessage;
          payload.iv = encryptedData.iv;
          payload.recipientKeys = encryptedData.recipientKeys;
          payload.isEncrypted = true;
        } catch (encryptionError) {
          console.error('Encryption failed, sending unencrypted message:', encryptionError);
          // If encryption fails, send unencrypted message
          payload.isEncrypted = false;
        }
      } else {
        // If not all members have public keys, send unencrypted
        payload.isEncrypted = false;
      }

      const response = await api.post('/messages', payload);
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  /**
   * Send a media message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {File} file - File to upload
   * @param {string} content - Optional message text
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Response with message data
   */
  sendMediaMessage: async (conversationId, file, content = '', onProgress) => {
    try {
      const result = await mediaService.uploadMedia(file, conversationId, content, onProgress);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // The server already created the message, so we just return it
      return result.data.message;
    } catch (error) {
      console.error('Send media message error:', error);
      throw error;
    }
  },

  // Send a direct message to a user
  sendDirectMessage: async (recipientId, content, media = null) => {
    try {
      // Get recipient's public key
      const recipientResponse = await api.get(`/users/${recipientId}`);
      const recipientPublicKey = recipientResponse.data.publicKey;
      
      // Get current user's private key from secure storage
      const userKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
      const privateKeyString = userKeys.privateKey;
      
      // Prepare message payload
      const payload = {
        recipientId,
        content,
        mediaId: media?.id,
        mediaType: media?.type,
        mediaUrl: media?.url
      };
      
      // If both keys are available, encrypt the message
      if (recipientPublicKey && privateKeyString) {
        try {
          // Encrypt the message for the recipient
          const encryptedData = await encryptionService.encryptGroupMessage(
            content,
            [{ userId: recipientId, publicKey: recipientPublicKey }]
          );
          
          // Replace content with encrypted data
          payload.content = '';
          payload.encryptedContent = encryptedData.encryptedMessage;
          payload.iv = encryptedData.iv;
          payload.recipientKeys = encryptedData.recipientKeys;
          payload.isEncrypted = true;
        } catch (encryptionError) {
          console.error('Encryption failed, sending unencrypted message:', encryptionError);
          // If encryption fails, send unencrypted message
          payload.isEncrypted = false;
        }
      } else {
        // If keys are not available, send unencrypted
        payload.isEncrypted = false;
      }
      
      // First check if we have an existing conversation
      const response = await api.post('/messages/direct', payload);
      
      // If WebSocket is connected, notify recipient in real-time
      if (socketService.isConnected()) {
        socketService.sendPrivateMessage(recipientId, content, media, payload.isEncrypted ? {
          encryptedContent: payload.encryptedContent,
          iv: payload.iv,
          recipientKeys: payload.recipientKeys
        } : null);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Send direct message error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to send message' 
      };
    }
  },

  /**
   * Decrypt a message
   * @param {Object} message - Message object with encrypted content
   * @returns {Promise<Object>} Decrypted message
   */
  decryptMessage: async (message) => {
    // If message is not encrypted, return as is
    if (!message.isEncrypted) {
      return message;
    }
    
    try {
      // Get current user's ID and private key
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const userKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
      const privateKeyString = userKeys.privateKey;
      
      if (!privateKeyString) {
        throw new Error('Private key not found');
      }
      
      // Import private key
      const privateKey = await encryptionService.importPrivateKey(privateKeyString);
      
      // Decrypt the message
      const decryptedContent = await encryptionService.decryptGroupMessage(
        {
          encryptedMessage: message.encryptedContent,
          iv: message.iv,
          recipientKeys: message.recipientKeys
        },
        userId,
        privateKey
      );
      
      // Return message with decrypted content
      return {
        ...message,
        content: decryptedContent,
        decrypted: true
      };
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return {
        ...message,
        content: '[Encrypted message - unable to decrypt]',
        decryptError: error.message
      };
    }
  },
  
  /**
   * Decrypt multiple messages
   * @param {Array<Object>} messages - Array of message objects
   * @returns {Promise<Array<Object>>} Array of decrypted messages
   */
  decryptMessages: async (messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return messages;
    }
    
    const decryptedMessages = [];
    
    for (const message of messages) {
      if (message.isEncrypted) {
        const decryptedMessage = await messageService.decryptMessage(message);
        decryptedMessages.push(decryptedMessage);
      } else {
        decryptedMessages.push(message);
      }
    }
    
    return decryptedMessages;
  },
  
  /**
   * Generate encryption keys for the user
   * @returns {Promise<Object>} Generated keys
   */
  generateEncryptionKeys: async () => {
    try {
      // Generate new key pair
      const keyPair = await encryptionService.generateKeyPair();
      
      // Store private key securely
      localStorage.setItem('userKeys', JSON.stringify({
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey
      }));
      
      // Update user's public key on the server
      await api.post('/users/update-public-key', {
        publicKey: keyPair.publicKey
      });
      
      return { success: true, publicKey: keyPair.publicKey };
    } catch (error) {
      console.error('Error generating encryption keys:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark message as read
  markAsRead: (messageId) => {
    // Use socket service to send read receipt
    return socketService.sendReadReceipt(messageId);
  },

  // Mark all messages in a conversation as read
  markConversationAsRead: (conversationId) => {
    // Use socket service to mark conversation as read
    return socketService.markConversationAsRead(conversationId);
  },

  // Send typing indicator
  sendTypingIndicator: (conversationId, isTyping) => {
    return socketService.sendTypingIndicator(conversationId, isTyping);
  },

  // Search messages
  searchMessages: async (query) => {
    try {
      const response = await api.get('/messages/search', {
        params: { query }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search messages error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to search messages' 
      };
    }
  },

  // Upload media (image, file, etc.)
  uploadMedia: async (file, messageId, conversationId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('messageId', messageId);
      formData.append('conversationId', conversationId);

      const response = await api.post('/messages/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Upload media error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to upload media' 
      };
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to delete message' 
      };
    }
  },
  
  // Leave a conversation
  leaveConversation: (conversationId) => {
    return socketService.leaveConversation(conversationId);
  }
};

export default messageService;
