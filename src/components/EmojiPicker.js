import React, { useRef, useEffect } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Picker from 'emoji-picker-react';

/**
 * EmojiPicker component for selecting emojis
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onEmojiSelect - Callback when emoji is selected
 * @param {Function} props.onClose - Optional callback when picker is closed
 */
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const theme = useTheme();
  const pickerRef = useRef(null);
  
  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose && onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <Paper 
      ref={pickerRef}
      elevation={3} 
      sx={{
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        maxWidth: '100%'
      }}
    >
      {onClose && (
        <Box sx={{ position: 'absolute', top: 5, right: 5, zIndex: 10 }}>
          <IconButton 
            size="small"
            onClick={onClose}
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      <Picker
        onEmojiClick={(emojiData, event) => {
          onEmojiSelect({
            id: emojiData.unified,
            name: emojiData.names[0],
            native: emojiData.emoji,
            unified: emojiData.unified
          });
        }}
        disableAutoFocus={true}
        searchPlaceholder="Search emojis..."
        previewConfig={{ showPreview: false }}
        theme={theme.palette.mode}
        skinTonePickerLocation="none"
        width="100%"
        height="350px"
      />
    </Paper>
  );
};

export default EmojiPicker;
