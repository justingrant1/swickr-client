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
  useTheme,
  Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import TimerIcon from '@mui/icons-material/Timer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';

import performanceService from '../../services/performanceService';
import workerService from '../../services/workerService';

/**
 * Encrypted Presence Performance Panel Component
 * 
 * Displays detailed metrics about encrypted presence performance,
 * focusing on end-to-end encryption for real-time presence indicators.
 */
const EncryptedPresencePanel = ({ autoRefresh = true, refreshInterval = 3000 }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    totalPresenceUpdates: 0,
    encryptionTimeAvg: 0,
    decryptionTimeAvg: 0,
    endToEndLatency: 0,
    activeUsers: 0,
    presenceUpdatesPerSecond: 0,
    batchEfficiency: 0,
    cacheHitRate: 0
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

  // Load encrypted presence metrics
  const loadMetrics = () => {
    try {
      // Get metrics from various services and combine them
      const networkMetrics = performanceService.getNetworkMetrics();
      const cacheMetrics = performanceService.getCacheMetrics();
      const batchMetrics = performanceService.getBatchMetrics();
      const workerMetrics = workerService.getMetrics();
      
      // Combine relevant metrics for encrypted presence
      setMetrics({
        totalPresenceUpdates: networkMetrics.messagesSent || 0,
        encryptionTimeAvg: cacheMetrics.averageEncryptionTime || 0,
        decryptionTimeAvg: cacheMetrics.averageDecryptionTime || 0,
        endToEndLatency: networkMetrics.presenceLatency || 0,
        activeUsers: Math.floor(Math.random() * 20) + 5, // Simulated for demo
        presenceUpdatesPerSecond: networkMetrics.presenceUpdatesPerSecond || 0,
        batchEfficiency: batchMetrics.batchEfficiencyGain || 0,
        cacheHitRate: cacheMetrics.cacheHitRate || 0
      });
    } catch (error) {
      console.error('Error loading encrypted presence metrics:', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadMetrics();
  };

  // Get color based on end-to-end latency (target: <500ms per Swickr specs)
  const getLatencyColor = (latency) => {
    if (latency <= 300) return theme.palette.success.main;
    if (latency <= 500) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get color for encryption time
  const getEncryptionTimeColor = (time) => {
    if (time <= 50) return theme.palette.success.main;
    if (time <= 100) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get color for cache hit rate
  const getCacheHitRateColor = (rate) => {
    if (rate >= 80) return theme.palette.success.main;
    if (rate >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
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
          <SecurityIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Encrypted Presence Performance
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
                End-to-End Latency
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getLatencyColor(metrics.endToEndLatency),
                  fontWeight: 'medium'
                }}
              >
                {metrics.endToEndLatency.toFixed(0)} ms
              </Typography>
              <TimerIcon 
                sx={{ 
                  mt: 1, 
                  color: getLatencyColor(metrics.endToEndLatency),
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
                Cache Hit Rate
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getCacheHitRateColor(metrics.cacheHitRate),
                  fontWeight: 'medium'
                }}
              >
                {metrics.cacheHitRate.toFixed(1)}%
              </Typography>
              <SpeedIcon 
                sx={{ 
                  mt: 1, 
                  color: getCacheHitRateColor(metrics.cacheHitRate),
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
                Updates/Second
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {metrics.presenceUpdatesPerSecond.toFixed(1)}
              </Typography>
              <VisibilityIcon sx={{ mt: 1, opacity: 0.7 }} />
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
                Active Users
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {metrics.activeUsers}
              </Typography>
              <PeopleIcon sx={{ mt: 1, opacity: 0.7 }} />
            </Paper>
          </Grid>
        </Grid>

        {/* Encryption Performance */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Encryption Performance
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Encryption Time:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getEncryptionTimeColor(metrics.encryptionTimeAvg)
              }}
            >
              {metrics.encryptionTimeAvg.toFixed(1)} ms
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.encryptionTimeAvg / 200) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getEncryptionTimeColor(metrics.encryptionTimeAvg) 
                },
                backgroundColor: `${getEncryptionTimeColor(metrics.encryptionTimeAvg)}20`
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Decryption Time:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getEncryptionTimeColor(metrics.decryptionTimeAvg)
              }}
            >
              {metrics.decryptionTimeAvg.toFixed(1)} ms
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.decryptionTimeAvg / 200) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getEncryptionTimeColor(metrics.decryptionTimeAvg) 
                },
                backgroundColor: `${getEncryptionTimeColor(metrics.decryptionTimeAvg)}20`
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<LockIcon />} 
              label={`${metrics.totalPresenceUpdates} Updates Encrypted`} 
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip 
              icon={<SpeedIcon />} 
              label={`${metrics.batchEfficiency.toFixed(1)}% Batch Efficiency`} 
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* End-to-End Performance */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            End-to-End Performance
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Total Latency:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getLatencyColor(metrics.endToEndLatency)
              }}
            >
              {metrics.endToEndLatency.toFixed(0)} ms
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.endToEndLatency / 500) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getLatencyColor(metrics.endToEndLatency) 
                },
                backgroundColor: `${getLatencyColor(metrics.endToEndLatency)}20`
              }}
            />
          </Box>
          
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              backgroundColor: `${theme.palette.info.light}10`,
              borderColor: theme.palette.info.light
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>Target:</strong> &lt;500ms end-to-end latency for encrypted presence updates
              {metrics.endToEndLatency <= 500 ? (
                <span style={{ color: theme.palette.success.main }}> ✓ Meeting target</span>
              ) : (
                <span style={{ color: theme.palette.error.main }}> ✗ Not meeting target</span>
              )}
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Performance Tips */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Performance Recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metrics.endToEndLatency > 500 ? (
              "End-to-end latency exceeds target. Consider enabling worker-based encryption and batch processing to improve performance."
            ) : metrics.cacheHitRate < 50 ? (
              "Low cache hit rate. Consider increasing cache size or adjusting TTL for encrypted presence data."
            ) : metrics.encryptionTimeAvg > 100 ? (
              "Encryption time is high. Enable web worker processing to move encryption operations off the main thread."
            ) : (
              "Encrypted presence performance is within target parameters. Continue monitoring for any changes."
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EncryptedPresencePanel;
