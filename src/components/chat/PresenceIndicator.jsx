import React, { useState, useEffect } from 'react';
import { Box, Tooltip, Badge, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import presenceService from '../../services/presenceService';

// Styled components for presence indicators
const StyledBadge = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: status === 'online' 
      ? '#44b700' 
      : status === 'away' 
        ? '#ff9800' 
        : status === 'busy' 
          ? '#f44336' 
          : '#bdbdbd',
    color: status === 'online' 
      ? '#44b700' 
      : status === 'away' 
        ? '#ff9800' 
        : status === 'busy' 
          ? '#f44336' 
          : '#bdbdbd',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': status === 'online' ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    } : {},
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

/**
 * PresenceIndicator Component
 * 
 * Displays a user's online status with appropriate color and animation
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID to display presence for
 * @param {Object} props.user - User object (optional, will be fetched if not provided)
 * @param {string} props.size - Size of the avatar (small, medium, large)
 * @param {boolean} props.showAvatar - Whether to show the user's avatar
 * @param {boolean} props.showDot - Whether to show just the status dot without avatar
 * @param {Object} props.sx - Additional styles
 */
const PresenceIndicator = ({ 
  userId, 
  user = null,
  size = 'medium', 
  showAvatar = true,
  showDot = false,
  sx = {} 
}) => {
  const [status, setStatus] = useState('offline');
  const [lastActive, setLastActive] = useState(null);
  const [tooltipText, setTooltipText] = useState('');

  // Size mappings
  const sizeMap = {
    small: { avatar: 24, badge: 8 },
    medium: { avatar: 40, badge: 12 },
    large: { avatar: 56, badge: 16 }
  };

  // Get avatar size based on prop
  const avatarSize = sizeMap[size]?.avatar || sizeMap.medium.avatar;
  const badgeSize = sizeMap[size]?.badge || sizeMap.medium.badge;

  useEffect(() => {
    // Get initial status
    const userStatus = presenceService.getUserStatus(userId);
    if (userStatus) {
      setStatus(userStatus.status);
      setLastActive(userStatus.lastActive);
      updateTooltipText(userStatus.status, userStatus.lastActive);
    }

    // Subscribe to status changes
    const unsubscribe = presenceService.subscribeToStatusChanges((id, newStatus, newLastActive) => {
      if (id === userId) {
        setStatus(newStatus);
        setLastActive(newLastActive);
        updateTooltipText(newStatus, newLastActive);
      }
    });

    return () => {
      // Unsubscribe when component unmounts
      unsubscribe();
    };
  }, [userId]);

  // Update tooltip text based on status and last active time
  const updateTooltipText = (status, lastActive) => {
    if (status === 'online') {
      setTooltipText('Online');
    } else if (status === 'away') {
      setTooltipText('Away');
    } else if (status === 'busy') {
      setTooltipText('Busy - Do not disturb');
    } else if (lastActive) {
      // Format last active time
      const lastActiveDate = new Date(lastActive);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
      
      if (diffMinutes < 1) {
        setTooltipText('Last seen just now');
      } else if (diffMinutes < 60) {
        setTooltipText(`Last seen ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`);
      } else if (diffMinutes < 24 * 60) {
        const hours = Math.floor(diffMinutes / 60);
        setTooltipText(`Last seen ${hours} hour${hours === 1 ? '' : 's'} ago`);
      } else {
        const days = Math.floor(diffMinutes / (24 * 60));
        setTooltipText(`Last seen ${days} day${days === 1 ? '' : 's'} ago`);
      }
    } else {
      setTooltipText('Offline');
    }
  };

  // Just show the dot if requested
  if (showDot) {
    return (
      <Tooltip title={tooltipText} arrow>
        <Box
          sx={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            backgroundColor: status === 'online' 
              ? '#44b700' 
              : status === 'away' 
                ? '#ff9800' 
                : status === 'busy' 
                  ? '#f44336' 
                  : '#bdbdbd',
            boxShadow: `0 0 0 2px #fff`,
            ...sx
          }}
        />
      </Tooltip>
    );
  }

  // Show avatar with status badge
  if (showAvatar) {
    return (
      <Tooltip title={tooltipText} arrow>
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          status={status}
          sx={{ ...sx }}
        >
          <Avatar 
            src={user?.avatarUrl} 
            alt={user?.displayName || user?.username || 'User'} 
            sx={{ width: avatarSize, height: avatarSize }}
          >
            {!user?.avatarUrl && (user?.displayName?.[0] || user?.username?.[0] || 'U')}
          </Avatar>
        </StyledBadge>
      </Tooltip>
    );
  }

  // Default - just return empty box
  return null;
};

export default PresenceIndicator;
