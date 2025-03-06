import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Paper,
  TextField,
  LinearProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import mediaService from '../services/mediaService';

// Styled components
const PreviewContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  maxWidth: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: theme.shadows[1]
}));

const PreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '200px',
  display: 'block',
  objectFit: 'contain'
});

const PreviewVideo = styled('video')({
  maxWidth: '100%',
  maxHeight: '200px',
  display: 'block',
  objectFit: 'contain'
});

const PreviewAudio = styled('audio')({
  width: '100%',
  marginTop: '8px'
});

const DocumentPreview = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  width: '100%'
}));

const ProgressOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: theme.palette.common.white,
  zIndex: 1
}));

const ActionButtons = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  padding: theme.spacing(0.5),
  display: 'flex',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderBottomLeftRadius: theme.shape.borderRadius
}));

const FileIconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  marginRight: theme.spacing(2),
  color: theme.palette.common.white
}));

/**
 * Media Preview Component
 * 
 * Displays a preview of media files before sending, with options to remove or edit captions.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.files - Array of file objects to preview
 * @param {Function} props.onRemove - Function to call when remove button is clicked
 * @param {Function} props.onCaptionChange - Function to call when caption is changed
 * @param {Object} props.uploadProgress - Upload progress object with file IDs as keys and progress values
 */
const MediaPreview = ({ 
  files = [], 
  onRemove, 
  onCaptionChange,
  uploadProgress = {} 
}) => {
  const theme = useTheme();
  const [expandedPreview, setExpandedPreview] = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);
  const [captionText, setCaptionText] = useState('');
  
  // Start caption editing
  const handleStartCaptionEdit = (file) => {
    setEditingCaption(file.id);
    setCaptionText(file.caption || '');
  };
  
  // Save caption
  const handleSaveCaption = (fileId) => {
    if (onCaptionChange) {
      onCaptionChange(fileId, captionText);
    }
    setEditingCaption(null);
  };
  
  // Render action buttons
  const renderActionButtons = (fileId) => {
    return (
      <ActionButtons>
        <IconButton 
          size="small" 
          onClick={() => onRemove(fileId)}
          sx={{ color: 'white', p: 0.5 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleStartCaptionEdit({ id: fileId })}
          sx={{ color: 'white', p: 0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </ActionButtons>
    );
  };
  
  // Render progress overlay
  const renderProgressOverlay = (fileId) => {
    const progress = uploadProgress[fileId] || 0;
    
    return (
      <ProgressOverlay>
        <CircularProgress 
          variant="determinate" 
          value={progress} 
          color="primary" 
          size={40} 
          thickness={4} 
        />
        <Typography variant="body2" sx={{ mt: 1 }}>
          {progress}%
        </Typography>
      </ProgressOverlay>
    );
  };
  
  // Render preview based on media type
  const renderPreview = (file) => {
    if (!file) return null;
    
    const mediaType = file.mediaType || mediaService.getFileTypeFromMime(file.file?.type);
    const previewUrl = file.previewUrl;
    const isUploading = uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100;
    const progress = uploadProgress[file.id] || 0;
    const fileName = file.file?.name || file.originalName || 'File';
    const fileSize = file.file?.size || file.size || 0;
    
    return (
      <Box 
        key={file.id} 
        sx={{ 
          mb: 2, 
          position: 'relative'
        }}
      >
        {isUploading && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 1, borderRadius: 1 }} 
          />
        )}
        
        {mediaType === 'image' && (
          <PreviewContainer>
            <PreviewImage 
              src={previewUrl} 
              alt={fileName}
              onClick={() => setExpandedPreview(file)}
            />
            {!isUploading && renderActionButtons(file.id)}
            {isUploading && renderProgressOverlay(file.id)}
          </PreviewContainer>
        )}
        
        {mediaType === 'video' && (
          <PreviewContainer>
            <PreviewVideo 
              src={previewUrl} 
              controls
            />
            {!isUploading && renderActionButtons(file.id)}
            {isUploading && renderProgressOverlay(file.id)}
          </PreviewContainer>
        )}
        
        {mediaType === 'audio' && (
          <PreviewContainer>
            <Box sx={{ width: '100%', p: 2 }}>
              <PreviewAudio 
                src={previewUrl} 
                controls
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {fileName} ({mediaService.formatFileSize(fileSize)})
              </Typography>
            </Box>
            {!isUploading && renderActionButtons(file.id)}
            {isUploading && renderProgressOverlay(file.id)}
          </PreviewContainer>
        )}
        
        {mediaType === 'document' && (
          <DocumentPreview>
            <FileIconContainer>
              {mediaService.getFileIcon(file.file?.type || file.mimeType)}
            </FileIconContainer>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="body2" noWrap>
                {fileName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {mediaService.formatFileSize(fileSize)}
              </Typography>
            </Box>
            <Box>
              {!isUploading ? (
                <IconButton 
                  size="small" 
                  onClick={() => onRemove(file.id)}
                  color="default"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              ) : (
                <CircularProgress 
                  size={24} 
                  thickness={5} 
                  variant="determinate" 
                  value={progress} 
                />
              )}
            </Box>
          </DocumentPreview>
        )}
        
        {/* Caption area */}
        {editingCaption === file.id ? (
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Add a caption..."
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              autoFocus
              InputProps={{
                endAdornment: (
                  <Button 
                    size="small" 
                    onClick={() => handleSaveCaption(file.id)}
                    variant="text"
                  >
                    Save
                  </Button>
                )
              }}
            />
          </Box>
        ) : (
          file.caption && (
            <Box sx={{ mt: 0.5 }}>
              <Chip 
                label={file.caption}
                size="small"
                onClick={() => handleStartCaptionEdit(file)}
                onDelete={() => handleStartCaptionEdit(file)}
                deleteIcon={<EditIcon fontSize="small" />}
              />
            </Box>
          )
        )}
      </Box>
    );
  };
  
  // Render expanded preview dialog
  const renderExpandedPreview = () => {
    if (!expandedPreview) return null;
    
    const mediaType = expandedPreview.mediaType || 
                      mediaService.getFileTypeFromMime(expandedPreview.file?.type);
    const previewUrl = expandedPreview.previewUrl;
    
    return (
      <Dialog
        open={Boolean(expandedPreview)}
        onClose={() => setExpandedPreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 1 }}>
          {mediaType === 'image' && (
            <img 
              src={previewUrl} 
              alt={expandedPreview.file?.name || 'Image preview'}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                display: 'block',
                margin: '0 auto'
              }} 
            />
          )}
          
          {mediaType === 'video' && (
            <video 
              src={previewUrl} 
              controls
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                display: 'block',
                margin: '0 auto'
              }} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpandedPreview(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  if (!files || files.length === 0) {
    return null;
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      {files.map(file => renderPreview(file))}
      {renderExpandedPreview()}
    </Box>
  );
};

export default MediaPreview;
