import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

/**
 * NotificationBell Component
 * 
 * Displays a notification bell in the header with a badge for unread notifications
 * and a dropdown menu to view and manage notifications
 */
const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    settings
  } = useNotifications();
  
  // Handle notification menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle notification menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'new_message' && notification.data?.conversationId) {
      navigate(`/conversations/${notification.data.conversationId}`);
    } else if (notification.type === 'friend_request' && notification.data?.userId) {
      navigate(`/contacts`);
    } else if (notification.type === 'status_update' && notification.data?.userId) {
      navigate(`/contacts`);
    }
    
    handleMenuClose();
  };
  
  // Handle settings click
  const handleSettingsClick = () => {
    navigate('/settings/notifications');
    handleMenuClose();
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <MessageIcon fontSize="small" color="primary" />;
      case 'friend_request':
        return <PersonAddIcon fontSize="small" color="secondary" />;
      case 'status_update':
        return <CircleIcon fontSize="small" color="success" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };
  
  // Format notification time
  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };
  
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ mr: 1 }}
          aria-controls="notification-menu"
          aria-haspopup="true"
        >
          <Badge badgeContent={unreadCount} color="error">
            {settings?.enabled ? (
              unreadCount > 0 ? (
                <NotificationsActiveIcon />
              ) : (
                <NotificationsIcon />
              )
            ) : (
              <NotificationsOffIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 4,
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: 'auto',
            borderRadius: 2,
            mt: 1.5,
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              onClick={markAllAsRead}
              sx={{ fontSize: '0.75rem' }}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': {
                  backgroundColor: notification.read ? 'action.hover' : 'action.selected',
                },
              }}
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: notification.read ? 400 : 600,
                      color: notification.read ? 'text.primary' : 'text.primary',
                    }}
                  >
                    {notification.title || 'New notification'}
                  </Typography>
                }
                secondary={
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        color: 'text.secondary',
                        mb: 0.5,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {notification.body || ''}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        color: 'text.disabled',
                        fontSize: '0.7rem'
                      }}
                    >
                      {formatNotificationTime(notification.created_at)}
                    </Typography>
                  </Box>
                }
              />
              {!notification.read && (
                <Box sx={{ ml: 1 }}>
                  <CheckCircleIcon 
                    fontSize="small" 
                    color="disabled" 
                    sx={{ 
                      opacity: 0.5,
                      fontSize: '0.875rem'
                    }} 
                  />
                </Box>
              )}
            </MenuItem>
          ))
        )}
        
        {notifications.length > 5 && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Button 
              size="small" 
              onClick={() => {
                navigate('/settings/notifications');
                handleMenuClose();
              }}
            >
              View all
            </Button>
          </Box>
        )}
        
        <Divider />
        
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Notification settings" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBell;
