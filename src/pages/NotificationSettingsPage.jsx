import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Grid,
  Alert,
  IconButton,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
// Import date-fns for timestamp formatting
import { formatDistanceToNow } from 'date-fns';

/**
 * NotificationSettingsPage Component
 * 
 * Page for managing notification settings and viewing notification history
 */
const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    settings,
    loading,
    updateSettings,
    markAllAsRead,
    deleteNotification,
    pushEnabled,
    enablePushNotifications,
    disablePushNotifications,
    refreshNotifications
  } = useNotifications();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Update local settings when context settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  // Handle settings change
  const handleSettingChange = (event) => {
    const { name, checked, value } = event.target;
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings);
      setSnackbar({
        open: true,
        message: 'Notification settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save notification settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Toggle push notifications
  const handleTogglePushNotifications = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const result = await disablePushNotifications();
        if (result) {
          setSnackbar({
            open: true,
            message: 'Push notifications disabled',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to disable push notifications',
            severity: 'error'
          });
        }
      } else {
        const result = await enablePushNotifications();
        if (result) {
          setSnackbar({
            open: true,
            message: 'Push notifications enabled',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to enable push notifications. Please check browser permissions.',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while managing push notifications',
        severity: 'error'
      });
    } finally {
      setPushLoading(false);
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
  
  // Handle notification delete
  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setSnackbar({
        open: true,
        message: 'Notification deleted',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete notification',
        severity: 'error'
      });
    }
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setSnackbar({
        open: true,
        message: 'All notifications marked as read',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark notifications as read',
        severity: 'error'
      });
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          edge="start" 
          onClick={() => navigate('/settings')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Notification Settings
        </Typography>
      </Box>
      
      {/* Push Notifications */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsActiveIcon color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6">Push Notifications</Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Push notifications allow you to receive alerts even when Swickr is not open in your browser.
        </Alert>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>
            {pushEnabled ? 'Push notifications are enabled' : 'Push notifications are disabled'}
          </Typography>
          <Button 
            variant="contained" 
            color={pushEnabled ? 'error' : 'primary'}
            onClick={handleTogglePushNotifications}
            disabled={pushLoading}
            startIcon={pushLoading ? <CircularProgress size={20} /> : null}
          >
            {pushEnabled ? 'Disable' : 'Enable'}
          </Button>
        </Box>
      </Paper>
      
      {/* Notification Preferences */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6">Notification Preferences</Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={localSettings?.enabled}
              onChange={handleSettingChange}
              name="enabled"
              color="primary"
            />
          }
          label="Enable all notifications"
          sx={{ mb: 2, display: 'block' }}
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Notify me about:
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings?.newMessages}
                  onChange={handleSettingChange}
                  name="newMessages"
                  color="primary"
                  disabled={!localSettings?.enabled}
                />
              }
              label="New messages"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings?.mentions}
                  onChange={handleSettingChange}
                  name="mentions"
                  color="primary"
                  disabled={!localSettings?.enabled}
                />
              }
              label="Mentions"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings?.contactRequests}
                  onChange={handleSettingChange}
                  name="contactRequests"
                  color="primary"
                  disabled={!localSettings?.enabled}
                />
              }
              label="Contact requests"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings?.statusUpdates}
                  onChange={handleSettingChange}
                  name="statusUpdates"
                  color="primary"
                  disabled={!localSettings?.enabled}
                />
              }
              label="Status updates"
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings?.quietHoursEnabled}
                onChange={handleSettingChange}
                name="quietHoursEnabled"
                color="primary"
                disabled={!localSettings?.enabled}
              />
            }
            label="Enable quiet hours"
          />
          
          <Box 
            sx={{ 
              ml: 4, 
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <AccessTimeIcon color="action" />
            <TextField
              label="Start time"
              type="time"
              name="quietHoursStart"
              value={localSettings?.quietHoursStart}
              onChange={handleSettingChange}
              disabled={!localSettings?.enabled || !localSettings?.quietHoursEnabled}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5 min
              }}
              size="small"
              sx={{ width: 120 }}
            />
            <Typography variant="body2">to</Typography>
            <TextField
              label="End time"
              type="time"
              name="quietHoursEnd"
              value={localSettings?.quietHoursEnd}
              onChange={handleSettingChange}
              disabled={!localSettings?.enabled || !localSettings?.quietHoursEnabled}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5 min
              }}
              size="small"
              sx={{ width: 120 }}
            />
          </Box>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
      
      {/* Notification History */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6">Notification History</Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={refreshNotifications}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={handleMarkAllAsRead}
            disabled={loading || notifications.every(n => n.read)}
          >
            Mark All Read
          </Button>
        </Box>
        
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
          <List>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                  }}
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
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationSettingsPage;
