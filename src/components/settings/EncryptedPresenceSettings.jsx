import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Divider,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import socketService from '../../services/socketService';
import encryptionService from '../../services/encryptionService';
import encryptedPresenceService from '../../services/encryptedPresenceService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component for managing encrypted presence and delivery status settings
 */
const EncryptedPresenceSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [encryptionAvailable, setEncryptionAvailable] = useState(false);
  const [settings, setSettings] = useState({
    encryptReadReceipts: false,
    encryptTypingIndicators: false,
    encryptPresenceUpdates: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check if encryption is available
  useEffect(() => {
    const checkEncryptionAvailability = async () => {
      try {
        setLoading(true);
        
        // Check if Web Crypto API is available
        const webCryptoAvailable = encryptionService.isWebCryptoAvailable();
        
        // Check if user has encryption keys
        const userKeys = localStorage.getItem('userKeys');
        const hasKeys = !!userKeys;
        
        setEncryptionAvailable(webCryptoAvailable && hasKeys);
        
        // If encryption is available, initialize encrypted presence service
        if (webCryptoAvailable && hasKeys && user) {
          const parsedKeys = JSON.parse(userKeys);
          encryptedPresenceService.init(parsedKeys, user.id);
          
          // Get current preferences from socket
          socketService.emit('get_encrypted_presence_preferences');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking encryption availability:', error);
        setError('Failed to check encryption availability');
        setLoading(false);
      }
    };
    
    checkEncryptionAvailability();
  }, [user]);
  
  // Listen for encrypted presence preferences
  useEffect(() => {
    const handleEncryptedPresencePreferences = (preferences) => {
      setSettings(preferences);
    };
    
    socketService.on('encrypted_presence_preferences', handleEncryptedPresencePreferences);
    
    return () => {
      socketService.off('encrypted_presence_preferences', handleEncryptedPresencePreferences);
    };
  }, []);
  
  // Handle settings change
  const handleSettingChange = (setting) => (event) => {
    const newSettings = {
      ...settings,
      [setting]: event.target.checked
    };
    
    setSettings(newSettings);
    
    // Save settings to server
    socketService.emit('encrypted_presence_preferences', newSettings);
    
    // Show success message
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };
  
  // Generate new encryption keys
  const handleGenerateKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate new key pair
      const keyPair = await encryptionService.generateKeyPair();
      
      // Store keys locally
      localStorage.setItem('userKeys', JSON.stringify(keyPair));
      
      // Update public key on server
      // Note: This requires an API endpoint to update the user's public key
      // await api.post('/users/update-public-key', { publicKey: keyPair.publicKey });
      
      // Initialize encrypted presence service with new keys
      encryptedPresenceService.init(keyPair, user.id);
      
      setEncryptionAvailable(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating encryption keys:', error);
      setError('Failed to generate encryption keys');
    } finally {
      setLoading(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ 
      mb: 3, 
      boxShadow: 3,
      borderRadius: 2,
      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1A2027' : '#fff'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LockIcon sx={{ color: '#6200ee', mr: 1 }} />
          <Typography variant="h6" component="h2">
            Encrypted Presence Settings
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Control how your presence information and message status are encrypted for enhanced privacy.
        </Typography>
        
        {!encryptionAvailable && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            End-to-end encryption is not available. You need to generate encryption keys.
            <Box sx={{ mt: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleGenerateKeys}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Encryption Keys'}
              </Button>
            </Box>
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Settings updated successfully
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.encryptReadReceipts}
              onChange={handleSettingChange('encryptReadReceipts')}
              disabled={!encryptionAvailable}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">Encrypt Read Receipts</Typography>
              <Typography variant="body2" color="text.secondary">
                Encrypt when you've read messages so only conversation participants can see
              </Typography>
            </Box>
          }
          sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.encryptTypingIndicators}
              onChange={handleSettingChange('encryptTypingIndicators')}
              disabled={!encryptionAvailable}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">Encrypt Typing Indicators</Typography>
              <Typography variant="body2" color="text.secondary">
                Encrypt when you're typing so only conversation participants can see
              </Typography>
            </Box>
          }
          sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.encryptPresenceUpdates}
              onChange={handleSettingChange('encryptPresenceUpdates')}
              disabled={!encryptionAvailable}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">Encrypt Presence Updates</Typography>
              <Typography variant="body2" color="text.secondary">
                Encrypt your online status so only your contacts can see
              </Typography>
            </Box>
          }
          sx={{ display: 'flex', alignItems: 'flex-start' }}
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          Note: Enabling encryption for presence features may slightly increase battery usage and network traffic.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default EncryptedPresenceSettings;
