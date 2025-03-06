import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton, 
  Dialog, 
  DialogContent, 
  CircularProgress,
  Tooltip,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  Description as TextIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useMedia } from '../context/MediaContext';
import mediaService from '../services/mediaService';

// Styled components
const MediaContainer = styled(Box)(({ theme, fullWidth, maxHeight }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  maxWidth: fullWidth ? '100%' : '350px',
  ...(maxHeight && { maxHeight }),
  '&:hover .media-controls': {
    opacity: 1,
  }
}));

const MediaControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  padding: theme.spacing(0.5),
  display: 'flex',
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: `0 0 0 ${theme.shape.borderRadius}px`,
  zIndex: 1,
}));

const MediaImage = styled('img')(({ maxHeight }) => ({
  width: '100%',
  maxHeight: maxHeight || '250px',
  objectFit: 'contain',
  display: 'block',
  cursor: 'pointer',
}));

const MediaVideo = styled('video')(({ maxHeight }) => ({
  width: '100%',
  maxHeight: maxHeight || '250px',
  display: 'block',
}));

const MediaAudio = styled('audio')({
  width: '100%',
  display: 'block',
  marginTop: '8px',
});

const DocumentPreview = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  width: '100%',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

const DocumentIcon = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(2),
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const FullScreenMedia = styled(Box)({
  maxWidth: '90vw',
  maxHeight: '90vh',
  '& img': {
    maxWidth: '100%',
    maxHeight: '90vh',
    objectFit: 'contain',
  },
  '& video': {
    maxWidth: '100%',
    maxHeight: '90vh',
  }
});

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zIndex: 2,
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  width: '100%',
  minHeight: '150px',
}));

/**
 * Get file icon based on MIME type
 * 
 * @param {string} mimeType - MIME type of the file
 * @returns {JSX.Element} Icon component
 */
const getFileIcon = (mimeType) => {
  if (!mimeType) return <FileIcon fontSize="large" />;
  
  if (mimeType.startsWith('image/')) {
    return <ImageIcon fontSize="large" />;
  } else if (mimeType.startsWith('video/')) {
    return <VideoIcon fontSize="large" />;
  } else if (mimeType.startsWith('audio/')) {
    return <AudioIcon fontSize="large" />;
  } else if (mimeType === 'application/pdf') {
    return <PdfIcon fontSize="large" />;
  } else if (mimeType.includes('text/plain') || mimeType.includes('text/markdown')) {
    return <TextIcon fontSize="large" />;
  } else if (
    mimeType.includes('javascript') || 
    mimeType.includes('json') || 
    mimeType.includes('html') || 
    mimeType.includes('css') || 
    mimeType.includes('xml')
  ) {
    return <CodeIcon fontSize="large" />;
  }
  
  return <FileIcon fontSize="large" />;
};

/**
 * MediaDisplay Component
 * 
 * Displays media content (images, videos, audio, documents) with controls
 */
const MediaDisplay = ({ 
  media, 
  inMessage = false, 
  onClick, 
  fullWidth = false, 
  maxHeight = null 
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { downloadMedia } = useMedia();

  useEffect(() => {
    // Reset error state when media changes
    setLoadError(false);
  }, [media]);

  if (!media) return null;

  const { id, mediaType, mimeType, filename, originalFilename, size } = media;
  const mediaUrl = mediaService.getMediaUrl(id);
  const thumbnailUrl = mediaService.getMediaThumbnailUrl(id);
  const displayName = originalFilename || filename || 'File';
  
  const handleDownload = (e) => {
    if (e) e.stopPropagation();
    setLoading(true);
    
    try {
      downloadMedia(id, displayName);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFullscreen = (e) => {
    if (e) e.stopPropagation();
    setFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setFullscreen(false);
  };

  const handleMediaError = () => {
    setLoadError(true);
  };

  const getMediaType = () => {
    if (mediaType) return mediaType;
    if (mimeType) return mimeType.split('/')[0];
    return 'unknown';
  };

  const renderMediaContent = () => {
    const type = getMediaType();
    
    if (loadError) {
      return (
        <ErrorContainer>
          <Typography color="error" gutterBottom>
            Failed to load media
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
            The media file could not be displayed
          </Typography>
          <Box mt={1}>
            <Tooltip title="Download file">
              <IconButton 
                color="primary" 
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : <DownloadIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </ErrorContainer>
      );
    }
    
    if (type === 'image' || mimeType?.startsWith('image/')) {
      return (
        <MediaImage 
          src={thumbnailUrl || mediaUrl} 
          alt={displayName} 
          loading="lazy"
          onClick={onClick || handleFullscreen}
          onError={handleMediaError}
          maxHeight={maxHeight}
        />
      );
    } else if (type === 'video' || mimeType?.startsWith('video/')) {
      return (
        <MediaVideo 
          src={mediaUrl} 
          controls 
          preload="metadata"
          onClick={(e) => e.stopPropagation()}
          onError={handleMediaError}
          maxHeight={maxHeight}
        />
      );
    } else if (type === 'audio' || mimeType?.startsWith('audio/')) {
      return (
        <Box>
          <Box display="flex" alignItems="center" mb={1}>
            <AudioIcon fontSize="large" color="primary" />
            <Typography variant="body2" ml={1} noWrap sx={{ maxWidth: '250px' }}>
              {displayName}
            </Typography>
          </Box>
          <MediaAudio 
            src={mediaUrl} 
            controls 
            preload="metadata"
            onClick={(e) => e.stopPropagation()}
            onError={handleMediaError}
          />
        </Box>
      );
    } else {
      // Document or other file type
      return (
        <DocumentPreview onClick={onClick || handleDownload}>
          <DocumentIcon>
            {getFileIcon(mimeType)}
          </DocumentIcon>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" noWrap>
              {displayName}
            </Typography>
            {mimeType && (
              <Typography variant="caption" color="textSecondary" display="block" noWrap>
                {mimeType}
              </Typography>
            )}
            {size && (
              <Typography variant="caption" color="textSecondary">
                {MediaDisplay.formatFileSize(size)}
              </Typography>
            )}
          </Box>
          {loading && (
            <Box sx={{ width: '100%', position: 'absolute', bottom: 0, left: 0 }}>
              <LinearProgress />
            </Box>
          )}
        </DocumentPreview>
      );
    }
  };

  const renderFullscreenContent = () => {
    const type = getMediaType();
    
    if (type === 'image' || mimeType?.startsWith('image/')) {
      return (
        <img 
          src={mediaUrl} 
          alt={displayName} 
          style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
          onError={handleMediaError}
        />
      );
    } else if (type === 'video' || mimeType?.startsWith('video/')) {
      return (
        <video 
          src={mediaUrl} 
          controls 
          autoPlay 
          style={{ maxWidth: '100%', maxHeight: '90vh' }}
          onError={handleMediaError}
        />
      );
    } else {
      return renderMediaContent();
    }
  };

  return (
    <>
      <MediaContainer fullWidth={fullWidth} maxHeight={maxHeight}>
        {renderMediaContent()}
        
        <MediaControls className="media-controls">
          <Tooltip title="Download">
            <IconButton 
              size="small" 
              onClick={handleDownload}
              disabled={loading}
              sx={{ color: 'white' }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          {(getMediaType() === 'image' || mimeType?.startsWith('image/')) && (
            <Tooltip title="View full size">
              <IconButton 
                size="small" 
                onClick={handleFullscreen}
                sx={{ color: 'white' }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </MediaControls>
      </MediaContainer>

      <Dialog 
        open={fullscreen} 
        onClose={handleCloseFullscreen}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ position: 'relative', padding: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CloseButton onClick={handleCloseFullscreen}>
            <CloseIcon />
          </CloseButton>
          
          <FullScreenMedia>
            {renderFullscreenContent()}
          </FullScreenMedia>
          
          <Box position="absolute" bottom={16} right={16}>
            <Tooltip title="Download">
              <IconButton 
                onClick={handleDownload}
                disabled={loading}
                sx={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : <DownloadIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

MediaDisplay.propTypes = {
  media: PropTypes.shape({
    id: PropTypes.string,
    mediaType: PropTypes.string,
    mimeType: PropTypes.string,
    filename: PropTypes.string,
    originalFilename: PropTypes.string,
    size: PropTypes.number,
  }).isRequired,
  inMessage: PropTypes.bool,
  onClick: PropTypes.func,
  fullWidth: PropTypes.bool,
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

/**
 * Format file size in human-readable format
 * 
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
MediaDisplay.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default MediaDisplay;
