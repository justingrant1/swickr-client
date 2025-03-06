import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Switch,
  Typography,
  Divider,
  Badge
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyboardIcon from '@mui/icons-material/Keyboard';

import encryptedPresenceService from '../../services/encryptedPresenceService';

/**
 * Encrypted Presence Controls
 * 
 * A component that provides quick access to encrypted presence settings
 * directly from the conversation interface.
 */
const EncryptedPresenceControls = ({ conversationId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [preferences, setPreferences] = useState({
    encryptReadReceipts: true,
    encryptTypingIndicators: true,
    encryptPresenceUpdates: true
  });
  const [encryptionAvailable, setEncryptionAvailable] = useState(false);
  
  // Check if encryption is available and get current preferences
  useEffect(() => {
    const checkEncryption = () => {
      const available = encryptedPresenceService.isEncryptionAvailable();
      setEncryptionAvailable(available);
      
      if (available) {
        const prefs = encryptedPresenceService.getPreferences();
        setPreferences(prefs);
      }
    };
    
    checkEncryption();
    
    // Listen for preference changes
    const handlePreferenceUpdate = (prefs) => {
      setPreferences(prefs);
    };
    
    // Add event listener for preference updates
    window.addEventListener('encrypted_presence_preferences_updated', handlePreferenceUpdate);
    
    return () => {
      window.removeEventListener('encrypted_presence_preferences_updated', handlePreferenceUpdate);
    };
  }, []);
  
  // Handle menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle preference toggle
  const handleTogglePreference = async (preference) => {
    try {
      const newPreferences = {
        ...preferences,
        [preference]: !preferences[preference]
      };
      
      await encryptedPresenceService.updatePreferences(newPreferences);
      setPreferences(newPreferences);
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('encrypted_presence_preferences_updated', {
        detail: newPreferences
      }));
    } catch (error) {
      console.error(`Error updating ${preference}:`, error);
    }
  };
  
  // Get the count of enabled encryption features
  const getEnabledCount = () => {
    return Object.values(preferences).filter(Boolean).length;
  };
  
  // Determine the icon to use based on preferences
  const getEncryptionIcon = () => {
    const enabledCount = getEnabledCount();
    
    if (!encryptionAvailable) {
      return <LockOpenIcon color="disabled" />;
    }
    
    if (enabledCount === 0) {
      return <LockOpenIcon color="action" />;
    }
    
    if (enabledCount === Object.keys(preferences).length) {
      return <LockIcon color="primary" />;
    }
    
    return <LockIcon color="action" />;
  };
  
  return (
    <Box>
      <Tooltip title="Encrypted Presence Settings">
        <Badge
          badgeContent={getEnabledCount()}
          color="primary"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.5rem',
              height: '16px',
              minWidth: '16px',
            }
          }}
        >
          <IconButton
            onClick={handleMenuOpen}
            color={getEnabledCount() > 0 ? "primary" : "default"}
            disabled={!encryptionAvailable}
          >
            {getEncryptionIcon()}
          </IconButton>
        </Badge>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 250,
            borderRadius: 2,
            p: 1
          }
        }}
      >
        <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
          Encrypted Presence
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <VisibilityIcon sx={{ mr: 2, color: preferences.encryptReadReceipts ? 'primary.main' : 'text.disabled' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">
                Encrypt Read Receipts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hide when you read messages
              </Typography>
            </Box>
            <Switch
              checked={preferences.encryptReadReceipts}
              onChange={() => handleTogglePreference('encryptReadReceipts')}
              color="primary"
              size="small"
            />
          </Box>
        </MenuItem>
        
        <MenuItem sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <KeyboardIcon sx={{ mr: 2, color: preferences.encryptTypingIndicators ? 'primary.main' : 'text.disabled' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">
                Encrypt Typing Indicators
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hide when you're typing
              </Typography>
            </Box>
            <Switch
              checked={preferences.encryptTypingIndicators}
              onChange={() => handleTogglePreference('encryptTypingIndicators')}
              color="primary"
              size="small"
            />
          </Box>
        </MenuItem>
        
        <MenuItem sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <VisibilityOffIcon sx={{ mr: 2, color: preferences.encryptPresenceUpdates ? 'primary.main' : 'text.disabled' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">
                Encrypt Presence Updates
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hide your online status
              </Typography>
            </Box>
            <Switch
              checked={preferences.encryptPresenceUpdates}
              onChange={() => handleTogglePreference('encryptPresenceUpdates')}
              color="primary"
              size="small"
            />
          </Box>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Encrypted presence features protect your privacy by hiding your activity from anyone outside your conversations.
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default EncryptedPresenceControls;
