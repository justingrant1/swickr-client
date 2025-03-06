import React, { useState, useRef } from 'react';
import { 
  Box, 
  Paper,
  Typography, 
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import mediaService from '../services/mediaService';

/**
 * Media Uploader Component
 * 
 * Allows users to upload and preview media files before sending them in a conversation.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onFileSelect - Callback function when files are selected
 * @param {Function} props.onClose - Callback function when uploader is closed
 * @param {Number} props.maxFiles - Maximum number of files that can be selected at once (default: 10)
 * @param {Array} props.acceptedTypes - Array of accepted file types (default: all supported types)
 */
const MediaUploader = ({ 
  onFileSelect, 
  onClose, 
  maxFiles = 10,
  acceptedTypes = null
}) => {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Process and validate files
  const processFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    // Convert FileList to Array
    const files = Array.from(fileList);
    
    // Check if exceeding max files
    if (files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at once`);
      return;
    }
    
    // Validate each file
    const validatedFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const validation = mediaService.validateFile(file);
      
      if (validation.success) {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // Add to valid files
        validatedFiles.push({
          file,
          previewUrl,
          mediaType: mediaService.getFileTypeFromMime(file.type),
          id: Math.random().toString(36).substring(2, 15) // Temporary ID until processed by parent
        });
      } else {
        invalidFiles.push({
          name: file.name,
          reason: validation.error
        });
      }
    });
    
    // Show error if any invalid files
    if (invalidFiles.length > 0) {
      if (invalidFiles.length === 1) {
        setError(`${invalidFiles[0].name}: ${invalidFiles[0].reason}`);
      } else {
        setError(`${invalidFiles.length} files couldn't be uploaded. Please check file types and sizes.`);
      }
    }
    
    // Pass valid files to parent if any
    if (validatedFiles.length > 0) {
      onFileSelect(validatedFiles);
      
      // Close uploader if all files were valid
      if (invalidFiles.length === 0) {
        onClose();
      }
    }
  };
  
  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };
  
  // Handle specific media type selection
  const handleMediaTypeSelect = (acceptType) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };
  
  // Get default accept string based on acceptedTypes prop
  const getAcceptString = () => {
    if (acceptedTypes) {
      return acceptedTypes.join(',');
    }
    return "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
  };
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        position: 'relative',
        backgroundColor: theme.palette.background.paper
      }}
    >
      {/* Close button */}
      <IconButton
        size="small"
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Add Media
      </Typography>
      
      {/* Drag and drop area */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: dragActive ? 
            theme.palette.mode === 'dark' ? 'rgba(98, 0, 238, 0.08)' : 'rgba(98, 0, 238, 0.04)' : 
            'transparent',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept={getAcceptString()}
        />
        
        <UploadIcon 
          color="primary" 
          sx={{ fontSize: 48, mb: 1 }} 
        />
        
        <Typography variant="body1" gutterBottom>
          Drag and drop files here, or click to browse
        </Typography>
        
        <Typography variant="body2" color="textSecondary">
          Supports images, videos, audio, and documents (max {mediaService.MAX_FILE_SIZE / (1024 * 1024)}MB)
        </Typography>
        
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
          You can select up to {maxFiles} files at once
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Quick access buttons */}
      <List sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', p: 0 }}>
        <ListItem 
          button 
          onClick={() => handleMediaTypeSelect('image/*')}
          sx={{ 
            flexDirection: 'column', 
            alignItems: 'center',
            width: 'auto'
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto', mb: 1 }}>
            <ImageIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Images" 
            primaryTypographyProps={{ 
              variant: 'body2',
              align: 'center'
            }} 
          />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => handleMediaTypeSelect('video/*')}
          sx={{ 
            flexDirection: 'column', 
            alignItems: 'center',
            width: 'auto'
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto', mb: 1 }}>
            <VideoIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Videos" 
            primaryTypographyProps={{ 
              variant: 'body2',
              align: 'center'
            }} 
          />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => handleMediaTypeSelect('audio/*')}
          sx={{ 
            flexDirection: 'column', 
            alignItems: 'center',
            width: 'auto'
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto', mb: 1 }}>
            <AudioIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Audio" 
            primaryTypographyProps={{ 
              variant: 'body2',
              align: 'center'
            }} 
          />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => handleMediaTypeSelect('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt')}
          sx={{ 
            flexDirection: 'column', 
            alignItems: 'center',
            width: 'auto'
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto', mb: 1 }}>
            <DocumentIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Documents" 
            primaryTypographyProps={{ 
              variant: 'body2',
              align: 'center'
            }} 
          />
        </ListItem>
      </List>
      
      {/* Error message */}
      <Snackbar 
        open={Boolean(error)} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default MediaUploader;
