import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  List, 
  ListItem,
  Divider,
  Avatar,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LockIcon from '@mui/icons-material/Lock';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Import our custom components
import PresenceIndicator from './PresenceIndicator';
import MessageStatus from './MessageStatus';
import TypingIndicator from './TypingIndicator';

// Import services
import socketService from '../../services/socketService';
import presenceService from '../../services/presenceService';
import messageService from '../../services/messageService';
import encryptionService from '../../services/encryptionService';

// Styled components
const ConversationContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden'
}));

const ConversationHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
}));

const MessageList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default
}));

const MessageItem = styled(ListItem)(({ theme, isOwn }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: isOwn ? 'flex-end' : 'flex-start',
  padding: theme.spacing(1, 0)
}));

const MessageBubble = styled(Box)(({ theme, isOwn }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isOwn ? theme.palette.primary.light : theme.palette.background.paper,
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  position: 'relative'
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`
}));

const EncryptionIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.success.light,
  color: theme.palette.success.contrastText,
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.75rem',
  marginBottom: theme.spacing(1)
}));

/**
 * ConversationWithPresence Component
 * 
 * A complete conversation interface with real-time presence indicators,
 * typing indicators, and message delivery status
 * 
 * @param {Object} props - Component props
 * @param {Object} props.conversation - Conversation data
 * @param {Array} props.messages - Message data
 * @param {string} props.currentUserId - Current user ID
 */
const ConversationWithPresence = ({ 
  conversation, 
  messages: initialMessages = [], 
  currentUserId 
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isEncrypted, setIsEncrypted] = useState(true);
  
  const messageListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Get other participants (for 1:1 chat, this will be just one user)
  const otherParticipants = conversation?.participants?.filter(
    p => p.id !== currentUserId
  ) || [];
  
  // Get the other user for 1:1 conversations
  const otherUser = otherParticipants.length === 1 ? otherParticipants[0] : null;
  
  useEffect(() => {
    // Join the conversation room when component mounts
    if (conversation?.id) {
      socketService.joinConversation(conversation.id);
      
      // Mark conversation as read when opened
      presenceService.markConversationAsRead(conversation.id);
    }
    
    // Set up socket event listeners
    const messageHandler = (message) => {
      if (message.conversationId === conversation?.id) {
        setMessages(prev => [...prev, message]);
        
        // Mark message as read immediately if we're in the conversation
        presenceService.sendReadReceipt(message.id, conversation.id);
        
        // Clear typing indicator for the sender
        setTypingUsers(prev => ({
          ...prev,
          [message.senderId]: false
        }));
      }
    };
    
    const typingHandler = (data) => {
      if (data.conversationId === conversation?.id && data.userId !== currentUserId) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: true
        }));
      }
    };
    
    const typingStoppedHandler = (data) => {
      if (data.conversationId === conversation?.id && data.userId !== currentUserId) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: false
        }));
      }
    };
    
    // Subscribe to events
    const unsubscribeNewMessage = socketService.on('new_message', messageHandler);
    const unsubscribeTyping = socketService.on('typing', typingHandler);
    const unsubscribeTypingStopped = socketService.on('typing_stopped', typingStoppedHandler);
    
    // Scroll to bottom initially
    scrollToBottom();
    
    return () => {
      // Leave the conversation room when component unmounts
      if (conversation?.id) {
        socketService.leaveConversation(conversation.id);
      }
      
      // Clean up event listeners
      unsubscribeNewMessage();
      unsubscribeTyping();
      unsubscribeTypingStopped();
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversation?.id, currentUserId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      // Send typing indicator
      socketService.sendTypingIndicator(conversation?.id);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.sendTypingStoppedIndicator(conversation?.id);
      }, 2000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, conversation?.id]);
  
  // Scroll to bottom of message list
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Set typing indicator
    if (!isTyping && e.target.value.trim() !== '') {
      setIsTyping(true);
    }
    
    // If input is empty, stop typing indicator immediately
    if (e.target.value.trim() === '') {
      setIsTyping(false);
      socketService.sendTypingStoppedIndicator(conversation?.id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };
  
  // Handle send message
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !conversation?.id) return;
    
    try {
      setIsLoading(true);
      
      // Generate a temporary ID for the message
      const tempId = `temp_${Date.now()}`;
      
      // Add message to local state immediately with "sending" status
      const tempMessage = {
        id: tempId,
        content: newMessage,
        senderId: currentUserId,
        conversationId: conversation.id,
        timestamp: new Date(),
        isEncrypted: isEncrypted,
        status: 'sending'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Mark message as sending in presence service
      presenceService.markMessageAsSending(tempId);
      
      // Clear input and typing indicator
      setNewMessage('');
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Send typing stopped indicator
      socketService.sendTypingStoppedIndicator(conversation.id);
      
      // Handle encryption if enabled
      let messageData = {};
      
      if (isEncrypted) {
        // Get recipient public keys
        const recipientKeys = {};
        for (const participant of conversation.participants) {
          if (participant.id !== currentUserId && participant.publicKey) {
            recipientKeys[participant.id] = participant.publicKey;
          }
        }
        
        // Encrypt message
        const encryptionData = await encryptionService.encryptMessage(
          newMessage,
          recipientKeys
        );
        
        messageData = {
          isEncrypted: true,
          encryptedContent: encryptionData.encryptedContent,
          iv: encryptionData.iv,
          recipientKeys: encryptionData.recipientKeys
        };
      } else {
        messageData = {
          content: newMessage,
          isEncrypted: false
        };
      }
      
      // Send message via socket
      const result = await socketService.sendConversationMessage(
        conversation.id,
        isEncrypted ? '' : newMessage,
        null,
        isEncrypted ? messageData : null
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      // Update the temporary message with the real message ID
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, id: result.messageId, status: 'sent' } : msg
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      
      presenceService.markMessageAsFailed(tempId, error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Check if any users are typing
  const anyoneTyping = Object.values(typingUsers).some(Boolean);
  
  // Get typing user name
  const getTypingUserName = () => {
    const typingUserIds = Object.entries(typingUsers)
      .filter(([_, isTyping]) => isTyping)
      .map(([userId]) => userId);
    
    if (typingUserIds.length === 0) return '';
    
    const typingUser = conversation?.participants?.find(p => p.id === typingUserIds[0]);
    return typingUser?.displayName || typingUser?.username || 'Someone';
  };
  
  return (
    <ConversationContainer elevation={3}>
      {/* Conversation Header */}
      <ConversationHeader>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {otherUser && (
            <PresenceIndicator 
              userId={otherUser.id}
              user={otherUser}
              size="medium"
              showAvatar={true}
              sx={{ mr: 2 }}
            />
          )}
          <Box>
            <Typography variant="h6">
              {conversation?.name || otherUser?.displayName || otherUser?.username || 'Conversation'}
            </Typography>
            {otherParticipants.length > 1 && (
              <Typography variant="caption" color="inherit">
                {otherParticipants.length} participants
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex' }}>
          <IconButton color="inherit" size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
      </ConversationHeader>
      
      {/* Encryption Indicator */}
      {isEncrypted && (
        <EncryptionIndicator>
          <LockIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="caption">End-to-end encrypted</Typography>
        </EncryptionIndicator>
      )}
      
      {/* Message List */}
      <MessageList ref={messageListRef}>
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const showAvatar = !isOwn && (!index || messages[index - 1].senderId !== message.senderId);
          
          return (
            <MessageItem key={message.id} isOwn={isOwn}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                width: '100%'
              }}>
                {showAvatar && !isOwn && (
                  <Avatar 
                    src={otherUser?.avatarUrl} 
                    alt={otherUser?.displayName || otherUser?.username}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  >
                    {otherUser?.displayName?.[0] || otherUser?.username?.[0]}
                  </Avatar>
                )}
                
                {!showAvatar && !isOwn && <Box sx={{ width: 40 }} />}
                
                <MessageBubble isOwn={isOwn}>
                  <Typography variant="body2">
                    {message.isEncrypted ? 
                      (message.decryptedContent || '🔒 Encrypted message') : 
                      message.content}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mt: 0.5
                  }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                    
                    {isOwn && (
                      <MessageStatus 
                        messageId={message.id}
                        isEncrypted={message.isEncrypted}
                        size="small"
                        sx={{ ml: 0.5 }}
                      />
                    )}
                  </Box>
                </MessageBubble>
              </Box>
            </MessageItem>
          );
        })}
        
        {/* Typing Indicator */}
        {anyoneTyping && (
          <Box sx={{ pl: 2 }}>
            <TypingIndicator 
              isTyping={anyoneTyping}
              username={getTypingUserName()}
            />
          </Box>
        )}
      </MessageList>
      
      {/* Input Area */}
      <InputContainer>
        <IconButton size="medium">
          <AttachFileIcon />
        </IconButton>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          size="small"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          sx={{ mx: 1 }}
        />
        
        <IconButton 
          color="primary" 
          onClick={handleSendMessage}
          disabled={isLoading || newMessage.trim() === ''}
        >
          {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </InputContainer>
    </ConversationContainer>
  );
};

export default ConversationWithPresence;
