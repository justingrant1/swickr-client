import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button,
  LinearProgress,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  useTheme
} from '@mui/material';
import { 
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Image as ImageIcon,
  Videocam as VideocamIcon,
  AudioFile as AudioFileIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import mediaService from '../../services/mediaService';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const PreviewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  width: '100%',
  marginTop: theme.spacing(1)
}));

const PreviewItem = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  gap: theme.spacing(1),
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const PreviewImage = styled('img')({
  width: 60,
  height: 60,
  objectFit: 'cover',
  borderRadius: 4
});

const FileTypeIcon = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.action.hover,
  borderRadius: 4,
  color: theme.palette.primary.main
}));

/**
 * MediaUploader Component
 * 
 * Handles file uploads for the chat interface with preview and progress tracking
 */
const MediaUploader = ({ onUpload, onCancel, conversationId, disabled }) => {
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [showUploader, setShowUploader] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (selectedFiles.length === 0) return;
    
    // Validate files
    const newFiles = [];
    const newPreviews = [];
    const newErrors = {};
    
    selectedFiles.forEach((file) => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Validate file
      const validation = mediaService.validateFile(file);
      
      if (validation.valid) {
        newFiles.push({
          id: fileId,
          file,
          type: mediaService.getMediaType(file),
          name: file.name,
          size: file.size,
          mimeType: file.type
        });
        
        // Generate preview
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews(prev => [
              ...prev,
              {
                id: fileId,
                preview: e.target.result,
                type: 'image'
              }
            ]);
          };
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
          newPreviews.push({
            id: fileId,
            type: 'video',
            icon: <VideocamIcon fontSize="large" />
          });
        } else if (file.type.startsWith('audio/')) {
          newPreviews.push({
            id: fileId,
            type: 'audio',
            icon: <AudioFileIcon fontSize="large" />
          });
        } else {
          newPreviews.push({
            id: fileId,
            type: 'document',
            icon: <DescriptionIcon fontSize="large" />
          });
        }
      } else {
        newErrors[fileId] = validation.error;
      }
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setErrors(prev => ({ ...prev, ...newErrors }));
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Show uploader if files were added
    if (newFiles.length > 0) {
      setShowUploader(true);
    }
  };
  
  // Handle file removal
  const handleRemoveFile = (fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setPreviews(prev => prev.filter(preview => preview.id !== fileId));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileId];
      return newErrors;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
    // Hide uploader if no files left
    if (files.length <= 1) {
      setShowUploader(false);
    }
  };
  
  // Handle upload
  const handleUpload = async () => {
    if (files.length === 0 || uploading) return;
    
    setUploading(true);
    
    try {
      // Upload files
      const uploadPromises = files.map(async (fileObj) => {
        const { id, file, type } = fileObj;
        
        // Track progress for this file
        const onProgress = (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [id]: progress
          }));
        };
        
        // Upload the file
        const result = await mediaService.uploadMedia(file, conversationId, onProgress);
        
        return {
          ...result,
          originalId: id,
          type,
          name: file.name,
          size: file.size,
          mimeType: file.type
        };
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Call the onUpload callback with results
      if (onUpload) {
        onUpload(results);
      }
      
      // Reset state
      setFiles([]);
      setPreviews([]);
      setUploadProgress({});
      setErrors({});
      setShowUploader(false);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to upload files. Please try again.'
      }));
    } finally {
      setUploading(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    // Reset state
    setFiles([]);
    setPreviews([]);
    setUploadProgress({});
    setErrors({});
    setShowUploader(false);
    
    // Call the onCancel callback
    if (onCancel) {
      onCancel();
    }
  };
  
  // Get file type icon
  const getFileTypeIcon = useCallback((type) => {
    switch (type) {
      case 'image':
        return <ImageIcon fontSize="large" />;
      case 'video':
        return <VideocamIcon fontSize="large" />;
      case 'audio':
        return <AudioFileIcon fontSize="large" />;
      case 'document':
      default:
        return <DescriptionIcon fontSize="large" />;
    }
  }, []);
  
  // Render file preview
  const renderFilePreview = useCallback((fileObj, preview) => {
    const { id, name, size, type } = fileObj;
    const progress = uploadProgress[id] || 0;
    
    return (
      <PreviewItem key={id} elevation={1}>
        {/* Preview image or type icon */}
        {preview && preview.type === 'image' && preview.preview ? (
          <PreviewImage src={preview.preview} alt={name} />
        ) : (
          <FileTypeIcon>
            {preview && preview.icon ? preview.icon : getFileTypeIcon(type)}
          </FileTypeIcon>
        )}
        
        {/* File info */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Typography variant="body2" noWrap title={name}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {mediaService.getReadableFileSize(size)}
          </Typography>
          
          {/* Upload progress */}
          {uploading && (
            <Box sx={{ width: '100%', mt: 0.5 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                {progress}%
              </Typography>
            </Box>
          )}
          
          {/* Error message */}
          {errors[id] && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
              {errors[id]}
            </Typography>
          )}
        </Box>
        
        {/* Remove button */}
        {!uploading && (
          <IconButton 
            size="small" 
            onClick={() => handleRemoveFile(id)}
            sx={{ color: theme.palette.error.main }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </PreviewItem>
    );
  }, [uploadProgress, uploading, errors, getFileTypeIcon, theme]);
  
  // Render attachment button
  const renderAttachmentButton = () => (
    <Tooltip title="Attach files">
      <IconButton 
        color="primary"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        sx={{ 
          borderRadius: '50%',
          backgroundColor: theme.palette.action.hover,
          '&:hover': {
            backgroundColor: theme.palette.action.selected
          }
        }}
      >
        <AttachFileIcon />
        <VisuallyHiddenInput
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
        />
      </IconButton>
    </Tooltip>
  );
  
  // Render uploader dialog
  const renderUploaderDialog = () => (
    <Dialog 
      open={showUploader} 
      onClose={!uploading ? handleCancel : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Upload Media
        </Typography>
        {!uploading && (
          <IconButton edge="end" color="inherit" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {/* File previews */}
        <PreviewContainer>
          {files.map(fileObj => {
            const preview = previews.find(p => p.id === fileObj.id);
            return renderFilePreview(fileObj, preview);
          })}
        </PreviewContainer>
        
        {/* General error */}
        {errors.general && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {errors.general}
          </Typography>
        )}
        
        {/* Add more files button */}
        {!uploading && (
          <Button
            variant="outlined"
            startIcon={<AttachFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ mt: 2 }}
            fullWidth
          >
            Add More Files
          </Button>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        {!uploading && (
          <Button 
            variant="outlined" 
            onClick={handleCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
        )}
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={uploading ? null : <SendIcon />}
          onClick={handleUpload}
          disabled={files.length === 0 || uploading || Object.keys(errors).length > 0}
        >
          {uploading ? 'Uploading...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <>
      {renderAttachmentButton()}
      {renderUploaderDialog()}
    </>
  );
};

MediaUploader.propTypes = {
  onUpload: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  conversationId: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

export default MediaUploader;
