import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  IconButton,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CheckCircle as SentIcon, 
  DoneAll as ReadIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import MediaGallery from './MediaGallery';
import MessageAttachment from './MessageAttachment';

// Styled components
const MessageContainer = styled(Box)(({ theme, isOwn }) => ({
  display: 'flex',
  flexDirection: isOwn ? 'row-reverse' : 'row',
  alignItems: 'flex-end',
  marginBottom: theme.spacing(1),
  padding: theme.spacing(0.5, 1)
}));

const MessageBubble = styled(Paper)(({ theme, isOwn, hasMedia }) => ({
  padding: hasMedia ? theme.spacing(1) : theme.spacing(1.5, 2),
  maxWidth: '70%',
  borderRadius: 16,
  position: 'relative',
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.background.paper,
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  wordBreak: 'break-word',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isOwn ? 'right' : 'left']: -8,
    width: 0,
    height: 0,
    border: '8px solid transparent',
    borderBottomColor: isOwn ? theme.palette.primary.main : theme.palette.background.paper,
  }
}));

const MessageStatus = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(0.5),
  fontSize: '0.75rem',
  color: theme.palette.text.secondary
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginRight: theme.spacing(0.5)
}));

const UploadingContainer = styled(Box)(({ theme, isOwn }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1)
}));

/**
 * Message Component
 * 
 * Displays a single message in a conversation, including text and media content.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message data
 * @param {boolean} props.isOwn - Whether the message is from the current user
 */
const Message = ({ message, isOwn }) => {
  const { user } = useAuth();
  
  if (!message) return null;
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Process media attachments
  const processAttachments = () => {
    // If message has a single media attachment
    if (message.mediaUrl || message.mediaId) {
      return [{
        id: message.mediaId || message.id,
        url: message.mediaUrl,
        mediaType: message.mediaType || 'document',
        originalName: message.mediaCaption || 'File',
        size: message.mediaSize || 0,
        mimeType: message.mediaMimeType
      }];
    }
    
    // If message has multiple attachments
    if (message.attachments && message.attachments.length > 0) {
      return message.attachments.map(attachment => ({
        id: attachment.id,
        url: attachment.url,
        mediaType: attachment.mediaType || 'document',
        originalName: attachment.caption || attachment.originalName || 'File',
        size: attachment.size || 0,
        mimeType: attachment.mimeType,
        thumbnailUrl: attachment.thumbnailUrl
      }));
    }
    
    return [];
  };
  
  // Get attachments
  const attachments = processAttachments();
  const hasAttachments = attachments.length > 0;
  
  // Render uploading media
  const renderUploadingMedia = () => {
    if (!message.isUploading) return null;
    
    return (
      <UploadingContainer isOwn={isOwn}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
          <CircularProgress 
            variant="determinate" 
            value={message.uploadProgress || 0} 
            size={50}
            color={isOwn ? 'inherit' : 'primary'}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color={isOwn ? 'inherit' : 'primary.main'}
            >
              {`${Math.round(message.uploadProgress || 0)}%`}
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" color={isOwn ? 'inherit' : 'textSecondary'}>
          {message.mediaCaption || 'Uploading media...'}
        </Typography>
      </UploadingContainer>
    );
  };
  
  // Render media content
  const renderMedia = () => {
    if (message.isUploading) {
      return renderUploadingMedia();
    }
    
    if (!hasAttachments) return null;
    
    // Use MediaGallery for multiple attachments
    if (attachments.length > 1) {
      return <MediaGallery attachments={attachments} isOwn={isOwn} />;
    }
    
    // Use MessageAttachment for single attachment
    return <MessageAttachment attachment={attachments[0]} isOwn={isOwn} />;
  };
  
  // Render message status icon
  const renderStatusIcon = () => {
    if (message.status === 'error') {
      return <ErrorIcon color="error" fontSize="small" />;
    }
    
    if (message.read) {
      return <ReadIcon color="primary" fontSize="small" />;
    }
    
    return <SentIcon color="action" fontSize="small" />;
  };
  
  return (
    <MessageContainer isOwn={isOwn}>
      {!isOwn && (
        <Avatar
          sx={{ width: 32, height: 32, mr: 1 }}
          alt={message.senderName || 'User'}
          src={message.senderAvatar}
        />
      )}
      
      <Box sx={{ maxWidth: '70%' }}>
        <MessageBubble isOwn={isOwn} hasMedia={hasAttachments || message.isUploading}>
          {renderMedia()}
          
          {message.content && (
            <Typography variant="body2">
              {message.content}
            </Typography>
          )}
          
          <MessageStatus>
            <MessageTime variant="caption">
              {formatTimestamp(message.timestamp)}
            </MessageTime>
            {isOwn && renderStatusIcon()}
          </MessageStatus>
        </MessageBubble>
      </Box>
    </MessageContainer>
  );
};

export default Message;
