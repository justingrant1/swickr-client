import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip, 
  CircularProgress,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from '../../utils/axios';

// Common emojis for status
const COMMON_EMOJIS = [
  { emoji: '😊', name: 'Smile' },
  { emoji: '💻', name: 'Work' },
  { emoji: '🎮', name: 'Gaming' },
  { emoji: '🎧', name: 'Music' },
  { emoji: '🍔', name: 'Food' },
  { emoji: '😴', name: 'Sleep' },
  { emoji: '📚', name: 'Study' },
  { emoji: '🏃', name: 'Exercise' },
  { emoji: '🎬', name: 'Movie' },
  { emoji: '✈️', name: 'Travel' },
  { emoji: '🤒', name: 'Sick' },
  { emoji: '🎉', name: 'Party' }
];

// Styled components
const StatusChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '& .MuiChip-deleteIcon': {
    color: theme.palette.primary.contrastText,
    '&:hover': {
      color: theme.palette.grey[300],
    },
  },
}));

const EmojiButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(0.5),
  margin: theme.spacing(0.5),
  fontSize: '1.2rem',
}));

/**
 * Custom Status Component
 * Allows users to set and display custom status messages with emojis
 */
const CustomStatus = () => {
  const { user, setUser } = useAuth();
  const { socket } = useSocket();
  
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emojiMenuAnchor, setEmojiMenuAnchor] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  
  // Fetch current status on component mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get('/api/status');
        if (response.data) {
          setCurrentStatus(response.data);
          
          // If user has a custom status, populate the form
          if (response.data.status === 'custom') {
            setStatusMessage(response.data.statusMessage || '');
            setSelectedEmoji(response.data.statusEmoji || null);
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };
    
    fetchStatus();
  }, []);
  
  // Handle emoji menu open
  const handleEmojiMenuOpen = (event) => {
    setEmojiMenuAnchor(event.currentTarget);
  };
  
  // Handle emoji menu close
  const handleEmojiMenuClose = () => {
    setEmojiMenuAnchor(null);
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    handleEmojiMenuClose();
  };
  
  // Handle status message change
  const handleStatusMessageChange = (e) => {
    // Limit to 100 characters
    if (e.target.value.length <= 100) {
      setStatusMessage(e.target.value);
    }
  };
  
  // Clear emoji selection
  const handleClearEmoji = () => {
    setSelectedEmoji(null);
  };
  
  // Set custom status
  const handleSetCustomStatus = async () => {
    if (!statusMessage.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/api/status/custom', {
        statusMessage: statusMessage.trim(),
        emoji: selectedEmoji
      });
      
      setCurrentStatus(response.data);
      
      // Update user context
      if (user) {
        setUser({
          ...user,
          status: 'custom',
          statusMessage: statusMessage.trim(),
          statusEmoji: selectedEmoji
        });
      }
      
      // Reset form
      setStatusMessage('');
      setSelectedEmoji(null);
      
    } catch (error) {
      console.error('Error setting custom status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Clear custom status
  const handleClearCustomStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.delete('/api/status/custom', {
        data: { newStatus: 'online' }
      });
      
      setCurrentStatus(response.data);
      
      // Update user context
      if (user) {
        setUser({
          ...user,
          status: 'online',
          statusMessage: null,
          statusEmoji: null
        });
      }
      
      // Reset form
      setStatusMessage('');
      setSelectedEmoji(null);
      
    } catch (error) {
      console.error('Error clearing custom status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Current Status Display */}
      {currentStatus && currentStatus.status === 'custom' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Current Status:
          </Typography>
          <StatusChip
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {currentStatus.statusEmoji && (
                  <span style={{ marginRight: 8 }}>{currentStatus.statusEmoji}</span>
                )}
                {currentStatus.statusMessage}
              </Box>
            }
            onDelete={handleClearCustomStatus}
            deleteIcon={<ClearIcon />}
          />
        </Box>
      )}
      
      {/* Status Form */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="What's your status?"
          value={statusMessage}
          onChange={handleStatusMessageChange}
          InputProps={{
            startAdornment: selectedEmoji && (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>{selectedEmoji}</span>
                <IconButton size="small" onClick={handleClearEmoji}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
            ),
          }}
          sx={{ mr: 1 }}
        />
        <Tooltip title="Add emoji">
          <IconButton 
            color="primary" 
            onClick={handleEmojiMenuOpen}
            disabled={loading}
          >
            <EmojiEmotionsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Set status">
          <IconButton 
            color="primary" 
            onClick={handleSetCustomStatus}
            disabled={loading || !statusMessage.trim()}
          >
            {loading ? <CircularProgress size={24} /> : <CheckIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Character count */}
      <Typography variant="caption" color="textSecondary">
        {statusMessage.length}/100 characters
      </Typography>
      
      {/* Emoji Menu */}
      <Menu
        anchorEl={emojiMenuAnchor}
        open={Boolean(emojiMenuAnchor)}
        onClose={handleEmojiMenuClose}
      >
        <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', maxWidth: 250 }}>
          {COMMON_EMOJIS.map((item) => (
            <Tooltip key={item.name} title={item.name}>
              <EmojiButton onClick={() => handleEmojiSelect(item.emoji)}>
                {item.emoji}
              </EmojiButton>
            </Tooltip>
          ))}
        </Box>
      </Menu>
    </Box>
  );
};

export default CustomStatus;
