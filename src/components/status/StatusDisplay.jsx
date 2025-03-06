import React from 'react';
import { Box, Typography, Tooltip, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Status color mapping
const STATUS_COLORS = {
  online: '#4caf50', // Green
  away: '#ff9800',   // Orange
  busy: '#f44336',   // Red
  offline: '#9e9e9e', // Grey
  custom: '#6200ee'  // Purple (primary color)
};

// Styled components
const StatusBadge = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.offline,
    color: STATUS_COLORS[status] || STATUS_COLORS.offline,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      content: '""',
    },
  },
}));

const StatusIcon = styled(FiberManualRecordIcon)(({ theme, status }) => ({
  fontSize: '0.75rem',
  color: STATUS_COLORS[status] || STATUS_COLORS.offline,
  marginRight: theme.spacing(0.5),
}));

/**
 * Status Display Component
 * Displays a user's status with appropriate colors and icons
 * 
 * @param {Object} props
 * @param {string} props.status - User status (online, away, busy, offline, custom)
 * @param {string} props.statusMessage - Custom status message (optional)
 * @param {string} props.statusEmoji - Custom status emoji (optional)
 * @param {string} props.variant - Display variant ('badge', 'icon', or 'text')
 * @param {Object} props.badgeProps - Props to pass to the Badge component
 * @param {React.ReactNode} props.children - Children to display with badge
 */
const StatusDisplay = ({ 
  status = 'offline', 
  statusMessage, 
  statusEmoji, 
  variant = 'badge', 
  badgeProps = {},
  children 
}) => {
  // Get status text
  const getStatusText = () => {
    if (status === 'custom' && statusMessage) {
      return statusMessage;
    }
    
    const statusMap = {
      online: 'Online',
      away: 'Away',
      busy: 'Do not disturb',
      offline: 'Offline',
      custom: 'Custom'
    };
    
    return statusMap[status] || 'Offline';
  };
  
  // Get tooltip text
  const getTooltipText = () => {
    if (status === 'custom' && statusMessage) {
      return `${statusEmoji || ''} ${statusMessage}`.trim();
    }
    return getStatusText();
  };
  
  // Render based on variant
  switch (variant) {
    case 'badge':
      return (
        <Tooltip title={getTooltipText()}>
          <StatusBadge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            status={status}
            {...badgeProps}
          >
            {children}
          </StatusBadge>
        </Tooltip>
      );
      
    case 'icon':
      return (
        <Tooltip title={getTooltipText()}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StatusIcon status={status} />
            {status === 'custom' && statusEmoji && (
              <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
                {statusEmoji}
              </Typography>
            )}
            <Typography variant="body2" component="span">
              {getStatusText()}
            </Typography>
          </Box>
        </Tooltip>
      );
      
    case 'text':
      return (
        <Tooltip title={getTooltipText()}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {status === 'custom' && statusEmoji ? (
              <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
                {statusEmoji}
              </Typography>
            ) : (
              <StatusIcon status={status} />
            )}
            <Typography 
              variant="body2" 
              component="span"
              sx={{ 
                color: status === 'custom' ? 'text.primary' : STATUS_COLORS[status],
                fontWeight: status === 'custom' ? 500 : 400
              }}
            >
              {getStatusText()}
            </Typography>
          </Box>
        </Tooltip>
      );
      
    default:
      return null;
  }
};

export default StatusDisplay;
