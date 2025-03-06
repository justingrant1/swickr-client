import React, { useState, useEffect } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LockIcon from '@mui/icons-material/Lock';
import presenceService from '../../services/presenceService';

// Styled components for status indicators
const StatusContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginLeft: theme.spacing(0.5),
}));

/**
 * MessageStatus Component
 * 
 * Displays the current status of a message (sending, sent, delivered, read, failed)
 * with appropriate icons and colors
 * 
 * @param {Object} props - Component props
 * @param {string} props.messageId - Message ID to display status for
 * @param {boolean} props.isEncrypted - Whether the message is encrypted
 * @param {string} props.size - Size of the icon (small, medium, large)
 * @param {Object} props.sx - Additional styles
 */
const MessageStatus = ({ 
  messageId, 
  isEncrypted = false,
  size = 'small', 
  sx = {} 
}) => {
  const [status, setStatus] = useState(null);
  const [tooltipText, setTooltipText] = useState('');

  // Size mappings
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  };

  // Get icon size based on prop
  const iconSize = sizeMap[size] || sizeMap.small;

  useEffect(() => {
    // Get initial status
    const messageStatus = presenceService.getMessageStatus(messageId);
    if (messageStatus) {
      setStatus(messageStatus.status);
      updateTooltipText(messageStatus.status, messageStatus.timestamp);
    } else {
      // Default to sending if no status found
      setStatus(presenceService.DELIVERY_STATUS.SENDING);
      setTooltipText('Sending...');
    }

    // Subscribe to status changes
    const unsubscribe = presenceService.subscribeToMessageStatusChanges((id, newStatus, userId) => {
      if (id === messageId) {
        setStatus(newStatus);
        updateTooltipText(newStatus);
      }
    });

    return () => {
      // Unsubscribe when component unmounts
      unsubscribe();
    };
  }, [messageId]);

  // Update tooltip text based on status
  const updateTooltipText = (status) => {
    switch (status) {
      case presenceService.DELIVERY_STATUS.SENDING:
        setTooltipText('Sending...');
        break;
      case presenceService.DELIVERY_STATUS.SENT:
        setTooltipText('Sent');
        break;
      case presenceService.DELIVERY_STATUS.DELIVERED:
        setTooltipText('Delivered');
        break;
      case presenceService.DELIVERY_STATUS.READ:
        setTooltipText('Read');
        break;
      case presenceService.DELIVERY_STATUS.FAILED:
        setTooltipText('Failed to send. Tap to retry.');
        break;
      default:
        setTooltipText('');
    }
  };

  // Render appropriate icon based on status
  const renderStatusIcon = () => {
    const iconProps = {
      sx: { 
        width: iconSize, 
        height: iconSize,
        verticalAlign: 'middle'
      }
    };

    switch (status) {
      case presenceService.DELIVERY_STATUS.SENDING:
        return <AccessTimeIcon {...iconProps} sx={{ ...iconProps.sx, color: '#bdbdbd' }} />;
      case presenceService.DELIVERY_STATUS.SENT:
        return <DoneIcon {...iconProps} sx={{ ...iconProps.sx, color: '#8c8c8c' }} />;
      case presenceService.DELIVERY_STATUS.DELIVERED:
        return <DoneAllIcon {...iconProps} sx={{ ...iconProps.sx, color: '#8c8c8c' }} />;
      case presenceService.DELIVERY_STATUS.READ:
        return <DoneAllIcon {...iconProps} sx={{ ...iconProps.sx, color: '#0284c7' }} />;
      case presenceService.DELIVERY_STATUS.FAILED:
        return <ErrorOutlineIcon {...iconProps} sx={{ ...iconProps.sx, color: '#f44336' }} />;
      default:
        return null;
    }
  };

  return (
    <StatusContainer sx={{ ...sx }}>
      <Tooltip title={tooltipText} arrow>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderStatusIcon()}
          
          {/* Show encryption icon if message is encrypted */}
          {isEncrypted && (
            <Tooltip title="End-to-end encrypted" arrow>
              <LockIcon 
                sx={{ 
                  width: iconSize * 0.8, 
                  height: iconSize * 0.8, 
                  ml: 0.5,
                  color: '#8c8c8c'
                }} 
              />
            </Tooltip>
          )}
        </Box>
      </Tooltip>
    </StatusContainer>
  );
};

export default MessageStatus;
