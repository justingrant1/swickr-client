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
  Button,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CachedIcon from '@mui/icons-material/Cached';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';

import performanceService from '../../services/performanceService';

/**
 * Cache Performance Panel Component
 * 
 * Displays detailed metrics about encryption cache performance,
 * particularly focusing on encrypted presence features.
 */
const CachePerformancePanel = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    cacheHitRate: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheSize: 0,
    averageEncryptionTime: 0,
    averageDecryptionTime: 0,
    totalOperations: 0
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

  // Load cache metrics
  const loadMetrics = () => {
    try {
      const cacheMetrics = performanceService.getCacheMetrics();
      setMetrics(cacheMetrics);
    } catch (error) {
      console.error('Error loading cache metrics:', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadMetrics();
  };

  // Clear cache
  const handleClearCache = () => {
    try {
      performanceService.clearCache();
      loadMetrics();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Get color based on hit rate
  const getHitRateColor = (hitRate) => {
    if (hitRate >= 80) return theme.palette.success.main;
    if (hitRate >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get color for encryption time
  const getEncryptionTimeColor = (time) => {
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
          <CachedIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Cache Performance
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
                Hit Rate
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getHitRateColor(metrics.cacheHitRate),
                  fontWeight: 'medium'
                }}
              >
                {metrics.cacheHitRate.toFixed(1)}%
              </Typography>
              <CachedIcon 
                sx={{ 
                  mt: 1, 
                  color: getHitRateColor(metrics.cacheHitRate),
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
                Encryption Time
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getEncryptionTimeColor(metrics.averageEncryptionTime),
                  fontWeight: 'medium'
                }}
              >
                {metrics.averageEncryptionTime.toFixed(1)} ms
              </Typography>
              <TimerIcon 
                sx={{ 
                  mt: 1, 
                  color: getEncryptionTimeColor(metrics.averageEncryptionTime),
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
                Cache Size
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {metrics.cacheSize}
              </Typography>
              <StorageIcon sx={{ mt: 1, opacity: 0.7 }} />
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
                Total Operations
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {metrics.totalOperations}
              </Typography>
              <SpeedIcon sx={{ mt: 1, opacity: 0.7 }} />
            </Paper>
          </Grid>
        </Grid>

        {/* Cache Stats */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Cache Statistics
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ width: 180 }}>
              Hit Rate:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                width: 80, 
                fontWeight: 'medium',
                color: getHitRateColor(metrics.cacheHitRate)
              }}
            >
              {metrics.cacheHitRate.toFixed(1)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={metrics.cacheHitRate}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getHitRateColor(metrics.cacheHitRate) 
                },
                backgroundColor: `${getHitRateColor(metrics.cacheHitRate)}20`
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<CachedIcon />} 
              label={`${metrics.cacheHits} Hits`} 
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip 
              icon={<CachedIcon />} 
              label={`${metrics.cacheMisses} Misses`} 
              size="small"
              color="error"
              variant="outlined"
            />
            <Chip 
              icon={<StorageIcon />} 
              label={`${metrics.cacheSize} Entries`} 
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Encryption Times */}
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
                color: getEncryptionTimeColor(metrics.averageEncryptionTime)
              }}
            >
              {metrics.averageEncryptionTime.toFixed(1)} ms
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.averageEncryptionTime / 200) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getEncryptionTimeColor(metrics.averageEncryptionTime) 
                },
                backgroundColor: `${getEncryptionTimeColor(metrics.averageEncryptionTime)}20`
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
                color: getEncryptionTimeColor(metrics.averageDecryptionTime)
              }}
            >
              {metrics.averageDecryptionTime.toFixed(1)} ms
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.averageDecryptionTime / 200) * 100, 100)}
              sx={{ 
                flexGrow: 1, 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: getEncryptionTimeColor(metrics.averageDecryptionTime) 
                },
                backgroundColor: `${getEncryptionTimeColor(metrics.averageDecryptionTime)}20`
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={handleClearCache}
            sx={{ mr: 1 }}
          >
            Clear Cache
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CachePerformancePanel;
