import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  MobileStepper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import SwipeableViews from 'react-swipeable-views';
import mediaService from '../services/mediaService';

// Styled components
const GalleryContainer = styled(Box)(({ theme, isOwn }) => ({
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1)
}));

const MediaThumbnail = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  cursor: 'pointer',
  height: 100,
  backgroundColor: theme.palette.background.default
}));

const ThumbnailImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
});

const ThumbnailVideo = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white
}));

const ThumbnailDocument = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.paper
}));

const FullscreenMedia = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%'
});

const FullscreenImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '70vh',
  objectFit: 'contain',
  transition: 'transform 0.3s ease'
});

const FullscreenVideo = styled('video')({
  maxWidth: '100%',
  maxHeight: '70vh',
  objectFit: 'contain'
});

const FullscreenAudio = styled('audio')({
  width: '100%',
  maxWidth: 500
});

const DialogControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  zIndex: 10
}));

const ControlButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  }
}));

const OverlayIcon = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: theme.palette.common.white,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '50%',
  padding: theme.spacing(0.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

/**
 * MediaGallery Component
 * 
 * Displays multiple media attachments in a grid layout with fullscreen preview capability.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.attachments - Array of attachment objects
 * @param {boolean} props.isOwn - Whether the message is from the current user
 */
const MediaGallery = ({ attachments = [], isOwn = false }) => {
  const theme = useTheme();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const maxSteps = attachments.length;
  
  if (!attachments || attachments.length === 0) return null;
  
  // Handle thumbnail click
  const handleThumbnailClick = (index) => {
    setActiveStep(index);
    setFullscreenOpen(true);
    setZoom(1);
    setRotation(0);
  };
  
  // Handle fullscreen close
  const handleFullscreenClose = () => {
    setFullscreenOpen(false);
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
    setZoom(1);
    setRotation(0);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep - 1 + maxSteps) % maxSteps);
    setZoom(1);
    setRotation(0);
  };
  
  // Handle step change
  const handleStepChange = (step) => {
    setActiveStep(step);
    setZoom(1);
    setRotation(0);
  };
  
  // Handle download
  const handleDownload = () => {
    const attachment = attachments[activeStep];
    if (!attachment || !attachment.url) return;
    
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName || `swickr-media-${attachment.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // Handle rotation
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  // Get media type icon
  const getMediaTypeIcon = (mediaType) => {
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
  
  // Render thumbnail based on media type
  const renderThumbnail = (attachment, index) => {
    const { mediaType, url, thumbnailUrl, originalName } = attachment;
    
    switch (mediaType) {
      case 'image':
        return (
          <MediaThumbnail onClick={() => handleThumbnailClick(index)}>
            <ThumbnailImage 
              src={thumbnailUrl || url} 
              alt={originalName || 'Image'} 
              loading="lazy"
            />
          </MediaThumbnail>
        );
        
      case 'video':
        return (
          <MediaThumbnail onClick={() => handleThumbnailClick(index)}>
            {thumbnailUrl ? (
              <ThumbnailImage 
                src={thumbnailUrl} 
                alt={originalName || 'Video'} 
                loading="lazy"
              />
            ) : (
              <ThumbnailVideo>
                <VideoIcon fontSize="large" />
              </ThumbnailVideo>
            )}
            <OverlayIcon>
              <VideoIcon />
            </OverlayIcon>
          </MediaThumbnail>
        );
        
      case 'audio':
        return (
          <MediaThumbnail onClick={() => handleThumbnailClick(index)}>
            <ThumbnailDocument>
              <AudioIcon fontSize="large" color="primary" />
              <Typography variant="caption" noWrap sx={{ maxWidth: '90%', mt: 0.5 }}>
                {originalName || 'Audio'}
              </Typography>
            </ThumbnailDocument>
          </MediaThumbnail>
        );
        
      case 'document':
      default:
        return (
          <MediaThumbnail onClick={() => handleThumbnailClick(index)}>
            <ThumbnailDocument>
              <FileIcon fontSize="large" color="primary" />
              <Typography variant="caption" noWrap sx={{ maxWidth: '90%', mt: 0.5 }}>
                {originalName || 'Document'}
              </Typography>
            </ThumbnailDocument>
          </MediaThumbnail>
        );
    }
  };
  
  // Render fullscreen media
  const renderFullscreenMedia = (attachment) => {
    if (!attachment) return null;
    
    const { mediaType, url, originalName, size } = attachment;
    
    switch (mediaType) {
      case 'image':
        return (
          <FullscreenMedia>
            <FullscreenImage 
              src={url} 
              alt={originalName || 'Image'} 
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)` 
              }}
            />
          </FullscreenMedia>
        );
        
      case 'video':
        return (
          <FullscreenMedia>
            <FullscreenVideo 
              src={url} 
              controls 
              autoPlay
            />
          </FullscreenMedia>
        );
        
      case 'audio':
        return (
          <FullscreenMedia>
            <Box sx={{ 
              width: '100%', 
              maxWidth: 500, 
              p: 2, 
              backgroundColor: 'background.paper',
              borderRadius: 1
            }}>
              <Typography variant="subtitle1" gutterBottom>
                {originalName || 'Audio'}
              </Typography>
              <FullscreenAudio 
                src={url} 
                controls 
                autoPlay
              />
              {size && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {mediaService.formatFileSize(size)}
                </Typography>
              )}
            </Box>
          </FullscreenMedia>
        );
        
      case 'document':
      default:
        return (
          <FullscreenMedia>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 3,
              backgroundColor: 'background.paper',
              borderRadius: 1
            }}>
              <FileIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {originalName || 'Document'}
              </Typography>
              {size && (
                <Typography variant="body2" color="textSecondary">
                  {mediaService.formatFileSize(size)}
                </Typography>
              )}
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />} 
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download
              </Button>
            </Box>
          </FullscreenMedia>
        );
    }
  };
  
  // Calculate grid columns based on attachment count
  const getGridColumns = () => {
    const count = attachments.length;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    if (count === 4) return 2;
    return 3; // For 5+ attachments
  };
  
  // Determine if we should show "more" indicator
  const showMoreIndicator = attachments.length > 5;
  const visibleAttachments = showMoreIndicator ? attachments.slice(0, 5) : attachments;
  const gridColumns = getGridColumns();
  
  return (
    <>
      <GalleryContainer isOwn={isOwn}>
        <Grid container spacing={1}>
          {visibleAttachments.map((attachment, index) => (
            <Grid 
              item 
              xs={12 / gridColumns} 
              key={attachment.id || index}
              sx={
                index === 4 && showMoreIndicator 
                  ? { position: 'relative' } 
                  : {}
              }
            >
              {renderThumbnail(attachment, index)}
              
              {/* "More" indicator overlay */}
              {index === 4 && showMoreIndicator && (
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 8,
                    right: 8,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'common.white',
                    borderRadius: 1,
                    cursor: 'pointer',
                    zIndex: 1
                  }}
                  onClick={() => handleThumbnailClick(4)}
                >
                  <Typography variant="h6">+{attachments.length - 4}</Typography>
                </Box>
              )}
            </Grid>
          ))}
        </Grid>
      </GalleryContainer>
      
      {/* Fullscreen dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={handleFullscreenClose}
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
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <DialogControls>
            {attachments[activeStep]?.mediaType === 'image' && (
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
            <ControlButton onClick={handleFullscreenClose}>
              <CloseIcon />
            </ControlButton>
          </DialogControls>
          
          <SwipeableViews
            axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
            index={activeStep}
            onChangeIndex={handleStepChange}
            enableMouseEvents
          >
            {attachments.map((attachment, index) => (
              <div key={attachment.id || index}>
                {Math.abs(activeStep - index) <= 2 ? (
                  renderFullscreenMedia(attachment)
                ) : null}
              </div>
            ))}
          </SwipeableViews>
        </DialogContent>
        
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          nextButton={
            <Button
              size="small"
              onClick={handleNext}
              disabled={maxSteps <= 1}
            >
              Next
              {theme.direction === 'rtl' ? (
                <KeyboardArrowLeft />
              ) : (
                <KeyboardArrowRight />
              )}
            </Button>
          }
          backButton={
            <Button 
              size="small" 
              onClick={handleBack}
              disabled={maxSteps <= 1}
            >
              {theme.direction === 'rtl' ? (
                <KeyboardArrowRight />
              ) : (
                <KeyboardArrowLeft />
              )}
              Back
            </Button>
          }
        />
        
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
            {attachments[activeStep]?.originalName || 'Media'} 
            {attachments[activeStep]?.size && ` (${mediaService.formatFileSize(attachments[activeStep].size)})`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {activeStep + 1} of {maxSteps}
          </Typography>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MediaGallery;
