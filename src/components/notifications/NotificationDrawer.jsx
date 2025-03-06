import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

/**
 * NotificationDrawer Component
 * 
 * Displays a drawer with notifications and actions
 */
const NotificationDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();
  
  const [processingIds, setProcessingIds] = useState([]);
  
  // Format notification time
  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      setProcessingIds(prev => [...prev, notification.id]);
      try {
        await markAsRead(notification.id);
      } finally {
        setProcessingIds(prev => prev.filter(id => id !== notification.id));
      }
    }
    
    // Navigate based on notification type and data
    if (notification.data?.url) {
      onClose();
      navigate(notification.data.url);
    }
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  // Handle delete notification
  const handleDeleteNotification = async (event, id) => {
    event.stopPropagation();
    setProcessingIds(prev => [...prev, id]);
    try {
      await deleteNotification(id);
    } finally {
      setProcessingIds(prev => prev.filter(procId => procId !== id));
    }
  };
  
  // Navigate to settings
  const handleNavigateToSettings = () => {
    onClose();
    navigate('/notifications/settings');
  };
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Notifications</Typography>
        <Box>
          <Tooltip title="Notification Settings">
            <IconButton onClick={handleNavigateToSettings} size="small" sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          size="small" 
          onClick={refreshNotifications}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          Refresh
        </Button>
        
        <Button 
          size="small" 
          onClick={handleMarkAllAsRead}
          disabled={loading || notifications.every(n => n.read)}
          startIcon={<CheckCircleIcon fontSize="small" />}
        >
          Mark All Read
        </Button>
      </Box>
      
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No notifications to display
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    py: 1.5,
                  }}
                  disabled={processingIds.includes(notification.id)}
                >
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: notification.read ? 400 : 600,
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {notification.body}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatNotificationTime(notification.created_at)}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {processingIds.includes(notification.id) ? (
                      <CircularProgress size={20} />
                    ) : (
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationDrawer;
