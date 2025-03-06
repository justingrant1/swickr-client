import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Badge,
  Tooltip,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockIcon from '@mui/icons-material/Lock';

import PresenceIndicator from './PresenceIndicator';
import EncryptedPresenceControls from './EncryptedPresenceControls';
import EncryptedPresenceStatus from './EncryptedPresenceStatus';

/**
 * Conversation Header Component
 * 
 * Displays the header of a conversation with user information,
 * presence indicators, and encrypted presence controls.
 */
const ConversationHeader = ({
  conversation,
  recipient,
  onBack,
  onMenuOpen,
  encryptionEnabled = false,
  encryptedFeatures = {
    readReceipts: false,
    typingIndicators: false,
    presenceUpdates: false
  }
}) => {
  const theme = useTheme();
  
  if (!conversation || !recipient) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 0,
          bgcolor: '#6200ee',
          color: 'white'
        }}
      >
        <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1">Loading...</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 0,
        bgcolor: '#6200ee',
        color: 'white'
      }}
    >
      <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <PresenceIndicator
            userId={recipient.id}
            status={recipient.status || 'offline'}
            size="small"
          />
        }
      >
        <Avatar
          src={recipient.avatar}
          alt={recipient.displayName || recipient.username}
          sx={{ width: 40, height: 40 }}
        >
          {(recipient.displayName || recipient.username || '?').charAt(0)}
        </Avatar>
      </Badge>
      
      <Box sx={{ ml: 2, flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {recipient.displayName || recipient.username}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {recipient.status || 'offline'}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {encryptionEnabled && (
          <Tooltip title="End-to-end encrypted">
            <LockIcon sx={{ fontSize: 20 }} />
          </Tooltip>
        )}
        
        <EncryptedPresenceStatus encryptedFeatures={encryptedFeatures} />
        
        <EncryptedPresenceControls conversationId={conversation.id} />
        
        <IconButton color="inherit" onClick={onMenuOpen}>
          <MoreVertIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ConversationHeader;
