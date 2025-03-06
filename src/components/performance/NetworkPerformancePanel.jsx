import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import TimerIcon from '@mui/icons-material/Timer';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SpeedIcon from '@mui/icons-material/Speed';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

import performanceService from '../../services/performanceService';

/**
 * Network Performance Panel Component
 * 
 * Displays detailed metrics about network performance for encrypted presence features.
 */
const NetworkPerformancePanel = ({ autoRefresh = true, refreshInterval = 3000 }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    messageLatency: 0,
    presenceLatency: 0,
    uploadSpeed: 0,
    downloadSpeed: 0,
    packetLoss: 0,
    messagesSent: 0,
    messagesReceived: 0,
    presenceUpdatesPerSecond: 0,
    connectionQuality: 'good'
  });

  // Load metrics on mount and periodically
  useEffect(() => {
    // Initial load
    loadMetrics();
    
    // Set up interval for periodic updates if autoRefresh is enabled
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(loadMetrics, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Load network metrics
  const loadMetrics = () => {
    try {
      const networkMetrics = performanceService.getNetworkMetrics();
      setMetrics(networkMetrics);
    } catch (error) {
      console.error('Error loading network metrics:', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadMetrics();
  };

  // Get color based on latency
  const getLatencyColor = (latency) => {
    if (latency <= 100) return theme.palette.success.main;
    if (latency <= 300) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get color for packet loss
  const getPacketLossColor = (loss) => {
    if (loss <= 1) return theme.palette.success.main;
    if (loss <= 5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get connection quality icon
  const getConnectionQualityIcon = () => {
    switch (metrics.connectionQuality) {
      case 'excellent':
        return <SignalCellularAltIcon sx={{ color: theme.palette.success.main }} />;
      case 'good':
        return <SignalCellularAltIcon sx={{ color: theme.palette.info.main }} />;
      case 'fair':
        return <SignalCellularAltIcon sx={{ color: theme.palette.warning.main }} />;
      case 'poor':
        return <SignalCellularAltIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <SignalCellularAltIcon />;
    }
  };

  return (
    <Card 
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NetworkCheckIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Network Performance
          </Typography>
          
          <Tooltip title="Refresh metrics">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Summary Metrics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Message Latency
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getLatencyColor(metrics.messageLatency),
                  fontWeight: 'medium'
                }}
              >
                {metrics.messageLatency.toFixed(0)} ms
              </Typography>
              <TimerIcon 
                sx={{ 
                  mt: 1, 
                  color: getLatencyColor(metrics.messageLatency),
                  opacity: 0.7
                }} 
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Presence Latency
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getLatencyColor(metrics.presenceLatency),
                  fontWeight: 'medium'
                }}
              >
                {metrics.presenceLatency.toFixed(0)} ms
              </Typography>
              <TimerIcon 
                sx={{ 
                  mt: 1, 
                  color: getLatencyColor(metrics.presenceLatency),
                  opacity: 0.7
                }} 
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Packet Loss
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getPacketLossColor(metrics.packetLoss),
                  fontWeight: 'medium'
                }}
              >
                {metrics.packetLoss.toFixed(1)}%
              </Typography>
              <SpeedIcon 
                sx={{ 
                  mt: 1, 
                  color: getPacketLossColor(metrics.packetLoss),
                  opacity: 0.7
                }} 
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Connection Quality
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  textTransform: 'capitalize',
                  fontWeight: 'medium'
                }}
              >
                {metrics.connectionQuality}
              </Typography>
              {getConnectionQualityIcon()}
            </Paper>
          </Grid>
        </Grid>

        {/* Latency Stats */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Latency Statistics
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Message Latency:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getLatencyColor(metrics.messageLatency)
              }}
            >
              {metrics.messageLatency.toFixed(0)} ms
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.messageLatency / 500) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getLatencyColor(metrics.messageLatency) 
                },
                backgroundColor: `${getLatencyColor(metrics.messageLatency)}20`
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Presence Latency:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getLatencyColor(metrics.presenceLatency)
              }}
            >
              {metrics.presenceLatency.toFixed(0)} ms
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.presenceLatency / 500) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getLatencyColor(metrics.presenceLatency) 
                },
                backgroundColor: `${getLatencyColor(metrics.presenceLatency)}20`
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<CloudUploadIcon />} 
              label={`${metrics.uploadSpeed.toFixed(1)} KB/s Up`} 
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip 
              icon={<CloudDownloadIcon />} 
              label={`${metrics.downloadSpeed.toFixed(1)} KB/s Down`} 
              size="small"
              color="secondary"
              variant="outlined"
            />
            <Chip 
              icon={<SpeedIcon />} 
              label={`${metrics.packetLoss.toFixed(1)}% Loss`} 
              size="small"
              color={metrics.packetLoss <= 1 ? "success" : metrics.packetLoss <= 5 ? "warning" : "error"}
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Message Stats */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Message Statistics
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Messages Sent/Received
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CloudUploadIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Sent:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {metrics.messagesSent}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CloudDownloadIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Received:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {metrics.messagesReceived}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Presence Updates
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <SpeedIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Updates/sec:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {metrics.presenceUpdatesPerSecond.toFixed(1)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Performance Tips */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Network Performance Tips
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metrics.messageLatency > 300 ? (
              "High message latency detected. Consider optimizing network conditions or reducing encryption complexity."
            ) : metrics.packetLoss > 5 ? (
              "Significant packet loss detected. Check network stability and connection quality."
            ) : metrics.presenceUpdatesPerSecond > 10 ? (
              "High frequency of presence updates. Consider increasing debounce interval to reduce network load."
            ) : (
              "Network performance is within acceptable parameters for encrypted messaging."
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NetworkPerformancePanel;
