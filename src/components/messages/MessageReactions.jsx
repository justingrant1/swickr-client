import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Chip, IconButton, Tooltip, Badge, Typography } from '@mui/material';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import { useAuth } from '../../contexts/AuthContext';
import ReactionPicker from './ReactionPicker';
import performanceService from '../../services/performanceService';

// Common emoji reactions
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🎉', '🙏', '🔥'];

/**
 * MessageReactions Component
 * 
 * Displays and manages reactions for a message
 */
const MessageReactions = React.memo(({ messageId, initialReactions, onAddReaction, onRemoveReaction }) => {
  const [reactionCounts, setReactionCounts] = useState(initialReactions.reactionCounts || {});
  const [userReactions, setUserReactions] = useState(initialReactions.userReactions || []);
  const [showPicker, setShowPicker] = useState(false);
  const pickerAnchorRef = useRef(null);
  
  const { user } = useAuth();
  const renderStartTime = useRef(performance.now());
  
  // Update local state when initialReactions changes
  useEffect(() => {
    setReactionCounts(initialReactions.reactionCounts || {});
    setUserReactions(initialReactions.userReactions || []);
  }, [initialReactions]);
  
  // Track component render time
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    // Track render time
    performanceService.trackRenderTime('reactions', messageId, renderTime);
    
    // Reset render start time for next render
    renderStartTime.current = performance.now();
    
    // Track active reaction count
    const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
    performanceService.trackActiveReactionCount(messageId, totalReactions);
  }, [messageId, reactionCounts]);
  
  // Handle adding a reaction
  const handleAddReaction = useCallback((emoji) => {
    const startTime = performance.now();
    
    // Don't add if user already reacted with this emoji
    if (userReactions.includes(emoji)) {
      return;
    }
    
    // Track optimistic update
    performanceService.trackOptimisticUpdate(true);
    
    // Update state optimistically
    setReactionCounts(prevCounts => ({
      ...prevCounts,
      [emoji]: (prevCounts[emoji] || 0) + 1
    }));
    
    setUserReactions(prev => [...prev, emoji]);
    
    // Close picker
    setShowPicker(false);
    
    // Call container's add handler
    onAddReaction(emoji);
    
    const endTime = performance.now();
    performanceService.trackOperationTime('reactionAdd', endTime - startTime);
  }, [messageId, userReactions, onAddReaction]);
  
  // Handle removing a reaction
  const handleRemoveReaction = useCallback((emoji) => {
    const startTime = performance.now();
    
    // Don't remove if user hasn't reacted with this emoji
    if (!userReactions.includes(emoji)) {
      return;
    }
    
    // Track optimistic update
    performanceService.trackOptimisticUpdate(true);
    
    // Update state optimistically
    setReactionCounts(prevCounts => {
      const newCounts = { ...prevCounts };
      if (newCounts[emoji] > 1) {
        newCounts[emoji]--;
      } else {
        delete newCounts[emoji];
      }
      return newCounts;
    });
    
    setUserReactions(prev => prev.filter(r => r !== emoji));
    
    // Call container's remove handler
    onRemoveReaction(emoji);
    
    const endTime = performance.now();
    performanceService.trackOperationTime('reactionRemove', endTime - startTime);
  }, [messageId, userReactions, onRemoveReaction]);
  
  // Toggle reaction (add or remove)
  const handleToggleReaction = useCallback((emoji) => {
    if (userReactions.includes(emoji)) {
      handleRemoveReaction(emoji);
    } else {
      handleAddReaction(emoji);
    }
  }, [userReactions, handleAddReaction, handleRemoveReaction]);
  
  // Open reaction picker
  const handleOpenPicker = useCallback(() => {
    setShowPicker(true);
  }, []);
  
  // Close reaction picker
  const handleClosePicker = useCallback(() => {
    setShowPicker(false);
  }, []);
  
  // Memoize sorted reactions for rendering
  const sortedReactions = useMemo(() => {
    const startTime = performance.now();
    
    // Sort by count (descending) and then by emoji
    const sorted = Object.entries(reactionCounts)
      .sort(([emojiA, countA], [emojiB, countB]) => {
        if (countA !== countB) {
          return countB - countA;
        }
        return emojiA.localeCompare(emojiB);
      })
      .map(([emoji, count]) => ({ emoji, count }));
    
    const endTime = performance.now();
    console.debug(`Sorted ${sorted.length} reactions in ${(endTime - startTime).toFixed(2)}ms`);
    
    return sorted;
  }, [reactionCounts]);
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
      {sortedReactions.map(({ emoji, count }) => (
        <Chip
          key={emoji}
          label={`${emoji} ${count}`}
          size="small"
          onClick={() => handleToggleReaction(emoji)}
          color={userReactions.includes(emoji) ? "primary" : "default"}
          sx={{
            borderRadius: '16px',
            height: '28px',
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />
      ))}
      
      <Box ref={pickerAnchorRef} sx={{ display: 'inline-flex' }}>
        <Tooltip title="Add reaction">
          <IconButton
            size="small"
            onClick={handleOpenPicker}
            aria-label="add reaction"
            sx={{
              color: 'text.secondary',
              height: '28px',
              width: '28px',
              '&:hover': {
                color: '#6200ee',
                backgroundColor: 'rgba(98, 0, 238, 0.04)',
              },
            }}
          >
            <AddReactionIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {showPicker && (
        <ReactionPicker
          onSelect={handleAddReaction}
          onClose={handleClosePicker}
          commonEmojis={COMMON_EMOJIS}
          userReactions={userReactions}
        />
      )}
    </Box>
  );
});

MessageReactions.propTypes = {
  messageId: PropTypes.string.isRequired,
  initialReactions: PropTypes.shape({
    reactionCounts: PropTypes.object,
    userReactions: PropTypes.array
  }),
  onAddReaction: PropTypes.func.isRequired,
  onRemoveReaction: PropTypes.func.isRequired
};

MessageReactions.defaultProps = {
  initialReactions: {
    reactionCounts: {},
    userReactions: []
  }
};

export default MessageReactions;
