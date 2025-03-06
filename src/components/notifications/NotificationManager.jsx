import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Switch, 
  FormControlLabel, 
  FormGroup, 
  Divider, 
  Alert, 
  CircularProgress,
  TextField,
  IconButton,
  Snackbar,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InfoIcon from '@mui/icons-material/Info';
import axios from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const SettingsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
}));

const SettingsTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
}));

/**
 * Convert time string to Date object
 * @param {string} timeStr - Time string in HH:MM:SS format
 * @returns {Date} - Date object
 */
const timeStringToDate = (timeStr) => {
  if (!timeStr) return new Date();
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  
  return date;
};

/**
 * Format Date object to time string
 * @param {Date} date - Date object
 * @returns {string} - Time string in HH:MM:SS format
 */
const formatTimeToString = (date) => {
  if (!date) return '00:00:00';
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:00`;
};

/**
 * NotificationManager Component
 * Manages push notification subscriptions and settings
 */
const NotificationManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Notification settings
  const [settings, setSettings] = useState({
    newMessage: true,
    messageReactions: true,
    groupInvites: true,
    statusUpdates: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: timeStringToDate('22:00:00'),
    quietHoursEnd: timeStringToDate('08:00:00')
  });
  
  // Check if push notifications are supported
  useEffect(() => {
    const checkNotificationSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setNotificationSupported(supported);
      
      if (supported) {
        // Check permission status
        setPermissionStatus(Notification.permission);
      }
    };
    
    checkNotificationSupport();
  }, []);
  
  // Load subscriptions and settings
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Load subscriptions
        const subsResponse = await axios.get('/api/notifications/subscriptions');
        setSubscriptions(subsResponse.data);
        setSubscribed(subsResponse.data.length > 0);
        
        // Load settings
        const settingsResponse = await axios.get('/api/notifications/settings');
        setSettings({
          ...settingsResponse.data,
          quietHoursStart: timeStringToDate(settingsResponse.data.quietHoursStart),
          quietHoursEnd: timeStringToDate(settingsResponse.data.quietHoursEnd)
        });
      } catch (error) {
        console.error('Error loading notification data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load notification settings',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  // Handle subscription to push notifications
  const handleSubscribe = useCallback(async () => {
    if (!notificationSupported) return;
    
    setSubscribing(true);
    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }
      
      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      
      // Get server's public key
      const response = await axios.get('/api/notifications/settings');
      const vapidPublicKey = response.data.vapidPublicKey || process.env.REACT_APP_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not available');
      }
      
      // Convert VAPID key to Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Send subscription to server
      await axios.post('/api/notifications/subscribe', {
        subscription: subscription.toJSON()
      });
      
      // Update state
      setSubscribed(true);
      const subsResponse = await axios.get('/api/notifications/subscriptions');
      setSubscriptions(subsResponse.data);
      
      setSnackbar({
        open: true,
        message: 'Successfully subscribed to push notifications',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setSnackbar({
        open: true,
        message: `Failed to subscribe: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSubscribing(false);
    }
  }, [notificationSupported]);
  
  // Handle unsubscription from push notifications
  const handleUnsubscribe = useCallback(async () => {
    setSubscribing(true);
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get push subscription
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();
        
        // Send unsubscribe request to server
        await axios.delete('/api/notifications/unsubscribe', {
          data: { endpoint: subscription.endpoint }
        });
      }
      
      // Update state
      setSubscribed(false);
      setSubscriptions([]);
      
      setSnackbar({
        open: true,
        message: 'Successfully unsubscribed from push notifications',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setSnackbar({
        open: true,
        message: 'Failed to unsubscribe',
        severity: 'error'
      });
    } finally {
      setSubscribing(false);
    }
  }, []);
  
  // Handle settings change
  const handleSettingChange = (setting) => (event) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked
    });
  };
  
  // Handle quiet hours time change
  const handleTimeChange = (setting) => (newValue) => {
    setSettings({
      ...settings,
      [setting]: newValue
    });
  };
  
  // Save notification settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // Format times to strings
      const formattedSettings = {
        ...settings,
        quietHoursStart: formatTimeToString(settings.quietHoursStart),
        quietHoursEnd: formatTimeToString(settings.quietHoursEnd)
      };
      
      // Send settings to server
      await axios.put('/api/notifications/settings', formattedSettings);
      
      setSnackbar({
        open: true,
        message: 'Notification settings saved',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      });
    } finally {
      setSavingSettings(false);
    }
  };
  
  // Send test notification
  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      await axios.post('/api/notifications/test');
      
      setSnackbar({
        open: true,
        message: 'Test notification sent',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send test notification',
        severity: 'error'
      });
    } finally {
      setTestingNotification(false);
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Helper function to convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Notification Settings
      </Typography>
      
      {/* Push Notification Support */}
      {!notificationSupported && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Push notifications are not supported in your browser.
        </Alert>
      )}
      
      {/* Permission Status */}
      {notificationSupported && permissionStatus === 'denied' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Notification permission is blocked. Please update your browser settings to allow notifications.
        </Alert>
      )}
      
      {/* Subscription Management */}
      <SettingsPaper elevation={2}>
        <SettingsTitle variant="h6">
          <NotificationsIcon />
          Push Notifications
        </SettingsTitle>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Push notifications allow you to receive alerts even when Swickr is not open in your browser.
          </Typography>
          
          {subscribed ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <NotificationsActiveIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                Push notifications are enabled ({subscriptions.length} device{subscriptions.length !== 1 ? 's' : ''})
              </Typography>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleUnsubscribe}
                disabled={subscribing}
                startIcon={subscribing ? <CircularProgress size={20} /> : <NotificationsOffIcon />}
              >
                Unsubscribe
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <NotificationsOffIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                Push notifications are disabled
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubscribe}
                disabled={!notificationSupported || subscribing || permissionStatus === 'denied'}
                startIcon={subscribing ? <CircularProgress size={20} color="inherit" /> : <NotificationsIcon />}
              >
                Subscribe
              </Button>
            </Box>
          )}
        </Box>
        
        {subscribed && (
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="outlined" 
              onClick={handleTestNotification}
              disabled={testingNotification}
              startIcon={testingNotification ? <CircularProgress size={20} /> : null}
            >
              Send Test Notification
            </Button>
          </Box>
        )}
      </SettingsPaper>
      
      {/* Notification Preferences */}
      <SettingsPaper elevation={2}>
        <SettingsTitle variant="h6">
          <InfoIcon />
          Notification Preferences
        </SettingsTitle>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch 
                checked={settings.newMessage} 
                onChange={handleSettingChange('newMessage')} 
                color="primary"
              />
            }
            label="New messages"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={settings.messageReactions} 
                onChange={handleSettingChange('messageReactions')} 
                color="primary"
              />
            }
            label="Message reactions"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={settings.groupInvites} 
                onChange={handleSettingChange('groupInvites')} 
                color="primary"
              />
            }
            label="Group chat invites"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={settings.statusUpdates} 
                onChange={handleSettingChange('statusUpdates')} 
                color="primary"
              />
            }
            label="Status updates"
          />
        </FormGroup>
        
        <Divider sx={{ my: 2 }} />
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch 
                checked={settings.soundEnabled} 
                onChange={handleSettingChange('soundEnabled')} 
                color="primary"
              />
            }
            label="Sound"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={settings.vibrationEnabled} 
                onChange={handleSettingChange('vibrationEnabled')} 
                color="primary"
              />
            }
            label="Vibration"
          />
        </FormGroup>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <FormControlLabel
            control={
              <Switch 
                checked={settings.quietHoursEnabled} 
                onChange={handleSettingChange('quietHoursEnabled')} 
                color="primary"
              />
            }
            label="Quiet hours"
          />
          
          {settings.quietHoursEnabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="From"
                  value={settings.quietHoursStart}
                  onChange={handleTimeChange('quietHoursStart')}
                  renderInput={(params) => <TextField {...params} size="small" sx={{ mr: 2 }} />}
                />
                <TimePicker
                  label="To"
                  value={settings.quietHoursEnd}
                  onChange={handleTimeChange('quietHoursEnd')}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
              </LocalizationProvider>
            </Box>
          )}
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            startIcon={savingSettings ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Save Settings
          </Button>
        </Box>
      </SettingsPaper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default NotificationManager;
