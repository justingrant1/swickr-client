import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography, 
  Paper, 
  Avatar, 
  Divider,
  CircularProgress,
  Badge,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatDistanceToNow } from 'date-fns';

import socketService from '../../services/socketService';
import encryptionService from '../../services/encryptionService';
import encryptedPresenceService from '../../services/encryptedPresenceService';
import performanceService from '../../services/performanceService';
import workerService from '../../services/workerService';
import { useAuth } from '../../contexts/AuthContext';
import PresenceIndicator from './PresenceIndicator';
import MessageStatus from './MessageStatus';
import TypingIndicator from './TypingIndicator';
import ConversationHeader from './ConversationHeader';
import MessageReactions from '../messages/MessageReactions';

/**
 * Encrypted Conversation Component
 * 
 * Displays a conversation with end-to-end encryption for both messages
 * and presence indicators.
 */
const EncryptedConversation = ({ 
  conversation, 
  messages, 
  onSendMessage, 
  onBack,
  loading = false
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [recipientKeys, setRecipientKeys] = useState([]);
  const [encryptionError, setEncryptionError] = useState(null);
  const [encryptedPresenceEnabled, setEncryptedPresenceEnabled] = useState(false);
  const [encryptedFeatures, setEncryptedFeatures] = useState({
    readReceipts: false,
    typingIndicators: false,
    presenceUpdates: false
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Get user's encryption preferences
  useEffect(() => {
    const handleEncryptedPresencePreferences = (preferences) => {
      setEncryptedPresenceEnabled(
        preferences.encryptReadReceipts || 
        preferences.encryptTypingIndicators || 
        preferences.encryptPresenceUpdates
      );
      
      // Store the individual feature preferences
      setEncryptedFeatures({
        readReceipts: preferences.encryptReadReceipts || false,
        typingIndicators: preferences.encryptTypingIndicators || false,
        presenceUpdates: preferences.encryptPresenceUpdates || false
      });
    };
    
    socketService.on('encrypted_presence_preferences', handleEncryptedPresencePreferences);
    socketService.emit('get_encrypted_presence_preferences');
    
    // Also listen for preference updates from the UI
    const handlePreferenceUpdate = (event) => {
      handleEncryptedPresencePreferences(event.detail);
    };
    
    window.addEventListener('encrypted_presence_preferences_updated', handlePreferenceUpdate);
    
    return () => {
      socketService.off('encrypted_presence_preferences', handleEncryptedPresencePreferences);
      window.removeEventListener('encrypted_presence_preferences_updated', handlePreferenceUpdate);
    };
  }, []);
  
  // Initialize encryption
  useEffect(() => {
    const initializeEncryption = async () => {
      try {
        // Check if user has encryption keys
        const userKeysString = localStorage.getItem('userKeys');
        if (!userKeysString) {
          setEncryptionError('Encryption keys not found');
          return;
        }
        
        const userKeys = JSON.parse(userKeysString);
        
        // Initialize encrypted presence service
        encryptedPresenceService.init(userKeys, user.id);
        
        // Optimize for device capabilities
        await encryptedPresenceService.optimizeForDevice();
        
        // Get public keys for all participants
        if (conversation && conversation.participants) {
          // In a real app, you would fetch these from the server
          // This is a simplified example
          const keys = conversation.participants
            .filter(p => p.id !== user.id)
            .map(p => ({
              userId: p.id,
              publicKey: p.publicKey
            }));
          
          setRecipientKeys(keys);
          setEncryptionReady(true);
        }
      } catch (error) {
        console.error('Error initializing encryption:', error);
        setEncryptionError('Failed to initialize encryption');
      }
    };
    
    if (conversation && user) {
      initializeEncryption();
    }
    
    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversation, user]);
  
  // Join conversation when it loads
  useEffect(() => {
    if (conversation && conversation.id) {
      // Join the conversation
      socketService.emit('join_conversation', conversation.id);
      
      // Mark messages as read
      if (messages && messages.length > 0) {
        const unreadMessages = messages.filter(
          m => m.senderId !== user.id && !m.readAt
        );
        
        if (unreadMessages.length > 0) {
          // If encrypted presence is enabled, send encrypted read receipts
          if (encryptedPresenceEnabled && encryptionReady && recipientKeys.length > 0) {
            unreadMessages.forEach(message => {
              encryptedPresenceService.sendEncryptedReadReceipt(
                message.id,
                conversation.id,
                recipientKeys
              );
            });
          } else {
            // Otherwise send regular read receipts
            unreadMessages.forEach(message => {
              socketService.emit('read_receipt', {
                messageId: message.id,
                conversationId: conversation.id
              });
            });
          }
        }
      }
      
      // Clean up when component unmounts
      return () => {
        socketService.emit('leave_conversation', conversation.id);
        
        // Send typing stopped if we were typing
        if (isTyping) {
          if (encryptedPresenceEnabled && encryptionReady && recipientKeys.length > 0) {
            encryptedPresenceService.sendEncryptedTypingStoppedIndicator(
              conversation.id,
              recipientKeys
            );
          } else {
            socketService.emit('typing_stopped', { conversationId: conversation.id });
          }
        }
      };
    }
  }, [conversation, messages, user, encryptedPresenceEnabled, encryptionReady, recipientKeys, isTyping]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);
  
  // Handle typing indicators
  useEffect(() => {
    const handleTyping = (data) => {
      if (data.conversationId === conversation?.id && data.userId !== user.id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: {
            isTyping: true,
            username: data.username || 'Someone'
          }
        }));
      }
    };
    
    const handleTypingStopped = (data) => {
      if (data.conversationId === conversation?.id && data.userId !== user.id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: {
            isTyping: false,
            username: prev[data.userId]?.username || 'Someone'
          }
        }));
      }
    };
    
    socketService.on('typing', handleTyping);
    socketService.on('typing_stopped', handleTypingStopped);
    
    return () => {
      socketService.off('typing', handleTyping);
      socketService.off('typing_stopped', handleTypingStopped);
    };
  }, [conversation, user]);
  
  // Handle input change and typing indicators
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping && e.target.value.trim() !== '') {
      setIsTyping(true);
      
      // Send typing indicator based on encryption preference
      if (encryptedPresenceEnabled && encryptionReady && recipientKeys.length > 0) {
        encryptedPresenceService.sendEncryptedTypingIndicator(
          conversation.id,
          recipientKeys
        );
      } else {
        socketService.emit('typing', { conversationId: conversation.id });
      }
    }
    
    // If input is empty, stop typing indicator immediately
    if (e.target.value.trim() === '') {
      setIsTyping(false);
      
      if (encryptedPresenceEnabled && encryptionReady && recipientKeys.length > 0) {
        encryptedPresenceService.sendEncryptedTypingStoppedIndicator(
          conversation.id,
          recipientKeys
        );
      } else {
        socketService.emit('typing_stopped', { conversationId: conversation.id });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      
      if (encryptedPresenceEnabled && encryptionReady && recipientKeys.length > 0) {
        encryptedPresenceService.sendEncryptedTypingStoppedIndicator(
          conversation.id,
          recipientKeys
        );
      } else {
        socketService.emit('typing_stopped', { conversationId: conversation.id });
      }
    }, 2000);
  };
  
  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newMessage.trim() === '') return;
    
    try {
      // Clear typing indicator
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      if (encryptedPresenceEnabled && encryptionReady && recipientKeys.length > 0) {
        encryptedPresenceService.sendEncryptedTypingStoppedIndicator(
          conversation.id,
          recipientKeys
        );
      } else {
        socketService.emit('typing_stopped', { conversationId: conversation.id });
      }
      
      // Encrypt message if encryption is ready
      if (encryptionReady && recipientKeys.length > 0) {
        // Get user's keys
        const userKeysString = localStorage.getItem('userKeys');
        const userKeys = JSON.parse(userKeysString);
        
        // Try to use Web Worker for encryption if available
        if (workerService.isWebWorkerSupported()) {
          try {
            const encryptedData = await workerService.encryptWithWorker(
              newMessage,
              recipientKeys
            );
            
            // Send encrypted message
            onSendMessage({
              conversationId: conversation.id,
              content: '',
              encryptedContent: encryptedData.encryptedMessage,
              iv: encryptedData.iv,
              recipientKeys: encryptedData.recipientKeys,
              isEncrypted: true
            });
            
            // Clear input
            setNewMessage('');
            return;
          } catch (error) {
            console.warn('Worker encryption failed, falling back to main thread:', error);
            // Continue with main thread encryption
          }
        }
        
        // Fallback to main thread encryption
        const encryptedData = await encryptionService.encryptGroupMessage(
          newMessage,
          recipientKeys
        );
        
        // Send encrypted message
        onSendMessage({
          conversationId: conversation.id,
          content: '',
          encryptedContent: encryptedData.encryptedMessage,
          iv: encryptedData.iv,
          recipientKeys: encryptedData.recipientKeys,
          isEncrypted: true
        });
      } else {
        // Send unencrypted message
        onSendMessage({
          conversationId: conversation.id,
          content: newMessage,
          isEncrypted: false
        });
      }
      
      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error (show notification, etc.)
    }
  };
  
  // Handle conversation menu
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Render active typing indicators
  const renderTypingIndicators = () => {
    const typingUserIds = Object.keys(typingUsers).filter(
      id => typingUsers[id].isTyping
    );
    
    if (typingUserIds.length === 0) return null;
    
    const typingNames = typingUserIds.map(id => typingUsers[id].username);
    
    return (
      <TypingIndicator 
        isTyping={true} 
        username={typingNames.join(', ')} 
      />
    );
  };
  
  // Get recipient for display
  const getRecipient = () => {
    if (!conversation || !conversation.participants) return null;
    
    return conversation.participants.find(p => p.id !== user.id);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Conversation Header */}
      <ConversationHeader
        conversation={conversation}
        recipient={getRecipient()}
        onBack={onBack}
        onMenuOpen={handleMenuOpen}
        encryptionEnabled={encryptionReady}
        encryptedFeatures={encryptedFeatures}
      />
      
      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.senderId === user.id ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    borderRadius: 2,
                    bgcolor: message.senderId === user.id ? '#6200ee' : 'white',
                    color: message.senderId === user.id ? 'white' : 'inherit'
                  }}
                >
                  {message.isEncrypted && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <LockIcon sx={{ fontSize: 14, mr: 0.5, opacity: 0.7 }} />
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Encrypted
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="body1">
                    {message.content}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center',
                    mt: 0.5
                  }}>
                    <Typography variant="caption" sx={{ opacity: 0.7, mr: 0.5 }}>
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </Typography>
                    
                    {message.senderId === user.id && (
                      <MessageStatus 
                        messageId={message.id}
                        status={message.status || 'sent'}
                        isEncrypted={message.isEncrypted}
                        size="small"
                      />
                    )}
                  </Box>
                  
                  {/* Message Reactions */}
                  <MessageReactions messageId={message.id} />
                </Paper>
              </Box>
            ))}
            
            {renderTypingIndicators()}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      {/* Message Input */}
      <Divider />
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1A2027' : '#fff'
        }}
      >
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleInputChange}
          variant="outlined"
          size="small"
          disabled={loading}
          sx={{ mr: 1 }}
        />
        <IconButton 
          color="primary" 
          type="submit" 
          disabled={!newMessage.trim() || loading}
          sx={{ 
            bgcolor: '#6200ee', 
            color: 'white',
            '&:hover': {
              bgcolor: '#5000c9',
            },
            '&.Mui-disabled': {
              bgcolor: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
      
      {/* Encryption Error */}
      {encryptionError && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            m: 2, 
            bgcolor: '#ffebee',
            color: '#c62828'
          }}
        >
          <Typography variant="body2">
            {encryptionError}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default EncryptedConversation;
