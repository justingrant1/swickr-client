import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton, 
  Dialog, 
  DialogContent,
  CircularProgress,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  DownloadOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined,
  CloseOutlined,
  PlayArrowOutlined,
  PauseOutlined,
  VolumeUpOutlined,
  VolumeMuteOutlined
} from '@mui/icons-material';
import mediaService from '../../services/mediaService';

/**
 * MediaMessage Component
 * 
 * Displays media content in messages with appropriate viewers based on media type
 */
const MediaMessage = ({ media, caption, className, showControls = true }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  const mediaRef = useRef(null);
  
  // Reset zoom when exiting fullscreen
  useEffect(() => {
    if (!fullscreen) {
      setZoom(1);
    }
  }, [fullscreen]);
  
  // Handle media loading
  const handleMediaLoad = () => {
    setLoading(false);
  };
  
  // Handle media error
  const handleMediaError = () => {
    setLoading(false);
    setError('Failed to load media');
  };
  
  // Handle download
  const handleDownload = (e) => {
    e.stopPropagation();
    if (media && media.url) {
      mediaService.downloadFile(media.url, media.id);
    }
  };
  
  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    setFullscreen(!fullscreen);
  };
  
  // Handle zoom in
  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom(Math.min(zoom + 0.25, 3));
  };
  
  // Handle zoom out
  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom(Math.max(zoom - 0.25, 0.5));
  };
  
  // Handle play/pause for video and audio
  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle mute toggle for video and audio
  const handleMuteToggle = (e) => {
    e.stopPropagation();
    if (mediaRef.current) {
      mediaRef.current.muted = !mediaRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
  // Render media content based on type
  const renderMedia = () => {
    if (!media || !media.url) {
      return <Typography color="error">Media not available</Typography>;
    }
    
    const { type, url, mimeType } = media;
    
    // Image media
    if (type === 'image') {
      return (
        <Box 
          sx={{ 
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1,
            cursor: 'pointer',
            maxWidth: fullscreen ? '90vw' : '300px',
            maxHeight: fullscreen ? '80vh' : '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onClick={handleFullscreenToggle}
        >
          {loading && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          <img 
            src={url} 
            alt={caption || 'Image'} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              transform: fullscreen ? `scale(${zoom})` : 'none',
              transition: 'transform 0.2s ease-in-out'
            }}
            onLoad={handleMediaLoad}
            onError={handleMediaError}
          />
          
          {fullscreen && showControls && (
            <Box sx={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 1, padding: '4px' }}>
              <IconButton size="small" onClick={handleZoomIn} color="primary">
                <ZoomInOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleZoomOut} color="primary">
                <ZoomOutOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleDownload} color="primary">
                <DownloadOutlined fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      );
    }
    
    // Video media
    if (type === 'video') {
      return (
        <Box 
          sx={{ 
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1,
            cursor: 'pointer',
            maxWidth: fullscreen ? '90vw' : '300px',
            maxHeight: fullscreen ? '80vh' : '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000'
          }}
          onClick={fullscreen ? null : handleFullscreenToggle}
        >
          {loading && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          <video 
            ref={mediaRef}
            src={url} 
            controls={fullscreen}
            muted={isMuted}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%'
            }}
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={(e) => fullscreen && e.stopPropagation()}
          />
          
          {!fullscreen && showControls && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}
            >
              <IconButton 
                color="primary" 
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
              >
                <PlayArrowOutlined />
              </IconButton>
            </Box>
          )}
          
          {fullscreen && showControls && (
            <Box sx={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 1, padding: '4px' }}>
              <IconButton size="small" onClick={handlePlayPause} color="primary">
                {isPlaying ? <PauseOutlined fontSize="small" /> : <PlayArrowOutlined fontSize="small" />}
              </IconButton>
              <IconButton size="small" onClick={handleMuteToggle} color="primary">
                {isMuted ? <VolumeMuteOutlined fontSize="small" /> : <VolumeUpOutlined fontSize="small" />}
              </IconButton>
              <IconButton size="small" onClick={handleDownload} color="primary">
                <DownloadOutlined fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      );
    }
    
    // Audio media
    if (type === 'audio') {
      return (
        <Box 
          sx={{ 
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1,
            padding: 2,
            backgroundColor: 'rgba(98, 0, 238, 0.05)',
            border: '1px solid rgba(98, 0, 238, 0.1)',
            maxWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src="/assets/audio-icon.png" 
              alt="Audio" 
              style={{ width: 40, height: 40 }}
            />
            <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {caption || 'Audio file'}
            </Typography>
            {showControls && (
              <IconButton size="small" onClick={handleDownload} color="primary">
                <DownloadOutlined fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          <audio 
            ref={mediaRef}
            src={url} 
            controls
            style={{ width: '100%' }}
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </Box>
      );
    }
    
    // Document media
    if (type === 'document') {
      // Determine document icon based on mime type
      let iconSrc = '/assets/document-icon.png';
      
      if (mimeType === 'application/pdf') {
        iconSrc = '/assets/pdf-icon.png';
      } else if (mimeType.includes('word') || mimeType.includes('doc')) {
        iconSrc = '/assets/word-icon.png';
      } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
        iconSrc = '/assets/excel-icon.png';
      } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        iconSrc = '/assets/powerpoint-icon.png';
      }
      
      return (
        <Paper 
          elevation={1}
          sx={{ 
            padding: 2,
            maxWidth: '300px',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(98, 0, 238, 0.05)'
            }
          }}
          onClick={handleDownload}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src={iconSrc} 
              alt="Document" 
              style={{ width: 40, height: 40 }}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
            />
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {caption || 'Document'}
              </Typography>
              {media.size && (
                <Typography variant="caption" color="text.secondary">
                  {mediaService.getReadableFileSize(media.size)}
                </Typography>
              )}
            </Box>
            {showControls && (
              <Tooltip title="Download">
                <IconButton size="small" color="primary">
                  <DownloadOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Paper>
      );
    }
    
    // Fallback for unknown media types
    return (
      <Box 
        sx={{ 
          padding: 2,
          maxWidth: '300px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.03)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img 
            src="/assets/file-icon.png" 
            alt="File" 
            style={{ width: 40, height: 40 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2">
              {caption || 'File'}
            </Typography>
            {media.size && (
              <Typography variant="caption" color="text.secondary">
                {mediaService.getReadableFileSize(media.size)}
              </Typography>
            )}
          </Box>
          {showControls && (
            <IconButton size="small" onClick={handleDownload} color="primary">
              <DownloadOutlined fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  };
  
  // Render fullscreen dialog for media
  const renderFullscreenDialog = () => {
    return (
      <Dialog 
        open={fullscreen} 
        onClose={handleFullscreenToggle}
        maxWidth="xl"
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <IconButton 
          onClick={handleFullscreenToggle}
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }
          }}
        >
          <CloseOutlined />
        </IconButton>
        
        <DialogContent sx={{ padding: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          {renderMedia()}
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <Box className={className}>
      {renderMedia()}
      {renderFullscreenDialog()}
      
      {caption && !['audio', 'document'].includes(media?.type) && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 0.5, 
            color: 'text.secondary',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {caption}
        </Typography>
      )}
      
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

MediaMessage.propTypes = {
  media: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['image', 'video', 'audio', 'document']).isRequired,
    url: PropTypes.string.isRequired,
    mimeType: PropTypes.string,
    size: PropTypes.number
  }).isRequired,
  caption: PropTypes.string,
  className: PropTypes.string,
  showControls: PropTypes.bool
};

export default MediaMessage;
