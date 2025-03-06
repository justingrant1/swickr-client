import React, { useState, useEffect } from 'react';
import {
  Box,
  Tooltip,
  Typography,
  Badge,
  Chip,
  useTheme
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Encrypted Presence Status Component
 * 
 * Displays the current status of encrypted presence features in a conversation.
 * Provides visual feedback about which presence features are currently encrypted.
 */
const EncryptedPresenceStatus = ({ 
  encryptedFeatures = {
    readReceipts: false,
    typingIndicators: false,
    presenceUpdates: false
  }
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  // Count enabled features
  const enabledCount = Object.values(encryptedFeatures).filter(Boolean).length;
  const allEnabled = enabledCount === Object.keys(encryptedFeatures).length;
  const anyEnabled = enabledCount > 0;
  
  // Toggle details visibility
  const handleToggleDetails = () => {
    setShowDetails(prev => !prev);
  };
  
  // Get appropriate color based on enabled features
  const getStatusColor = () => {
    if (allEnabled) return theme.palette.primary.main;
    if (anyEnabled) return theme.palette.warning.main;
    return theme.palette.text.disabled;
  };
  
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <Tooltip
        title={
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Encrypted Presence Status
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1, opacity: encryptedFeatures.readReceipts ? 1 : 0.5 }} />
              <Typography variant="body2">
                Read Receipts: {encryptedFeatures.readReceipts ? 'Encrypted' : 'Not Encrypted'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <KeyboardIcon fontSize="small" sx={{ mr: 1, opacity: encryptedFeatures.typingIndicators ? 1 : 0.5 }} />
              <Typography variant="body2">
                Typing Indicators: {encryptedFeatures.typingIndicators ? 'Encrypted' : 'Not Encrypted'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon fontSize="small" sx={{ mr: 1, opacity: encryptedFeatures.presenceUpdates ? 1 : 0.5 }} />
              <Typography variant="body2">
                Presence Updates: {encryptedFeatures.presenceUpdates ? 'Encrypted' : 'Not Encrypted'}
              </Typography>
            </Box>
          </Box>
        }
        arrow
      >
        <Badge
          badgeContent={enabledCount}
          color="primary"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          invisible={!anyEnabled}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.6rem',
              height: '16px',
              minWidth: '16px',
            }
          }}
        >
          <Chip
            icon={<LockIcon fontSize="small" />}
            label={allEnabled ? "Fully Encrypted" : anyEnabled ? "Partially Encrypted" : "Not Encrypted"}
            size="small"
            variant={anyEnabled ? "filled" : "outlined"}
            color={allEnabled ? "primary" : anyEnabled ? "default" : "default"}
            sx={{ 
              color: getStatusColor(),
              borderColor: getStatusColor(),
              '& .MuiChip-icon': {
                color: getStatusColor()
              }
            }}
            onClick={handleToggleDetails}
          />
        </Badge>
      </Tooltip>
      
      {showDetails && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 10,
            mt: 1,
            p: 1.5,
            borderRadius: 1,
            boxShadow: 3,
            bgcolor: 'background.paper',
            width: 220
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Encrypted Presence Details
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <VisibilityIcon 
              fontSize="small" 
              sx={{ 
                mr: 1, 
                color: encryptedFeatures.readReceipts ? 'primary.main' : 'text.disabled' 
              }} 
            />
            <Typography variant="body2">
              Read Receipts
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <KeyboardIcon 
              fontSize="small" 
              sx={{ 
                mr: 1, 
                color: encryptedFeatures.typingIndicators ? 'primary.main' : 'text.disabled' 
              }} 
            />
            <Typography variant="body2">
              Typing Indicators
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon 
              fontSize="small" 
              sx={{ 
                mr: 1, 
                color: encryptedFeatures.presenceUpdates ? 'primary.main' : 'text.disabled' 
              }} 
            />
            <Typography variant="body2">
              Presence Updates
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EncryptedPresenceStatus;
