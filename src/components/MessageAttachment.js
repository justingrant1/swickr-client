import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon
} from '@mui/icons-material';
import mediaService from '../services/mediaService';

// Styled components
const AttachmentContainer = styled(Box)(({ theme, isOwn }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  marginBottom: theme.spacing(1),
  backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
}));

const MediaImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '200px',
  display: 'block',
  cursor: 'pointer',
  borderRadius: 8
});

const MediaVideo = styled('video')({
  maxWidth: '100%',
  maxHeight: '200px',
  display: 'block',
  borderRadius: 8
});

const MediaAudio = styled('audio')({
  width: '100%',
  marginTop: '8px'
});

const DocumentPreview = styled(Box)(({ theme, isOwn }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
}));

const FileIconContainer = styled(Box)(({ theme, isOwn }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : theme.palette.primary.light,
  marginRight: theme.spacing(2),
  color: isOwn ? theme.palette.common.white : theme.palette.common.white
}));

const FullscreenImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '80vh',
  objectFit: 'contain',
  transition: 'transform 0.3s ease'
});

const FullscreenVideo = styled('video')({
  maxWidth: '100%',
  maxHeight: '80vh',
  objectFit: 'contain'
});

const DialogControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  zIndex: 1
}));

const ControlButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  }
}));

/**
 * MessageAttachment Component
 * 
 * Displays a media attachment in a message with options to view and download.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.attachment - Attachment data
 * @param {boolean} props.isOwn - Whether the message is from the current user
 */
const MessageAttachment = ({ attachment, isOwn }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  if (!attachment) return null;
  
  const { mediaType, url, originalName, size, mimeType } = attachment;
  
  // Handle attachment click
  const handleAttachmentClick = () => {
    if (mediaType === 'image' || mediaType === 'video') {
      setExpanded(true);
    }
  };
  
  // Handle download
  const handleDownload = async (e) => {
    e.stopPropagation();
    
    try {
      setLoading(true);
      
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || `swickr-media-${attachment.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    setExpanded(false);
    setZoom(1);
    setRotation(0);
  };
  
  // Handle zoom in
  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 3));
  };
  
  // Handle zoom out
  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // Handle rotation
  const handleRotate = (e) => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };
  
  // Get media type icon
  const getMediaTypeIcon = () => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      case 'audio':
        return <AudioIcon />;
      case 'document':
      default:
        return <FileIcon />;
    }
  };
  
  // Render attachment based on type
  const renderAttachment = () => {
    switch (mediaType) {
      case 'image':
        return (
          <AttachmentContainer isOwn={isOwn} onClick={handleAttachmentClick}>
            <MediaImage 
              src={url} 
              alt={originalName || 'Image'} 
              loading="lazy"
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 0.5 
            }}>
              <Typography variant="caption" color={isOwn ? 'inherit' : 'textSecondary'} noWrap sx={{ maxWidth: '70%' }}>
                {originalName || 'Image'}
              </Typography>
              <IconButton 
                size="small" 
                onClick={handleDownload}
                color={isOwn ? 'inherit' : 'primary'}
              >
                {loading ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
              </IconButton>
            </Box>
          </AttachmentContainer>
        );
        
      case 'video':
        return (
          <AttachmentContainer isOwn={isOwn}>
            <MediaVideo 
              src={url} 
              controls 
              onClick={(e) => e.stopPropagation()}
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 0.5 
            }}>
              <Typography variant="caption" color={isOwn ? 'inherit' : 'textSecondary'} noWrap sx={{ maxWidth: '70%' }}>
                {originalName || 'Video'}
              </Typography>
              <IconButton 
                size="small" 
                onClick={handleDownload}
                color={isOwn ? 'inherit' : 'primary'}
              >
                {loading ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
              </IconButton>
            </Box>
          </AttachmentContainer>
        );
        
      case 'audio':
        return (
          <AttachmentContainer isOwn={isOwn}>
            <MediaAudio 
              src={url} 
              controls 
              onClick={(e) => e.stopPropagation()}
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 0.5 
            }}>
              <Typography variant="caption" color={isOwn ? 'inherit' : 'textSecondary'} noWrap sx={{ maxWidth: '70%' }}>
                {originalName || 'Audio'}
              </Typography>
              <IconButton 
                size="small" 
                onClick={handleDownload}
                color={isOwn ? 'inherit' : 'primary'}
              >
                {loading ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
              </IconButton>
            </Box>
          </AttachmentContainer>
        );
        
      case 'document':
      default:
        return (
          <DocumentPreview isOwn={isOwn}>
            <FileIconContainer isOwn={isOwn}>
              {getMediaTypeIcon()}
            </FileIconContainer>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" noWrap color={isOwn ? 'inherit' : 'textPrimary'}>
                {originalName || 'Document'}
              </Typography>
              {size && (
                <Typography variant="caption" color={isOwn ? 'inherit' : 'textSecondary'}>
                  {mediaService.formatFileSize(size)}
                </Typography>
              )}
            </Box>
            
            <IconButton 
              size="small" 
              onClick={handleDownload}
              color={isOwn ? 'inherit' : 'primary'}
            >
              {loading ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
            </IconButton>
          </DocumentPreview>
        );
    }
  };
  
  return (
    <>
      {renderAttachment()}
      
      {/* Fullscreen dialog */}
      <Dialog
        open={expanded}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            backgroundImage: 'none',
            m: { xs: 0, sm: 2 },
            p: 0,
            height: { xs: '100%', sm: 'auto' },
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0, textAlign: 'center', position: 'relative' }}>
          <DialogControls>
            {mediaType === 'image' && (
              <>
                <ControlButton onClick={handleZoomIn}>
                  <ZoomInIcon />
                </ControlButton>
                <ControlButton onClick={handleZoomOut}>
                  <ZoomOutIcon />
                </ControlButton>
                <ControlButton onClick={handleRotate}>
                  <RotateRightIcon />
                </ControlButton>
              </>
            )}
            <ControlButton onClick={handleDownload}>
              <DownloadIcon />
            </ControlButton>
            <ControlButton onClick={handleClose}>
              <CloseIcon />
            </ControlButton>
          </DialogControls>
          
          {mediaType === 'image' && (
            <FullscreenImage 
              src={url} 
              alt={originalName || 'Image'} 
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            />
          )}
          
          {mediaType === 'video' && (
            <FullscreenVideo 
              src={url} 
              controls 
              autoPlay
            />
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
            {originalName || (mediaType === 'image' ? 'Image' : 'Video')}
          </Typography>
          <Button onClick={handleClose} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessageAttachment;
