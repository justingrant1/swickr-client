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
  Badge,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MemoryIcon from '@mui/icons-material/Memory';
import CachedIcon from '@mui/icons-material/Cached';
import SpeedIcon from '@mui/icons-material/Speed';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import TimerIcon from '@mui/icons-material/Timer';

import workerService from '../../services/workerService';

/**
 * Worker Performance Panel Component
 * 
 * Displays detailed metrics about Web Worker performance for encryption operations,
 * particularly focusing on encrypted presence features.
 */
const WorkerPerformancePanel = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    maxConcurrentTasks: 0,
    currentConcurrentTasks: 0
  });
  const [refreshInterval, setRefreshInterval] = useState(3000);
  const [isSupported, setIsSupported] = useState(false);

  // Load metrics on mount and periodically
  useEffect(() => {
    // Check if web workers are supported
    setIsSupported(workerService.isWebWorkerSupported());
    
    // Initial load
    loadMetrics();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(loadMetrics, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  // Load worker metrics
  const loadMetrics = () => {
    try {
      const workerMetrics = workerService.getWorkerMetrics();
      setMetrics(workerMetrics);
    } catch (error) {
      console.error('Error loading worker metrics:', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadMetrics();
  };

  // Reset worker metrics
  const handleReset = () => {
    try {
      workerService.resetWorkerMetrics();
      loadMetrics();
    } catch (error) {
      console.error('Error resetting worker metrics:', error);
    }
  };

  // Get color based on success rate
  const getSuccessRateColor = (successRate) => {
    if (successRate >= 95) return theme.palette.success.main;
    if (successRate >= 80) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Calculate success rate
  const successRate = metrics.totalTasks > 0 
    ? (metrics.successfulTasks / metrics.totalTasks) * 100 
    : 100;

  // Get color for processing time
  const getProcessingTimeColor = (time) => {
    if (time <= 50) return theme.palette.success.main;
    if (time <= 100) return theme.palette.warning.main;
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
          <MemoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Worker Performance
          </Typography>
          
          <Tooltip title="Refresh metrics">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {!isSupported ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: `${theme.palette.warning.light}20`,
              borderColor: theme.palette.warning.light,
              mb: 2
            }}
          >
            <Typography variant="body2" color="warning.dark">
              Web Workers are not supported in this browser. Performance optimizations will be limited.
            </Typography>
          </Paper>
        ) : (
          <>
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
                    Processing Time
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: getProcessingTimeColor(metrics.averageProcessingTime),
                      fontWeight: 'medium'
                    }}
                  >
                    {metrics.averageProcessingTime.toFixed(1)} ms
                  </Typography>
                  <TimerIcon 
                    sx={{ 
                      mt: 1, 
                      color: getProcessingTimeColor(metrics.averageProcessingTime),
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
                    Success Rate
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: getSuccessRateColor(successRate),
                      fontWeight: 'medium'
                    }}
                  >
                    {successRate.toFixed(1)}%
                  </Typography>
                  <SecurityIcon 
                    sx={{ 
                      mt: 1, 
                      color: getSuccessRateColor(successRate),
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
                    Total Tasks
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'medium'
                    }}
                  >
                    {metrics.totalTasks}
                  </Typography>
                  <Badge 
                    badgeContent={metrics.currentConcurrentTasks} 
                    color="primary"
                    sx={{ mt: 1 }}
                  >
                    <SpeedIcon sx={{ opacity: 0.7 }} />
                  </Badge>
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
                    Max Concurrent
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'medium'
                    }}
                  >
                    {metrics.maxConcurrentTasks}
                  </Typography>
                  <MemoryIcon sx={{ mt: 1, opacity: 0.7 }} />
                </Paper>
              </Grid>
            </Grid>

            {/* Task Status */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Task Status
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ width: 180 }}>
                  Success Rate:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    width: 80, 
                    fontWeight: 'medium',
                    color: getSuccessRateColor(successRate)
                  }}
                >
                  {successRate.toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={successRate}
                  sx={{ 
                    flexGrow: 1, 
                    height: 8, 
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': { 
                      backgroundColor: getSuccessRateColor(successRate) 
                    },
                    backgroundColor: `${getSuccessRateColor(successRate)}20`
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<SpeedIcon />} 
                  label={`${metrics.successfulTasks} Successful`} 
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip 
                  icon={<SpeedIcon />} 
                  label={`${metrics.failedTasks} Failed`} 
                  size="small"
                  color="error"
                  variant="outlined"
                />
                <Chip 
                  icon={<TimerIcon />} 
                  label={`${metrics.averageProcessingTime.toFixed(1)}ms Avg. Time`} 
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="Reset metrics">
                <IconButton size="small" onClick={handleReset} color="primary">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkerPerformancePanel;
