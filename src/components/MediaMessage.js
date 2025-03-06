import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Image as ImageIcon,
  VideoCameraBack as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  ZoomIn as ZoomInIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import mediaService from '../services/mediaService';

// Styled components
const MediaContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.grey[100],
  maxWidth: '100%',
  '&:hover .media-actions': {
    opacity: 1
  }
}));

const MediaActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  padding: theme.spacing(0.5),
  display: 'flex',
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderBottomLeftRadius: theme.shape.borderRadius
}));

const MediaImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '200px',
  display: 'block',
  objectFit: 'contain'
});

const MediaVideo = styled('video')({
  maxWidth: '100%',
  maxHeight: '200px',
  display: 'block',
  objectFit: 'contain'
});

const MediaAudio = styled('audio')({
  width: '100%',
  marginTop: '8px'
});

const DocumentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius
}));

const FullscreenImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '90vh',
  objectFit: 'contain'
});

const FullscreenVideo = styled('video')({
  maxWidth: '100%',
  maxHeight: '90vh',
  objectFit: 'contain'
});

/**
 * Media Message Component
 * 
 * Displays media content in messages with appropriate previews and actions.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.media - Media object with type, url, etc.
 * @param {boolean} props.isCurrentUser - Whether the message is from the current user
 */
const MediaMessage = ({ media, isCurrentUser }) => {
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(null);
  
  if (!media || !media.mediaType || !media.mediaUrl) {
    return null;
  }
  
  const { mediaType, mediaUrl } = media;
  const filename = mediaUrl.split('/').pop();
  
  // Handle download
  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle fullscreen view
  const handleFullscreen = () => {
    setFullscreen(true);
  };
  
  // Close fullscreen view
  const handleCloseFullscreen = () => {
    setFullscreen(false);
  };
  
  // Render media content based on type
  const renderMedia = () => {
    switch (mediaType) {
      case 'image':
        return (
          <MediaContainer>
            <MediaImage 
              src={mediaUrl} 
              alt="Image" 
              loading="lazy"
              onClick={handleFullscreen}
              style={{ cursor: 'pointer' }}
            />
            <MediaActions className="media-actions">
              <IconButton 
                size="small" 
                color="inherit" 
                onClick={handleFullscreen}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                color="inherit" 
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadIcon fontSize="small" />
                )}
              </IconButton>
            </MediaActions>
          </MediaContainer>
        );
        
      case 'video':
        return (
          <MediaContainer>
            <MediaVideo 
              src={mediaUrl} 
              controls 
            />
            <MediaActions className="media-actions">
              <IconButton 
                size="small" 
                color="inherit" 
                onClick={handleFullscreen}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                color="inherit" 
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadIcon fontSize="small" />
                )}
              </IconButton>
            </MediaActions>
          </MediaContainer>
        );
        
      case 'audio':
        return (
          <MediaContainer>
            <MediaAudio 
              src={mediaUrl} 
              controls 
            />
            <MediaActions className="media-actions">
              <IconButton 
                size="small" 
                color="inherit" 
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadIcon fontSize="small" />
                )}
              </IconButton>
            </MediaActions>
          </MediaContainer>
        );
        
      case 'document':
      default:
        return (
          <DocumentContainer>
            <DocumentIcon fontSize="large" sx={{ mr: 1 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" noWrap>
                {filename}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Document
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={handleDownload}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <DownloadIcon />
              )}
            </IconButton>
          </DocumentContainer>
        );
    }
  };
  
  // Render fullscreen dialog
  const renderFullscreenDialog = () => {
    if (!fullscreen) return null;
    
    return (
      <Dialog 
        open={fullscreen} 
        onClose={handleCloseFullscreen}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            aria-label="close"
            onClick={handleCloseFullscreen}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {mediaType === 'image' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <FullscreenImage src={mediaUrl} alt="Full size" />
            </Box>
          ) : mediaType === 'video' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <FullscreenVideo src={mediaUrl} controls autoPlay />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownload} startIcon={<DownloadIcon />}>
            Download
          </Button>
          <Button onClick={handleCloseFullscreen} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <>
      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}
      {renderMedia()}
      {renderFullscreenDialog()}
    </>
  );
};

export default MediaMessage;
