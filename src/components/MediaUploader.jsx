import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Button, 
  Typography, 
  IconButton, 
  CircularProgress,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Chip,
  Paper
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import mediaService from '../services/mediaService';
import { useMedia } from '../context/MediaContext';

// Styled components
const UploadButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const FileInput = styled('input')({
  display: 'none',
});

const PreviewContainer = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
}));

const PreviewImage = styled('img')({
  width: '100%',
  maxHeight: '200px',
  objectFit: 'contain',
  borderRadius: '4px',
});

const PreviewVideo = styled('video')({
  width: '100%',
  maxHeight: '200px',
  borderRadius: '4px',
});

const PreviewAudio = styled('audio')({
  width: '100%',
  marginTop: '8px',
});

const DocumentPreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

const DocumentIcon = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(1),
  color: theme.palette.primary.main,
}));

const ClosePreviewButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(0.5),
  right: theme.spacing(0.5),
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  padding: '4px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zIndex: 2
}));

const UploadOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1,
  color: 'white',
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  width: '90%',
  textAlign: 'center',
}));

const Container = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

/**
 * MediaUploader Component
 * 
 * Allows users to select and upload media files
 */
const MediaUploader = ({ onMediaSelected, onMediaUploaded, conversationId, disabled, allowMultiple = false }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileProgress, setFileProgress] = useState({});
  const [showCaptionDialog, setShowCaptionDialog] = useState(false);
  const [captions, setCaptions] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [fileInfo, setFileInfo] = useState({});
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const fileInputRef = useRef(null);
  const { mediaErrors, loadingMedia } = useMedia();
  const uploadStartTimeRef = useRef(null);
  const lastUploadedBytesRef = useRef(0);
  const speedIntervalRef = useRef(null);
  const totalSizeRef = useRef(0);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }
      
      // Clean up object URLs
      Object.values(previewUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Clear any previous errors
    setError(null);
    
    // For single file mode, only take the first file
    const filesToProcess = allowMultiple ? files : [files[0]];
    
    // Process each file
    const newSelectedFiles = [];
    const newPreviewUrls = {};
    const newFileInfo = {};
    let totalSize = 0;
    
    for (const file of filesToProcess) {
      // Validate file
      const validation = mediaService.validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        continue;
      }
      
      try {
        // Generate preview
        const preview = await mediaService.generatePreview(file);
        newPreviewUrls[file.name] = preview;
        
        // Set file info for display
        newFileInfo[file.name] = {
          name: file.name,
          size: mediaService.formatFileSize(file.size),
          type: file.type,
          lastModified: new Date(file.lastModified).toLocaleString()
        };
        
        newSelectedFiles.push(file);
        totalSize += file.size;
      } catch (err) {
        console.error(`Failed to generate preview for ${file.name}:`, err);
        // Continue with other files
      }
    }
    
    // Update state
    if (newSelectedFiles.length > 0) {
      if (allowMultiple) {
        // Add to existing files in multiple mode
        setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
        setPreviewUrls(prev => ({ ...prev, ...newPreviewUrls }));
        setFileInfo(prev => ({ ...prev, ...newFileInfo }));
      } else {
        // Replace in single mode
        setSelectedFiles(newSelectedFiles);
        setPreviewUrls(newPreviewUrls);
        setFileInfo(newFileInfo);
      }
      
      totalSizeRef.current = totalSize;
      
      if (onMediaSelected) {
        onMediaSelected(allowMultiple ? newSelectedFiles : newSelectedFiles[0]);
      }
    } else {
      setError('No valid files were selected');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !conversationId) return;
    
    setUploading(true);
    setUploadProgress(0);
    setFileProgress({});
    setError(null);
    setUploadSpeed(null);
    setTimeRemaining(null);
    uploadStartTimeRef.current = Date.now();
    lastUploadedBytesRef.current = 0;
    
    // Start tracking upload speed
    speedIntervalRef.current = setInterval(() => {
      if (uploadStartTimeRef.current && lastUploadedBytesRef.current > 0) {
        const elapsedSeconds = (Date.now() - uploadStartTimeRef.current) / 1000;
        if (elapsedSeconds > 0) {
          // Calculate speed in bytes per second
          const bytesPerSecond = lastUploadedBytesRef.current / elapsedSeconds;
          setUploadSpeed(formatSpeed(bytesPerSecond));
          
          // Calculate time remaining
          if (uploadProgress > 0 && uploadProgress < 100) {
            const totalBytes = totalSizeRef.current;
            const remainingBytes = totalBytes - (totalBytes * (uploadProgress / 100));
            const secondsRemaining = remainingBytes / bytesPerSecond;
            setTimeRemaining(formatTimeRemaining(secondsRemaining));
          }
        }
      }
    }, 1000);
    
    try {
      let uploadedMedia;
      
      if (allowMultiple && selectedFiles.length > 1) {
        // Use batch upload for multiple files
        uploadedMedia = await mediaService.uploadMediaBatch(
          selectedFiles,
          conversationId,
          (progress) => {
            setUploadProgress(progress);
            // Update bytes uploaded for speed calculation
            lastUploadedBytesRef.current = totalSizeRef.current * (progress / 100);
          },
          (fileIndex, progress) => {
            setFileProgress(prev => ({
              ...prev,
              [selectedFiles[fileIndex].name]: progress
            }));
          },
          (media) => {
            // Individual file completed
            if (onMediaUploaded) {
              // Add caption if provided
              if (captions[media.originalFilename]) {
                media.caption = captions[media.originalFilename];
              }
              onMediaUploaded(media);
            }
          }
        );
        
        // Show success message
        setSuccessMessage(`${selectedFiles.length} files uploaded successfully`);
      } else {
        // Single file upload
        const file = selectedFiles[0];
        uploadedMedia = await mediaService.uploadMedia(
          file,
          conversationId,
          (progress) => {
            setUploadProgress(progress);
            setFileProgress({ [file.name]: progress });
            // Update bytes uploaded for speed calculation
            lastUploadedBytesRef.current = file.size * (progress / 100);
          }
        );
        
        // Add caption if provided
        if (captions[file.name]) {
          uploadedMedia.caption = captions[file.name];
        }
        
        if (onMediaUploaded) {
          onMediaUploaded(uploadedMedia);
        }
        
        // Show success message
        setSuccessMessage(`${file.name} uploaded successfully`);
      }
      
      // Reset state
      clearSelection();
    } catch (error) {
      console.error('Error uploading media:', error);
      setError(error.message || 'Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }
    }
  };

  const clearSelection = () => {
    // Clean up object URLs
    Object.values(previewUrls).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    
    setSelectedFiles([]);
    setPreviewUrls({});
    setUploadProgress(0);
    setFileProgress({});
    setCaptions({});
    setFileInfo({});
    setUploadSpeed(null);
    setTimeRemaining(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileName) => {
    if (uploading) return; // Don't allow removal during upload
    
    // Remove the file
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    
    // Clean up preview URL
    if (previewUrls[fileName]) {
      URL.revokeObjectURL(previewUrls[fileName]);
      setPreviewUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[fileName];
        return newUrls;
      });
    }
    
    // Clean up other state
    setFileInfo(prev => {
      const newInfo = { ...prev };
      delete newInfo[fileName];
      return newInfo;
    });
    
    setCaptions(prev => {
      const newCaptions = { ...prev };
      delete newCaptions[fileName];
      return newCaptions;
    });
  };

  const handleCaptionChange = (fileName, value) => {
    setCaptions(prev => ({
      ...prev,
      [fileName]: value
    }));
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(1)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s remaining`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s remaining`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m remaining`;
    }
  };

  const renderFilePreview = (file, index) => {
    if (!file) return null;
    
    const fileName = file.name;
    const preview = previewUrls[fileName];
    const info = fileInfo[fileName];
    const progress = fileProgress[fileName] || 0;
    const mediaType = mediaService.getMediaType(file);
    
    const previewComponent = (() => {
      if (mediaType === 'image') {
        return (
          <PreviewImage src={preview} alt="Preview" />
        );
      } else if (mediaType === 'video') {
        return (
          <PreviewVideo src={preview} controls />
        );
      } else if (mediaType === 'audio') {
        return (
          <>
            <Box display="flex" alignItems="center" mb={1}>
              <AudioIcon color="primary" />
              <Typography variant="body2" ml={1} noWrap>
                {fileName}
              </Typography>
            </Box>
            <PreviewAudio src={preview} controls />
          </>
        );
      } else {
        return (
          <DocumentPreview>
            <DocumentIcon>
              <FileIcon />
            </DocumentIcon>
            <Box>
              <Typography variant="body2" noWrap>
                {fileName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {info?.size || mediaService.formatFileSize(file.size)}
              </Typography>
            </Box>
          </DocumentPreview>
        );
      }
    })();
    
    return (
      <PreviewContainer elevation={2} key={fileName}>
        {previewComponent}
        
        {!uploading && (
          <ClosePreviewButton size="small" onClick={() => removeFile(fileName)}>
            <CloseIcon fontSize="small" />
          </ClosePreviewButton>
        )}
        
        {captions[fileName] && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Caption: {captions[fileName]}
          </Typography>
        )}
        
        {uploading && (
          <UploadOverlay>
            <ProgressContainer>
              <CircularProgress 
                variant="determinate" 
                value={progress} 
                color="inherit" 
                size={40}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {progress}% Uploaded
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mt: 1, borderRadius: 1 }}
              />
              {uploadSpeed && (
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                  {uploadSpeed} • {timeRemaining || 'Calculating...'}
                </Typography>
              )}
            </ProgressContainer>
          </UploadOverlay>
        )}
        
        {info && !uploading && (
          <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
            <Typography variant="caption" component="div">
              Size: {info.size}
            </Typography>
          </Box>
        )}
        
        {!uploading && (
          <TextField
            label="Caption (optional)"
            variant="outlined"
            size="small"
            fullWidth
            margin="dense"
            value={captions[fileName] || ''}
            onChange={(e) => handleCaptionChange(fileName, e.target.value)}
          />
        )}
      </PreviewContainer>
    );
  };

  return (
    <Container>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {selectedFiles.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {selectedFiles.map((file, index) => renderFilePreview(file, index))}
          </Box>
          
          <ButtonGroup>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleUpload}
              disabled={uploading || disabled}
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={clearSelection}
              disabled={uploading || disabled}
              startIcon={<ClearIcon />}
            >
              Clear
            </Button>
            
            {allowMultiple && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || disabled}
                startIcon={<AddIcon />}
              >
                Add More
              </Button>
            )}
          </ButtonGroup>
          
          {uploading && allowMultiple && selectedFiles.length > 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Overall Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ height: 8, borderRadius: 1 }}
              />
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {uploadProgress}% • {uploadSpeed || 'Calculating...'} • {timeRemaining || 'Calculating...'}
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <UploadButton
          variant="outlined"
          component="label"
          startIcon={<AttachFileIcon />}
          disabled={disabled}
        >
          {allowMultiple ? 'Select Files' : 'Select File'}
          <input
            type="file"
            hidden
            accept="image/*,video/*,audio/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            ref={fileInputRef}
            multiple={allowMultiple}
          />
        </UploadButton>
      )}
    </Container>
  );
};

MediaUploader.propTypes = {
  onMediaSelected: PropTypes.func,
  onMediaUploaded: PropTypes.func.isRequired,
  conversationId: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

MediaUploader.defaultProps = {
  disabled: false
};

export default MediaUploader;
