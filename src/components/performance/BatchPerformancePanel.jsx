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
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import BarChartIcon from '@mui/icons-material/BarChart';

import performanceService from '../../services/performanceService';

/**
 * Batch Performance Panel Component
 * 
 * Displays detailed metrics about batch processing performance for encrypted presence features.
 */
const BatchPerformancePanel = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    averageBatchSize: 0,
    maxBatchSize: 0,
    batchesProcessed: 0,
    averageBatchTime: 0,
    batchEfficiencyGain: 0,
    totalItemsProcessed: 0
  });
  const [refreshInterval, setRefreshInterval] = useState(3000);

  // Load metrics on mount and periodically
  useEffect(() => {
    // Initial load
    loadMetrics();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(loadMetrics, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  // Load batch metrics
  const loadMetrics = () => {
    try {
      const batchMetrics = performanceService.getBatchMetrics();
      setMetrics(batchMetrics);
    } catch (error) {
      console.error('Error loading batch metrics:', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadMetrics();
  };

  // Get color based on batch efficiency
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 50) return theme.palette.success.main;
    if (efficiency >= 25) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get color for batch size
  const getBatchSizeColor = (size) => {
    if (size >= 10) return theme.palette.success.main;
    if (size >= 5) return theme.palette.warning.main;
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
          <BatchPredictionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Batch Processing Performance
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
                Avg. Batch Size
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getBatchSizeColor(metrics.averageBatchSize),
                  fontWeight: 'medium'
                }}
              >
                {metrics.averageBatchSize.toFixed(1)}
              </Typography>
              <BatchPredictionIcon 
                sx={{ 
                  mt: 1, 
                  color: getBatchSizeColor(metrics.averageBatchSize),
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
                Efficiency Gain
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getEfficiencyColor(metrics.batchEfficiencyGain),
                  fontWeight: 'medium'
                }}
              >
                {metrics.batchEfficiencyGain.toFixed(1)}%
              </Typography>
              <SpeedIcon 
                sx={{ 
                  mt: 1, 
                  color: getEfficiencyColor(metrics.batchEfficiencyGain),
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
                Avg. Batch Time
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {metrics.averageBatchTime.toFixed(1)} ms
              </Typography>
              <TimerIcon sx={{ mt: 1, opacity: 0.7 }} />
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
                Batches Processed
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {metrics.batchesProcessed}
              </Typography>
              <BarChartIcon sx={{ mt: 1, opacity: 0.7 }} />
            </Paper>
          </Grid>
        </Grid>

        {/* Batch Stats */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Batch Statistics
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Batch Size:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getBatchSizeColor(metrics.averageBatchSize)
              }}
            >
              {metrics.averageBatchSize.toFixed(1)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.averageBatchSize / 20) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getBatchSizeColor(metrics.averageBatchSize) 
                },
                backgroundColor: `${getBatchSizeColor(metrics.averageBatchSize)}20`
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Efficiency Gain:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getEfficiencyColor(metrics.batchEfficiencyGain)
              }}
            >
              {metrics.batchEfficiencyGain.toFixed(1)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(metrics.batchEfficiencyGain, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getEfficiencyColor(metrics.batchEfficiencyGain) 
                },
                backgroundColor: `${getEfficiencyColor(metrics.batchEfficiencyGain)}20`
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<BatchPredictionIcon />} 
              label={`${metrics.batchesProcessed} Batches`} 
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip 
              icon={<SpeedIcon />} 
              label={`${metrics.totalItemsProcessed} Items`} 
              size="small"
              color="secondary"
              variant="outlined"
            />
            <Chip 
              icon={<TimerIcon />} 
              label={`${metrics.averageBatchTime.toFixed(1)}ms Avg. Time`} 
              size="small"
              color="default"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Efficiency Explanation */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            backgroundColor: `${theme.palette.info.light}10`,
            borderColor: theme.palette.info.light,
            mb: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Efficiency Gain</strong> represents the percentage of time saved by processing updates in batches 
            compared to processing them individually. Higher values indicate better performance optimization.
          </Typography>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Performance Tips */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Performance Tips
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metrics.averageBatchSize < 5 ? (
              "Increasing batch size could improve performance. Consider adjusting the batch collection window."
            ) : metrics.batchEfficiencyGain < 30 ? (
              "Batch processing is working but with limited efficiency. Review batch processing logic for potential optimizations."
            ) : (
              "Batch processing is working efficiently. Continue monitoring for any performance changes."
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BatchPerformancePanel;
