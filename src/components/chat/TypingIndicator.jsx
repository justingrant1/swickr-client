import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Keyframes for the typing animation
const bounce = keyframes`
  0%, 80%, 100% { 
    transform: translateY(0);
  }
  40% { 
    transform: translateY(-5px);
  }
`;

// Styled components for typing indicators
const TypingDot = styled('span')(({ theme, delay }) => ({
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  display: 'inline-block',
  width: '8px',
  height: '8px',
  marginRight: '3px',
  animation: `${bounce} 1.4s infinite ease-in-out`,
  animationDelay: `${delay}s`,
}));

const TypingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(1),
  maxWidth: '150px',
}));

/**
 * TypingIndicator Component
 * 
 * Displays an animated typing indicator with username
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isTyping - Whether typing indicator should be shown
 * @param {string} props.username - Username of the person typing
 * @param {Object} props.sx - Additional styles
 */
const TypingIndicator = ({ 
  isTyping, 
  username = '', 
  sx = {} 
}) => {
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    // If typing starts, show indicator and clear any existing timer
    if (isTyping) {
      setVisible(true);
      
      if (timer) {
        clearTimeout(timer);
        setTimer(null);
      }
    } 
    // If typing stops, set a timer to hide the indicator after a delay
    else if (visible) {
      const newTimer = setTimeout(() => {
        setVisible(false);
      }, 1500); // Hide after 1.5 seconds of no typing
      
      setTimer(newTimer);
      
      // Clean up timer on unmount
      return () => {
        if (newTimer) {
          clearTimeout(newTimer);
        }
      };
    }
  }, [isTyping, visible]);

  // Don't render anything if not typing and not visible
  if (!visible) {
    return null;
  }

  return (
    <TypingContainer sx={{ ...sx }}>
      {username && (
        <Typography 
          variant="caption" 
          color="textSecondary" 
          sx={{ mr: 1, fontWeight: 'medium' }}
        >
          {username}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TypingDot delay={0} />
        <TypingDot delay={0.2} />
        <TypingDot delay={0.4} />
      </Box>
    </TypingContainer>
  );
};

export default TypingIndicator;
