import React from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';

/**
 * NotificationBadge Component
 * 
 * Displays a notification icon with a badge showing unread count
 * Used in the app header to provide quick access to notifications
 */
const NotificationBadge = ({ onClick }) => {
  const { unreadCount } = useNotifications();
  
  return (
    <Tooltip title="Notifications">
      <IconButton
        color="inherit"
        onClick={onClick}
        size="large"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          max={99}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default NotificationBadge;
