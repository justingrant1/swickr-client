import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  Collapse,
  Dialog,
  Tooltip
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';
import MediaUploader from '../components/MediaUploader.jsx';
import MediaDisplay from '../components/MediaDisplay.jsx';
import MediaGallery from '../components/MediaGallery.jsx';
import MessageInput from '../components/MessageInput.js';

// Styled components
const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}));

const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  padding: theme.spacing(1.5, 2),
  maxWidth: '70%',
  borderRadius: isOwn 
    ? theme.spacing(2, 0, 2, 2) 
    : theme.spacing(0, 2, 2, 2),
  backgroundColor: isOwn 
    ? theme.palette.primary.main 
    : theme.palette.mode === 'dark' 
      ? theme.palette.grey[800] 
      : theme.palette.grey[100],
  color: isOwn 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.primary,
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(1),
  wordBreak: 'break-word',
}));

const MessageTime = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  fontSize: '0.75rem',
  color: isOwn 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.secondary,
  opacity: 0.8,
  marginTop: theme.spacing(0.5),
  textAlign: 'right',
}));

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const Home = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    loading, 
    sendMessage, 
    setActiveConversation,
    sendTypingIndicator,
    isUserTyping,
    isUserOnline,
    formatLastSeen
  } = useMessaging();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [messageInput, setMessageInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState({});
  const [mediaUploadError, setMediaUploadError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for conversation list
  const formatDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return formatTime(date);
    } else if (
      messageDate.getDate() === now.getDate() - 1 &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if ((!messageInput.trim() && !selectedMedia) || !activeConversation) return;

    // Create message data
    const messageData = selectedMedia 
      ? { text: messageInput.trim(), media: selectedMedia }
      : messageInput.trim();
    
    // Send message
    sendMessage(messageData);
    
    // Clear input and media
    setMessageInput('');
    setSelectedMedia(null);
    setShowMediaUploader(false);
    
    // Clear typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
      sendTypingIndicator(activeConversation.id, false);
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle conversation click
  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
  };

  // Handle back button click (mobile)
  const handleBackClick = () => {
    setActiveConversation(null);
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (activeConversation) {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Send typing indicator
      sendTypingIndicator(activeConversation.id, true);
      
      // Set timeout to clear typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        sendTypingIndicator(activeConversation.id, false);
      }, 3000);
      
      setTypingTimeout(timeout);
    }
  };

  // Handle attachment button click
  const handleAttachmentClick = () => {
    setShowMediaUploader(!showMediaUploader);
  };
  
  // Handle media selection
  const handleMediaSelected = (media) => {
    setSelectedMedia(media);
  };
  
  // Handle media upload cancel
  const handleMediaCancel = () => {
    setSelectedMedia(null);
    setShowMediaUploader(false);
  };

  // Handle media upload complete
  const handleMediaUploadComplete = (uploadedFiles) => {
    // Close the media uploader
    setShowMediaUploader(false);
    
    // Reset progress and error states
    setMediaUploadProgress({});
    setMediaUploadError(null);
    
    // Send messages with media attachments
    uploadedFiles.forEach(uploadResult => {
      const { originalFile } = uploadResult;
      
      sendMessage({
        text: '',
        media: {
          id: uploadResult.mediaId,
          type: originalFile.mediaType,
          url: uploadResult.mediaUrl,
          name: originalFile.name,
          size: originalFile.size,
          mimeType: originalFile.type
        }
      });
    });
  };
  
  // Handle media upload error
  const handleMediaUploadError = (error) => {
    setMediaUploadError(error.message || 'Failed to upload media');
  };
  
  // Toggle media uploader
  const toggleMediaUploader = () => {
    setShowMediaUploader(prev => !prev);
    if (showMediaUploader) {
      // Reset states when closing
      setMediaUploadProgress({});
      setMediaUploadError(null);
    }
  };

  // Get conversation messages
  const getConversationMessages = () => {
    if (!activeConversation) return [];
    return messages[activeConversation.id] || [];
  };

  // Handle opening media gallery
  const handleOpenMediaGallery = () => {
    if (!activeConversation) return;
    setShowMediaGallery(true);
  };

  // Handle closing media gallery
  const handleCloseMediaGallery = () => {
    setShowMediaGallery(false);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Conversations list */}
      {(!isMobile || !activeConversation) && (
        <Box
          sx={{
            width: isMobile ? '100%' : 320,
            borderRight: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Messages
            </Typography>
          </Box>
          <Divider />
          <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
            {conversations.map((conversation) => (
              <ListItem
                key={conversation.id}
                button
                onClick={() => handleConversationClick(conversation)}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor:
                    activeConversation?.id === conversation.id
                      ? theme.palette.action.selected
                      : 'transparent',
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color={isUserOnline(conversation.id) ? "success" : "default"}
                  >
                    <Avatar
                      alt={conversation.name}
                      src={conversation.avatar}
                      sx={{ bgcolor: theme.palette.primary.main }}
                    >
                      {conversation.name.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {conversation.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(conversation.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '180px',
                        }}
                      >
                        {conversation.lastMessage}
                      </Typography>
                      {conversation.unread > 0 && (
                        <Badge
                          badgeContent={conversation.unread}
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Chat area */}
      {(!isMobile || activeConversation) && (
        <ChatContainer sx={{ flexGrow: 1 }}>
          {/* Chat header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="back"
                onClick={handleBackClick}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            {activeConversation ? (
              <>
                <Avatar
                  alt={activeConversation.name}
                  src={activeConversation.avatar}
                  sx={{ bgcolor: theme.palette.primary.main, mr: 1.5 }}
                >
                  {activeConversation?.name?.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {activeConversation.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isUserTyping(activeConversation.id) 
                      ? 'Typing...' 
                      : isUserOnline(activeConversation.id) 
                        ? 'Online' 
                        : 'Last seen at'/*formatLastSeen(activeConversation.id)*/}
                  </Typography>
                </Box>
                <Tooltip title="Media Gallery">
                  <IconButton onClick={handleOpenMediaGallery}>
                    <ImageIcon />
                  </IconButton>
                </Tooltip>
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </>
            ) : (
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Select a conversation
              </Typography>
            )}
          </Box>

          {/* Messages */}
          {activeConversation ? (
            <>
              <MessageList>
                {getConversationMessages().map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.senderId === user.id ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <MessageBubble isOwn={message.senderId === user.id}>
                      {message.media ? (
                        <>
                          <MediaDisplay 
                            media={message.media} 
                            isOwn={message.senderId === user.id} 
                          />
                          {message.content && (
                            <Typography variant="body1" sx={{ mt: 1 }}>
                              {message.content}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="body1">{message.content}</Typography>
                      )}
                      <MessageTime isOwn={message.senderId === user.id}>
                        {formatTime(message.timestamp)}
                        {message.senderId === user.id && (
                          <Box component="span" sx={{ ml: 0.5, opacity: 0.7 }}>
                            {message.status === 'sending' ? '•' : 
                             message.status === 'sent' ? '••' : 
                             message.status === 'delivered' ? '•••' : 
                             message.read ? '✓✓' : '✓'}
                          </Box>
                        )}
                      </MessageTime>
                    </MessageBubble>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </MessageList>

              {/* Use the updated MessageInput component */}
              <MessageInput 
                conversationId={activeConversation.id}
                onOpenGallery={handleOpenMediaGallery}
              />
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
              }}
            >
              <Typography variant="h6" color="text.secondary" align="center">
                Select a conversation to start messaging
              </Typography>
            </Box>
          )}
        </ChatContainer>
      )}

      {/* Media Gallery Dialog */}
      <Dialog
        open={showMediaGallery}
        onClose={handleCloseMediaGallery}
        fullWidth
        maxWidth="md"
        sx={{ 
          '& .MuiDialog-paper': { 
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
          } 
        }}
      >
        {activeConversation && (
          <MediaGallery 
            conversationId={activeConversation.id}
            onClose={handleCloseMediaGallery}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default Home;
