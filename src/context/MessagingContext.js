import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import messageService from '../services/messageService';
import mediaService from '../services/mediaService';
import { v4 as uuidv4 } from 'uuid';

// Create messaging context
const MessagingContext = createContext();

// Messaging provider component
export const MessagingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaUploads, setMediaUploads] = useState({});
  const [pendingMedia, setPendingMedia] = useState([]);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      // Initialize socket connection
      socketService.init(user.token);
      
      // Load conversations
      loadConversations();
      
      // Set up socket event listeners
      const unsubscribeMessage = socketService.on('message', handleIncomingMessage);
      const unsubscribePrivateMessage = socketService.on('private-message', handleIncomingMessage);
      const unsubscribeConversationMessage = socketService.on('conversation-message', handleIncomingMessage);
      const unsubscribeTyping = socketService.on('typing', handleTypingIndicator);
      const unsubscribeReadReceipt = socketService.on('read-receipt', handleReadReceipt);
      const unsubscribeUserStatus = socketService.on('user-status', handleUserStatus);
      
      // Set initial online status
      socketService.updateStatus('online');
      
      // Cleanup on unmount
      return () => {
        // Set status to offline before disconnecting
        socketService.updateStatus('offline');
        
        // Unsubscribe from all events
        unsubscribeMessage();
        unsubscribePrivateMessage();
        unsubscribeConversationMessage();
        unsubscribeTyping();
        unsubscribeReadReceipt();
        unsubscribeUserStatus();
        
        // Disconnect socket
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Load user conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get conversations from API
      const response = await messageService.getConversations();
      
      if (response.success) {
        setConversations(response.data);
        
        // Initialize unread counts
        const counts = {};
        response.data.forEach(conv => {
          counts[conv.id] = conv.unread_count || 0;
        });
        setUnreadCounts(counts);
      } else {
        setError('Failed to load conversations');
      }
    } catch (err) {
      setError('Error loading conversations: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get messages from API
      const response = await messageService.getMessages(conversationId);
      
      if (response.success) {
        // Update messages state
        setMessages(prev => ({
          ...prev,
          [conversationId]: response.data
        }));
        
        // Mark messages as read
        if (response.data.length > 0) {
          markConversationAsRead(conversationId);
        }
        
        return response.data;
      } else {
        setError('Failed to load messages');
        return [];
      }
    } catch (err) {
      setError('Error loading messages: ' + (err.message || 'Unknown error'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Handle incoming message
  const handleIncomingMessage = useCallback((message) => {
    console.log('Handling incoming message:', message);
    
    // Determine conversation ID
    const conversationId = message.conversationId || message.senderId;
    
    if (!conversationId) {
      console.error('Message missing conversationId or senderId:', message);
      return;
    }
    
    // Add message to state
    setMessages(prev => {
      const conversationMessages = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: [...conversationMessages, message]
      };
    });
    
    // Update conversation with last message
    setConversations(prev => {
      const existingConvIndex = prev.findIndex(c => c.id === conversationId);
      
      // Determine last message text
      const lastMessageText = message.media 
        ? (message.content?.trim() ? message.content.trim() : '📷 Image') 
        : message.content;
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          last_message: lastMessageText,
          updated_at: new Date(message.timestamp || Date.now()).toISOString()
        };
        return updatedConversations;
      } else {
        // Create new conversation placeholder
        // This will be replaced when conversations are reloaded
        return [
          {
            id: conversationId,
            name: `Conversation ${conversationId.substring(0, 8)}...`, // Placeholder
            last_message: lastMessageText,
            updated_at: new Date(message.timestamp || Date.now()).toISOString(),
            unread_count: 1
          },
          ...prev
        ];
      }
    });
    
    // Increment unread count if not in active conversation
    if (!activeConversation || activeConversation.id !== conversationId) {
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }));
    } else {
      // Send read receipt if in active conversation
      messageService.markAsRead(message.id);
    }
  }, [activeConversation]);

  // Handle typing indicator
  const handleTypingIndicator = useCallback((data) => {
    const { userId, conversationId, isTyping } = data;
    
    if (!userId || !conversationId) return;
    
    setTypingUsers(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        [userId]: isTyping ? Date.now() : null
      }
    }));
    
    // Clear typing indicator after 5 seconds of inactivity
    if (isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => {
          const conversationTypers = prev[conversationId] || {};
          if (conversationTypers[userId]) {
            const now = Date.now();
            // Only clear if it's been more than 5 seconds
            if (now - conversationTypers[userId] > 5000) {
              return {
                ...prev,
                [conversationId]: {
                  ...conversationTypers,
                  [userId]: null
                }
              };
            }
          }
          return prev;
        });
      }, 5000);
    }
  }, []);

  // Handle read receipt
  const handleReadReceipt = useCallback((data) => {
    const { messageId, conversationId, userId } = data;
    
    if (!messageId) return;
    
    // Update message read status
    setMessages(prev => {
      const updatedMessages = { ...prev };
      
      // If conversationId is provided, only update that conversation
      if (conversationId && updatedMessages[conversationId]) {
        updatedMessages[conversationId] = updatedMessages[conversationId].map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        );
        return updatedMessages;
      }
      
      // Otherwise check all conversations
      Object.keys(updatedMessages).forEach(convId => {
        updatedMessages[convId] = updatedMessages[convId].map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        );
      });
      
      return updatedMessages;
    });
  }, []);

  // Handle user status update
  const handleUserStatus = useCallback((data) => {
    const { userId, status } = data;
    
    if (!userId || !status) return;
    
    setOnlineUsers(prev => ({
      ...prev,
      [userId]: status
    }));
  }, []);

  // Send a message
  const sendMessage = async (conversationId, content, media = null) => {
    try {
      setError(null);
      
      // Send message via service
      const result = await messageService.sendMessage(conversationId, content, media);
      
      if (result.success) {
        // Optimistically add message to UI
        const newMessage = {
          id: result.messageId || `temp-${Date.now()}`,
          conversationId,
          senderId: user.id,
          senderName: user.fullName || user.username,
          content,
          timestamp: new Date().toISOString(),
          status: 'sent',
          read: false,
          ...(media && { 
            mediaId: media.mediaId,
            mediaType: media.mediaType,
            mediaUrl: media.mediaUrl
          })
        };
        
        setMessages(prev => {
          const conversationMessages = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: [...conversationMessages, newMessage]
          };
        });
        
        // Update conversation with last message
        updateConversationLastMessage(conversationId, content, media);
        
        return { success: true, messageId: result.messageId };
      } else {
        setError(result.error || 'Failed to send message');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Error sending message: ' + (err.message || 'Unknown error');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Send a direct message to a user
  const sendDirectMessage = async (recipientId, content, media = null) => {
    try {
      setError(null);
      
      // Send direct message via service
      const result = await messageService.sendDirectMessage(recipientId, content, media);
      
      if (result.success) {
        // If conversation was created or already exists, update UI
        if (result.data && result.data.conversationId) {
          const conversationId = result.data.conversationId;
          
          // Optimistically add message to UI
          const newMessage = {
            id: result.data.messageId || `temp-${Date.now()}`,
            conversationId,
            senderId: user.id,
            senderName: user.fullName || user.username,
            content,
            timestamp: new Date().toISOString(),
            status: 'sent',
            read: false,
            ...(media && { 
              mediaId: media.mediaId,
              mediaType: media.mediaType,
              mediaUrl: media.mediaUrl
            })
          };
          
          setMessages(prev => {
            const conversationMessages = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: [...conversationMessages, newMessage]
            };
          });
          
          // Update conversation with last message
          updateConversationLastMessage(conversationId, content, media);
        }
        
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to send direct message');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Error sending direct message: ' + (err.message || 'Unknown error');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update conversation's last message
  const updateConversationLastMessage = (conversationId, content, media) => {
    setConversations(prev => {
      const existingConvIndex = prev.findIndex(c => c.id === conversationId);
      
      // Determine last message text based on media type
      let lastMessageText = content;
      
      if (media) {
        if (content?.trim()) {
          lastMessageText = content.trim();
        } else {
          // Use appropriate emoji based on media type
          switch (media.mediaType) {
            case 'image':
              lastMessageText = '📷 Image';
              break;
            case 'video':
              lastMessageText = '🎥 Video';
              break;
            case 'audio':
              lastMessageText = '🎵 Audio';
              break;
            case 'document':
              lastMessageText = '📄 Document';
              break;
            default:
              lastMessageText = '📎 Media';
          }
        }
      }
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          last_message: lastMessageText,
          updated_at: new Date().toISOString()
        };
        return updatedConversations;
      }
      
      return prev;
    });
  };

  // Send media message
  const sendMediaMessage = async (conversationId, file, caption = '') => {
    try {
      // Validate file
      const validation = mediaService.validateFile(file);
      if (!validation.success) {
        throw new Error(validation.message);
      }

      // Create a unique ID for tracking this upload
      const uploadId = uuidv4();
      
      // Add to media uploads tracking
      setMediaUploads(prev => ({
        ...prev,
        [uploadId]: {
          file,
          progress: 0,
          status: 'uploading',
          conversationId,
          caption
        }
      }));

      // Track upload progress
      const onProgress = (progress) => {
        setMediaUploads(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            progress
          }
        }));
      };

      // Upload the file
      const mediaData = await mediaService.uploadMedia(
        file,
        conversationId,
        caption,
        onProgress
      );

      // Update upload status to complete
      setMediaUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'complete',
          progress: 100,
          mediaId: mediaData.mediaId,
          mediaUrl: mediaData.mediaUrl,
          mediaType: mediaData.mediaType
        }
      }));

      // If the upload includes a message ID, fetch the new message
      if (mediaData.messageId) {
        // Fetch the latest messages to include the new media message
        await loadMessages(conversationId);
      }

      return mediaData;
    } catch (error) {
      console.error('Error sending media message:', error);
      throw error;
    }
  };

  // Send multiple media messages
  const sendMultipleMediaMessages = async (conversationId, files, captions = {}) => {
    try {
      // Validate all files first
      const invalidFiles = [];
      files.forEach(file => {
        const validation = mediaService.validateFile(file.file);
        if (!validation.success) {
          invalidFiles.push({
            file: file.file,
            error: validation.message
          });
        }
      });

      if (invalidFiles.length > 0) {
        return {
          success: false,
          invalidFiles,
          message: `${invalidFiles.length} files failed validation`
        };
      }

      // Create upload tracking entries for all files
      const uploadIds = {};
      files.forEach(file => {
        const uploadId = uuidv4();
        uploadIds[file.id] = uploadId;
        
        setMediaUploads(prev => ({
          ...prev,
          [uploadId]: {
            file: file.file,
            progress: 0,
            status: 'uploading',
            conversationId,
            caption: file.caption || captions[file.id] || ''
          }
        }));
      });

      // Track upload progress for each file
      const onProgress = (fileId, progress) => {
        const uploadId = uploadIds[fileId];
        if (uploadId) {
          setMediaUploads(prev => ({
            ...prev,
            [uploadId]: {
              ...prev[uploadId],
              progress
            }
          }));
        }
      };

      // Upload all files
      const uploadPromises = files.map(file => {
        const caption = file.caption || captions[file.id] || '';
        return mediaService.uploadMedia(
          file.file,
          conversationId,
          caption,
          (progress) => onProgress(file.id, progress)
        ).then(mediaData => {
          const uploadId = uploadIds[file.id];
          if (uploadId) {
            setMediaUploads(prev => ({
              ...prev,
              [uploadId]: {
                ...prev[uploadId],
                status: 'complete',
                progress: 100,
                mediaId: mediaData.mediaId,
                mediaUrl: mediaData.mediaUrl,
                mediaType: mediaData.mediaType
              }
            }));
          }
          return mediaData;
        });
      });

      const results = await Promise.all(uploadPromises);
      
      // Fetch the latest messages to include the new media messages
      await loadMessages(conversationId);

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error sending multiple media messages:', error);
      throw error;
    }
  };

  // Add media to pending queue
  const addPendingMedia = (files) => {
    const preparedFiles = mediaService.prepareFilesForUpload(files);
    setPendingMedia(prev => [...prev, ...preparedFiles]);
    return preparedFiles;
  };

  // Remove media from pending queue
  const removePendingMedia = (fileId) => {
    setPendingMedia(prev => {
      const filtered = prev.filter(file => file.id !== fileId);
      
      // Clean up any revoked object URLs
      const removedFile = prev.find(file => file.id === fileId);
      if (removedFile && removedFile.previewUrl) {
        URL.revokeObjectURL(removedFile.previewUrl);
      }
      
      return filtered;
    });
  };

  // Update caption for pending media
  const updatePendingMediaCaption = (fileId, caption) => {
    setPendingMedia(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, caption } : file
      )
    );
  };

  // Clear all pending media
  const clearPendingMedia = () => {
    // Clean up object URLs
    pendingMedia.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    
    setPendingMedia([]);
  };

  // Cancel a media upload in progress
  const cancelMediaUpload = (uploadId) => {
    setMediaUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[uploadId];
      return newUploads;
    });
  };

  // Clear completed media uploads
  const clearCompletedUploads = () => {
    setMediaUploads(prev => {
      const newUploads = {};
      Object.entries(prev).forEach(([id, upload]) => {
        if (upload.status !== 'complete') {
          newUploads[id] = upload;
        }
      });
      return newUploads;
    });
  };

  // Mark conversation as read
  const markConversationAsRead = (conversationId) => {
    if (!conversationId) return;
    
    // Mark as read via service
    messageService.markConversationAsRead(conversationId);
    
    // Update unread count
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));
    
    // Update messages as read
    setMessages(prev => {
      const conversationMessages = prev[conversationId];
      if (!conversationMessages) return prev;
      
      return {
        ...prev,
        [conversationId]: conversationMessages.map(msg => ({
          ...msg,
          read: true
        }))
      };
    });
  };

  // Send typing indicator
  const sendTyping = (conversationId, isTyping) => {
    if (!conversationId || !user?.id) return;
    
    socketService.emitTyping(conversationId, isTyping);
  };

  // Set active conversation
  const setActiveConversationAndMarkRead = (conversation) => {
    setActiveConversation(conversation);
    
    if (conversation) {
      // Mark conversation as read when activated
      markConversationAsRead(conversation.id);
    }
  };

  // Check if a user is typing in a conversation
  const isUserTyping = (conversationId) => {
    if (!conversationId) return false;
    
    const typersInConversation = typingUsers[conversationId] || {};
    
    // Check if any user is typing
    return Object.values(typersInConversation).some(timestamp => 
      timestamp && Date.now() - timestamp < 5000
    );
  };

  // Get typing users for a conversation
  const getTypingUsers = (conversationId) => {
    if (!conversationId) return [];
    
    const typersInConversation = typingUsers[conversationId] || {};
    
    // Filter active typers and return user IDs
    return Object.entries(typersInConversation)
      .filter(([_, timestamp]) => timestamp && Date.now() - timestamp < 5000)
      .map(([userId]) => userId);
  };

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers[userId] === 'online';
  };

  // Get user status
  const getUserStatus = (userId) => {
    return onlineUsers[userId] || 'offline';
  };

  // Context value
  const contextValue = {
    conversations,
    activeConversation,
    messages,
    unreadCounts,
    onlineUsers,
    typingUsers,
    loading,
    error,
    mediaUploads,
    pendingMedia,
    setActiveConversation: setActiveConversationAndMarkRead,
    loadConversations,
    loadMessages,
    sendMessage,
    sendDirectMessage,
    sendMediaMessage,
    sendMultipleMediaMessages,
    addPendingMedia,
    removePendingMedia,
    updatePendingMediaCaption,
    clearPendingMedia,
    cancelMediaUpload,
    clearCompletedUploads,
    markConversationAsRead,
    sendTyping,
    isUserTyping,
    getTypingUsers,
    isUserOnline,
    getUserStatus,
    totalUnreadCount: Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
  };

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
};

// Custom hook to use messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export default MessagingContext;
