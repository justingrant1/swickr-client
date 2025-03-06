import React, { useState, useEffect, forwardRef } from 'react';
import { 
  Snackbar, 
  Alert, 
  Typography, 
  Box, 
  IconButton 
} from '@mui/material';
import { 
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

/**
 * Custom Alert component for notification toasts
 */
const NotificationAlert = forwardRef((props, ref) => {
  const { notification, onClose, ...other } = props;
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Handle click on notification
  const handleClick = () => {
    if (notification?.data?.url) {
      navigate(notification.data.url);
    }
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <Alert
      ref={ref}
      variant="filled"
      icon={<NotificationsActiveIcon />}
      action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={onClose}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      }
      onClick={handleClick}
      sx={{
        width: '100%',
        cursor: 'pointer',
        backgroundColor: theme.palette.primary.main,
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
        }
      }}
      {...other}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {notification?.title || 'New Notification'}
        </Typography>
        <Typography variant="body2">
          {notification?.body || 'You have a new notification'}
        </Typography>
      </Box>
    </Alert>
  );
});

/**
 * NotificationToast Component
 * 
 * Displays toast notifications when push notifications are received
 */
const NotificationToast = () => {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  
  useEffect(() => {
    // Listen for push messages from service worker
    const handlePushMessage = (event) => {
      const newNotification = event.detail;
      setNotification(newNotification);
      setOpen(true);
    };
    
    // Add event listener for custom push message event
    window.addEventListener('push-notification', handlePushMessage);
    
    return () => {
      window.removeEventListener('push-notification', handlePushMessage);
    };
  }, []);
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <NotificationAlert 
        notification={notification} 
        onClose={handleClose} 
        severity="info"
      />
    </Snackbar>
  );
};

export default NotificationToast;
