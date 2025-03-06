import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment,
  CircularProgress,
  Tooltip,
  Badge,
  Collapse,
  Paper,
  Button
} from '@mui/material';
import { 
  Send as SendIcon, 
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachIcon,
  Close as CloseIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import EmojiPicker from './EmojiPicker';
import MediaUploader from './MediaUploader.jsx';
import MediaDisplay from './MediaDisplay.jsx';
import { useMessaging } from '../context/MessagingContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';

/**
 * MessageInput component for typing and sending messages
 * 
 * @param {Object} props - Component props
 * @param {string} props.conversationId - ID of the current conversation
 * @param {Function} props.onOpenGallery - Function to open the media gallery
 */
const MessageInput = ({ conversationId, onOpenGallery }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { 
    sendMessage, 
    sendMediaMessage, 
    sendMultipleMediaMessages,
    sendTyping,
    addPendingMedia,
    removePendingMedia,
    updatePendingMediaCaption,
    clearPendingMedia,
    pendingMedia
  } = useMessaging();
  
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  
  const inputRef = useRef(null);
  
  // Focus input when conversation changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Reset state when conversation changes
    setMessage('');
    setShowEmojiPicker(false);
    clearPendingMedia();
    setSelectedMedia(null);
    setUploadedMedia(null);
  }, [conversationId, clearPendingMedia]);
  
  // Handle input change
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    if (conversationId) {
      sendTyping(conversationId);
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.native);
    inputRef.current?.focus();
  };
  
  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };
  
  // Handle media selection
  const handleMediaSelected = (file) => {
    setSelectedMedia(file);
  };
  
  // Handle media upload completion
  const handleMediaUploaded = (media) => {
    setUploadedMedia(media);
    setSelectedMedia(null);
    
    // Auto-send the message with media
    handleSubmitWithMedia(media);
  };
  
  // Handle message submission with media
  const handleSubmitWithMedia = async (media) => {
    if (!conversationId || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Create message with media and optional text
      const messageData = {
        conversationId,
        senderId: user.id,
        content: message.trim(),
        media: {
          id: media.id,
          type: media.mediaType,
          filename: media.originalFilename || media.filename,
          mimeType: media.mimeType,
          size: media.size,
          caption: message.trim() || media.caption || null
        }
      };
      
      // Send the message with media
      await sendMediaMessage(messageData);
      
      // Clear the message input
      setMessage('');
      setUploadedMedia(null);
    } catch (error) {
      console.error('Error sending message with media:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle message submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!message.trim() || !conversationId || isSubmitting) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Send text message
      await sendMessage(conversationId, message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle keypress (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        p: 1,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      {/* Media preview if selected */}
      {uploadedMedia && (
        <Box mb={1} p={1} bgcolor={theme.palette.grey[100]} borderRadius={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="textSecondary">
              Media ready to send
            </Typography>
            <IconButton size="small" onClick={() => setUploadedMedia(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <MediaDisplay media={uploadedMedia} inMessage={true} />
        </Box>
      )}
      
      {/* Emoji picker */}
      <Collapse in={showEmojiPicker}>
        <Paper elevation={3} sx={{ mb: 1 }}>
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </Paper>
      </Collapse>
      
      {/* Input area */}
      <Box display="flex" alignItems="flex-end">
        {/* Media uploader */}
        <MediaUploader
          conversationId={conversationId}
          onMediaSelected={handleMediaSelected}
          onMediaUploaded={handleMediaUploaded}
          disabled={isSubmitting}
        />
        
        {/* Emoji button */}
        <Tooltip title="Emoji">
          <IconButton 
            color={showEmojiPicker ? "primary" : "default"}
            onClick={toggleEmojiPicker}
            disabled={isSubmitting}
          >
            <EmojiIcon />
          </IconButton>
        </Tooltip>
        
        {/* Gallery button */}
        {onOpenGallery && (
          <Tooltip title="Media Gallery">
            <IconButton 
              onClick={onOpenGallery}
              disabled={isSubmitting}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Text input */}
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          variant="outlined"
          size="small"
          sx={{ mx: 1 }}
          InputProps={{
            sx: { 
              borderRadius: 4,
              backgroundColor: theme.palette.background.default
            }
          }}
        />
        
        {/* Send button */}
        <Tooltip title="Send">
          <span>
            <IconButton 
              color="primary" 
              type="submit"
              disabled={(!message.trim() && !uploadedMedia) || isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default MessageInput;
