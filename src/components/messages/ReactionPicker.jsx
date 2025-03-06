import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Popover, Typography, Tooltip, Paper, Divider, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import performanceService from '../../services/performanceService';

const EmojiButton = ({ emoji, onClick, isSelected }) => {
  return (
    <Box
      onClick={() => onClick(emoji)}
      sx={{
        cursor: 'pointer',
        padding: '8px',
        fontSize: '1.5rem',
        borderRadius: '8px',
        transition: 'all 0.2s',
        backgroundColor: isSelected ? 'rgba(98, 0, 238, 0.1)' : 'transparent',
        border: isSelected ? '1px solid #6200ee' : '1px solid transparent',
        '&:hover': {
          backgroundColor: isSelected ? 'rgba(98, 0, 238, 0.15)' : 'rgba(0, 0, 0, 0.04)',
        },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '40px',
        height: '40px',
        margin: '4px',
      }}
      aria-label={`React with ${emoji}`}
    >
      {emoji}
    </Box>
  );
};

/**
 * ReactionPicker component for selecting emoji reactions
 */
const ReactionPicker = ({ onSelect, onClose, commonEmojis = [], userReactions = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmojis, setFilteredEmojis] = useState(commonEmojis);
  const renderStartTime = useRef(performance.now());
  const pickerRef = useRef(null);
  
  // Track component render time
  useEffect(() => {
    const renderEndTime = performance.now();
    performanceService.trackRenderTime('reactionPicker', 'picker', renderEndTime - renderStartTime.current);
    
    // Reset for next render
    renderStartTime.current = performance.now();
    
    // Handle click outside to close
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Filter emojis based on search query
  useEffect(() => {
    const searchStartTime = performance.now();
    
    if (!searchQuery) {
      setFilteredEmojis(commonEmojis);
    } else {
      // In a real app, we would have a more sophisticated search
      // For now, just filter based on exact match
      setFilteredEmojis(
        commonEmojis.filter(emoji => 
          emoji.includes(searchQuery)
        )
      );
    }
    
    const searchEndTime = performance.now();
    console.debug(`Emoji search took ${(searchEndTime - searchStartTime).toFixed(2)}ms`);
  }, [searchQuery, commonEmojis]);
  
  const handleEmojiSelect = (emoji) => {
    const selectStartTime = performance.now();
    
    onSelect(emoji);
    
    const selectEndTime = performance.now();
    console.debug(`Emoji selection processing took ${(selectEndTime - selectStartTime).toFixed(2)}ms`);
  };
  
  return (
    <Paper 
      ref={pickerRef}
      elevation={3}
      sx={{
        position: 'absolute',
        zIndex: 1300,
        width: 280,
        borderRadius: 2,
        mt: 1,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 1, backgroundColor: '#6200ee', color: 'white' }}>
        <Typography variant="subtitle2">
          Add Reaction
        </Typography>
      </Box>
      
      <Box sx={{ p: 1 }}>
        <TextField
          placeholder="Search emoji..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
      </Box>
      
      <Divider />
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'flex-start',
          p: 1,
          maxHeight: 200,
          overflowY: 'auto'
        }}
      >
        {filteredEmojis.map((emoji) => (
          <EmojiButton
            key={emoji}
            emoji={emoji}
            onClick={handleEmojiSelect}
            isSelected={userReactions.includes(emoji)}
          />
        ))}
        
        {filteredEmojis.length === 0 && (
          <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No emojis found
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

ReactionPicker.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  commonEmojis: PropTypes.arrayOf(PropTypes.string),
  userReactions: PropTypes.arrayOf(PropTypes.string)
};

export default ReactionPicker;
