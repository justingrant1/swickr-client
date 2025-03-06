import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  Collapse,
  Grid,
  Paper,
  Badge,
  Button
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
import CachedIcon from '@mui/icons-material/Cached';
import TimerIcon from '@mui/icons-material/Timer';
import SecurityIcon from '@mui/icons-material/Security';
import MemoryIcon from '@mui/icons-material/Memory';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import ImageIcon from '@mui/icons-material/Image';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import CompressIcon from '@mui/icons-material/Compress';
import TuneIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';

import performanceService from '../../services/performanceService';
import workerService from '../../services/workerService';
import MediaPerformanceSettings from './MediaPerformanceSettings';
import MediaOptimizationTips from './MediaOptimizationTips';

/**
 * Performance Monitor Component
 * 
 * Displays real-time performance metrics for encrypted presence features
 * and allows users to toggle performance optimizations.
 */
const PerformanceMonitor = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState({
    messageLatency: 0,
    encryptionTime: 0,
    presenceUpdatesPerSecond: 0,
    workerActive: false,
    cacheHitRate: 0,
    batchSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    // Message reactions metrics
    reactionAddLatency: 0,
    reactionRemoveLatency: 0,
    reactionRenderTime: 0,
    reactionCount: 0,
    reactionCacheHitRate: 0,
    reactionNetworkPayload: 0,
    // Batch operations metrics
    reactionBatchSize: 0,
    reactionBatchProcessingTime: 0,
    reactionBatchEfficiency: 0,
    reactionOptimisticUpdateTime: 0,
    reactionBatchSuccessRate: 0,
    reactionBatchNetworkPayload: 0,
    // Media metrics
    mediaUploadTime: 0,
    mediaProcessingTime: 0,
    mediaDownloadTime: 0,
    mediaThumbnailGenerationTime: 0,
    mediaWebpConversionTime: 0,
    mediaCacheHitRate: 0,
    mediaCompressionRatio: 0,
    mediaActiveCount: 0,
    mediaTotalBytes: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    useWorker: true,
    useCache: true,
    useBatching: true,
    useDebounce: true,
    // Reaction-specific config
    useReactionBatching: true,
    useReactionCache: true,
    useReactionOptimisticUpdates: true,
    // Media-specific config
    useMediaWebp: true,
    useMediaCache: true
  });
  const [showMediaTips, setShowMediaTips] = useState(false);
  const metricsTimerRef = useRef(null);
  
  // Initialize and load metrics
  useEffect(() => {
    // Initial load
    loadMetrics();
    loadConfig();
    
    // Set up timer for periodic updates
    metricsTimerRef.current = setInterval(() => {
      loadMetrics();
    }, 2000);
    
    return () => {
      if (metricsTimerRef.current) {
        clearInterval(metricsTimerRef.current);
      }
    };
  }, []);
  
  // Load current performance metrics
  const loadMetrics = async () => {
    try {
      const currentMetrics = performanceService.getMetrics();
      const mediaMetrics = performanceService.getMediaMetrics();
      
      // Add worker status
      currentMetrics.workerActive = workerService.isWebWorkerSupported();
      
      // Add media metrics
      currentMetrics.mediaUploadTime = mediaMetrics.uploadTime;
      currentMetrics.mediaProcessingTime = mediaMetrics.processingTime;
      currentMetrics.mediaDownloadTime = mediaMetrics.downloadTime;
      currentMetrics.mediaThumbnailGenerationTime = mediaMetrics.thumbnailGenerationTime;
      currentMetrics.mediaWebpConversionTime = mediaMetrics.webpConversionTime;
      currentMetrics.mediaCacheHitRate = mediaMetrics.cacheHitRate;
      currentMetrics.mediaCompressionRatio = mediaMetrics.compressionRatio;
      currentMetrics.mediaActiveCount = mediaMetrics.activeMediaCount;
      currentMetrics.mediaTotalBytes = mediaMetrics.totalMediaBytes;
      
      setMetrics(currentMetrics);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };
  
  // Load current configuration
  const loadConfig = () => {
    try {
      const currentConfig = performanceService.getConfig();
      setConfig({
        useWorker: currentConfig.worker?.useWorker ?? true,
        useCache: currentConfig.cache?.enabled ?? true,
        useBatching: currentConfig.batch?.enabled ?? true,
        useDebounce: currentConfig.debounce?.enabled ?? true,
        // Reaction-specific config
        useReactionBatching: currentConfig.reactions?.useBatching ?? true,
        useReactionCache: currentConfig.reactions?.useCache ?? true,
        useReactionOptimisticUpdates: currentConfig.reactions?.useOptimisticUpdates ?? true,
        // Media-specific config
        useMediaWebp: currentConfig.media?.useWebp ?? true,
        useMediaCache: currentConfig.media?.useCache ?? true
      });
    } catch (error) {
      console.error('Error loading performance configuration:', error);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadMetrics();
    loadConfig();
  };
  
  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Toggle settings view
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  // Toggle media tips view
  const toggleMediaTips = () => {
    setShowMediaTips(!showMediaTips);
  };
  
  // Handle config changes
  const handleConfigChange = (key) => (event) => {
    const newConfig = {
      ...config,
      [key]: event.target.checked
    };
    
    setConfig(newConfig);
    
    // Update performance service config
    performanceService.updateConfig({
      worker: {
        useWorker: newConfig.useWorker
      },
      cache: {
        enabled: newConfig.useCache
      },
      batch: {
        enabled: newConfig.useBatching
      },
      debounce: {
        enabled: newConfig.useDebounce
      },
      reactions: {
        useBatching: newConfig.useReactionBatching,
        useCache: newConfig.useReactionCache,
        useOptimisticUpdates: newConfig.useReactionOptimisticUpdates
      },
      media: {
        useWebp: newConfig.useMediaWebp,
        useCache: newConfig.useMediaCache
      }
    });
  };
  
  // Get color for metric based on performance target
  const getMetricColor = (value, target, lowerIsBetter = true) => {
    if (lowerIsBetter) {
      if (value <= target * 0.7) return theme.palette.success.main;
      if (value <= target) return theme.palette.warning.main;
      return theme.palette.error.main;
    } else {
      if (value >= target * 1.3) return theme.palette.success.main;
      if (value >= target) return theme.palette.warning.main;
      return theme.palette.error.main;
    }
  };
  
  // Get progress value (0-100) for metric
  const getProgressValue = (value, target, max, lowerIsBetter = true) => {
    if (lowerIsBetter) {
      // For metrics where lower is better (like latency)
      const progress = Math.min(value / max * 100, 100);
      return progress;
    } else {
      // For metrics where higher is better (like cache hit rate)
      const progress = Math.min(value / max * 100, 100);
      return progress;
    }
  };
  
  // Get progress color for LinearProgress
  const getProgressColor = (value, target, lowerIsBetter = true) => {
    const color = getMetricColor(value, target, lowerIsBetter);
    return { 
      '& .MuiLinearProgress-bar': { 
        backgroundColor: color 
      },
      backgroundColor: `${color}20`
    };
  };
  
  // Render message reactions metrics section
  const renderReactionsMetrics = () => {
    return (
      <Card sx={{ mb: 2, bgcolor: theme.palette.background.paper }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AddReactionIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              Message Reactions Performance
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Refresh metrics">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Grid container spacing={2}>
            {/* Reaction Add Latency */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionAddLatency, 100)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Add Latency
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionAddLatency.toFixed(1)} ms
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(metrics.reactionAddLatency, 100, 300)}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionAddLatency, 100)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &lt;100ms
                </Typography>
              </Paper>
            </Grid>
            
            {/* Reaction Remove Latency */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionRemoveLatency, 100)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Remove Latency
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionRemoveLatency.toFixed(1)} ms
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(metrics.reactionRemoveLatency, 100, 300)}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionRemoveLatency, 100)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &lt;100ms
                </Typography>
              </Paper>
            </Grid>
            
            {/* Reaction Render Time */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionRenderTime, 50)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Render Time
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionRenderTime.toFixed(1)} ms
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(metrics.reactionRenderTime, 50, 150)}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionRenderTime, 50)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &lt;50ms
                </Typography>
              </Paper>
            </Grid>
            
            {/* Network Payload */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionNetworkPayload, 1024, true)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Network Payload
                </Typography>
                <Typography variant="h6" component="div">
                  {(metrics.reactionNetworkPayload / 1024).toFixed(2)} KB
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(metrics.reactionNetworkPayload, 1024, 3072)}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionNetworkPayload, 1024)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &lt;1KB
                </Typography>
              </Paper>
            </Grid>
            
            {/* Cache Hit Rate */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionCacheHitRate, 0.8, false)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Cache Hit Rate
                </Typography>
                <Typography variant="h6" component="div">
                  {(metrics.reactionCacheHitRate * 100).toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.reactionCacheHitRate * 100}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionCacheHitRate, 0.8, false)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &gt;80%
                </Typography>
              </Paper>
            </Grid>
            
            {/* Active Reaction Count */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${theme.palette.info.main}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Active Reactions
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionCount}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(metrics.reactionCount / 100 * 100, 100)}
                  sx={{ 
                    mt: 1, 
                    '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.info.main }
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Optimized for up to 100
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Batch Operations Metrics
          </Typography>
          
          <Grid container spacing={2}>
            {/* Batch Size */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${theme.palette.primary.main}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Average Batch Size
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionBatchSize ? metrics.reactionBatchSize.toFixed(1) : '0.0'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((metrics.reactionBatchSize || 0) / 10 * 100, 100)}
                  sx={{ 
                    mt: 1, 
                    '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.primary.main }
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &gt;5 reactions/batch
                </Typography>
              </Paper>
            </Grid>
            
            {/* Batch Processing Time */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionBatchProcessingTime || 0, 200)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Batch Processing Time
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionBatchProcessingTime ? metrics.reactionBatchProcessingTime.toFixed(1) : '0.0'} ms
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(metrics.reactionBatchProcessingTime || 0, 200, 500)}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionBatchProcessingTime || 0, 200)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &lt;200ms
                </Typography>
              </Paper>
            </Grid>
            
            {/* Batch Efficiency */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionBatchEfficiency || 0, 0.7, false)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Batch Efficiency
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionBatchEfficiency ? (metrics.reactionBatchEfficiency * 100).toFixed(1) : '0.0'}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(metrics.reactionBatchEfficiency || 0) * 100}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionBatchEfficiency || 0, 0.7, false)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &gt;70%
                </Typography>
              </Paper>
            </Grid>
            
            {/* Optimistic Updates */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionOptimisticUpdateTime || 0, 20)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Optimistic Update Time
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionOptimisticUpdateTime ? metrics.reactionOptimisticUpdateTime.toFixed(1) : '0.0'} ms
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(metrics.reactionOptimisticUpdateTime || 0, 20, 100)}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionOptimisticUpdateTime || 0, 20)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &lt;20ms
                </Typography>
              </Paper>
            </Grid>
            
            {/* Batch Success Rate */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionBatchSuccessRate || 0, 0.95, false)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Batch Success Rate
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionBatchSuccessRate ? (metrics.reactionBatchSuccessRate * 100).toFixed(1) : '0.0'}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(metrics.reactionBatchSuccessRate || 0) * 100}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionBatchSuccessRate || 0, 0.95, false)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &gt;95%
                </Typography>
              </Paper>
            </Grid>
            
            {/* Batch Network Payload */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  borderLeft: `4px solid ${getMetricColor(metrics.reactionBatchNetworkPayload || 0, 2048, true)}` 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Batch Network Payload
                </Typography>
                <Typography variant="h6" component="div">
                  {metrics.reactionBatchNetworkPayload ? (metrics.reactionBatchNetworkPayload / 1024).toFixed(2) : '0.00'} KB
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(metrics.reactionBatchNetworkPayload || 0, 2048, 5120)}
                  sx={{ 
                    mt: 1, 
                    ...getProgressColor(metrics.reactionBatchNetworkPayload || 0, 2048, true)
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Target: &lt;2KB
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.useReactionBatching}
                  onChange={handleConfigChange('useReactionBatching')}
                  color="primary"
                />
              }
              label="Enable Reaction Batching"
            />
            <Tooltip title="Batch multiple reaction operations together to reduce network requests and improve performance">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.useReactionOptimisticUpdates}
                  onChange={handleConfigChange('useReactionOptimisticUpdates')}
                  color="primary"
                />
              }
              label="Enable Optimistic Updates"
            />
            <Tooltip title="Show reaction changes immediately in the UI before server confirmation">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Reaction Performance Settings */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Reaction Performance Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={config.useReactionBatching}
                      onChange={handleConfigChange('useReactionBatching')}
                      color="primary"
                    />
                  }
                  label="Batch Processing"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={config.useReactionCache}
                      onChange={handleConfigChange('useReactionCache')}
                      color="primary"
                    />
                  }
                  label="Caching"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={config.useReactionOptimisticUpdates}
                      onChange={handleConfigChange('useReactionOptimisticUpdates')}
                      color="primary"
                    />
                  }
                  label="Optimistic Updates"
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render media metrics section
  const renderMediaMetrics = () => {
    return (
      <>
        <Card sx={{ mb: 2, bgcolor: theme.palette.background.paper }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ImageIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Media Performance
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Advanced Media Settings">
                <IconButton size="small" onClick={toggleSettings} sx={{ mr: 1 }}>
                  <TuneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh metrics">
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Grid container spacing={2}>
              {/* Upload Time */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${getMetricColor(metrics.mediaUploadTime, 2000)}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Upload Time
                  </Typography>
                  <Typography variant="h6" component="div">
                    {metrics.mediaUploadTime.toFixed(1)} ms
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProgressValue(metrics.mediaUploadTime, 2000, 5000)}
                    sx={{ 
                      mt: 1, 
                      ...getProgressColor(metrics.mediaUploadTime, 2000)
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Target: &lt;2000ms
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Processing Time */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${getMetricColor(metrics.mediaProcessingTime, 1000)}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Processing Time
                  </Typography>
                  <Typography variant="h6" component="div">
                    {metrics.mediaProcessingTime.toFixed(1)} ms
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProgressValue(metrics.mediaProcessingTime, 1000, 3000)}
                    sx={{ 
                      mt: 1, 
                      ...getProgressColor(metrics.mediaProcessingTime, 1000)
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Target: &lt;1000ms
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Download Time */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${getMetricColor(metrics.mediaDownloadTime, 1000)}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Download Time
                  </Typography>
                  <Typography variant="h6" component="div">
                    {metrics.mediaDownloadTime.toFixed(1)} ms
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProgressValue(metrics.mediaDownloadTime, 1000, 3000)}
                    sx={{ 
                      mt: 1, 
                      ...getProgressColor(metrics.mediaDownloadTime, 1000)
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Target: &lt;1000ms
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Thumbnail Generation Time */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${getMetricColor(metrics.mediaThumbnailGenerationTime, 500)}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Thumbnail Generation
                  </Typography>
                  <Typography variant="h6" component="div">
                    {metrics.mediaThumbnailGenerationTime.toFixed(1)} ms
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProgressValue(metrics.mediaThumbnailGenerationTime, 500, 1500)}
                    sx={{ 
                      mt: 1, 
                      ...getProgressColor(metrics.mediaThumbnailGenerationTime, 500)
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Target: &lt;500ms
                  </Typography>
                </Paper>
              </Grid>
              
              {/* WebP Conversion Time */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${getMetricColor(metrics.mediaWebpConversionTime, 300)}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    WebP Conversion
                  </Typography>
                  <Typography variant="h6" component="div">
                    {metrics.mediaWebpConversionTime.toFixed(1)} ms
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProgressValue(metrics.mediaWebpConversionTime, 300, 1000)}
                    sx={{ 
                      mt: 1, 
                      ...getProgressColor(metrics.mediaWebpConversionTime, 300)
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Target: &lt;300ms
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Cache Hit Rate */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${getMetricColor(metrics.mediaCacheHitRate, 0.8, false)}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Cache Hit Rate
                  </Typography>
                  <Typography variant="h6" component="div">
                    {(metrics.mediaCacheHitRate * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics.mediaCacheHitRate * 100}
                    sx={{ 
                      mt: 1, 
                      ...getProgressColor(metrics.mediaCacheHitRate, 0.8, false)
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Target: &gt;80%
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Compression Ratio */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${getMetricColor(metrics.mediaCompressionRatio, 0.5, true)}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Compression Ratio
                  </Typography>
                  <Typography variant="h6" component="div">
                    {(metrics.mediaCompressionRatio * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(1 - metrics.mediaCompressionRatio) * 100}
                    sx={{ 
                      mt: 1, 
                      ...getProgressColor(metrics.mediaCompressionRatio, 0.5, true)
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Target: &lt;50% of original
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Active Media Count */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${theme.palette.info.main}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Active Media Items
                  </Typography>
                  <Typography variant="h6" component="div">
                    {metrics.mediaActiveCount}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(metrics.mediaActiveCount / 100 * 100, 100)}
                    sx={{ 
                      mt: 1, 
                      '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.info.main }
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Total media items
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Total Media Size */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    borderLeft: `4px solid ${theme.palette.info.main}` 
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Media Size
                  </Typography>
                  <Typography variant="h6" component="div">
                    {(metrics.mediaTotalBytes / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(metrics.mediaTotalBytes / (50 * 1024 * 1024) * 100, 100)}
                    sx={{ 
                      mt: 1, 
                      '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.info.main }
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Optimized size
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Settings for media performance */}
            <Collapse in={showSettings}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Media Performance Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={config.useMediaWebp}
                          onChange={handleConfigChange('useMediaWebp')}
                          color="primary"
                        />
                      }
                      label="Use WebP Format"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={config.useMediaCache}
                          onChange={handleConfigChange('useMediaCache')}
                          color="primary"
                        />
                      }
                      label="Enable Media Cache"
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<TuneIcon />}
                    onClick={toggleMediaTips}
                  >
                    Media Optimization Tips
                  </Button>
                </Box>
              </Box>
            </Collapse>
            
            {/* Media Optimization Tips */}
            <Collapse in={showMediaTips}>
              <Box sx={{ mt: 2 }}>
                <MediaOptimizationTips />
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Card sx={{ mb: 2, bgcolor: theme.palette.background.paper }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SpeedIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              Performance Monitor
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Settings">
              <IconButton size="small" onClick={toggleSettings} sx={{ mr: 1 }}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh metrics">
              <IconButton size="small" onClick={handleRefresh} sx={{ mr: 1 }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? "Collapse" : "Expand"}>
              <IconButton size="small" onClick={toggleExpanded}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Summary metrics */}
          <Grid container spacing={2}>
            {/* Message Latency */}
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ mr: 1, color: getMetricColor(metrics.messageLatency, 500) }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Message Latency
                  </Typography>
                  <Typography variant="h6">
                    {metrics.messageLatency.toFixed(0)} ms
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* Encryption Time */}
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1, color: getMetricColor(metrics.encryptionTime, 50) }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Encryption Time
                  </Typography>
                  <Typography variant="h6">
                    {metrics.encryptionTime.toFixed(0)} ms
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* Cache Hit Rate */}
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CachedIcon sx={{ mr: 1, color: getMetricColor(metrics.cacheHitRate, 0.7, false) }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Cache Hit Rate
                  </Typography>
                  <Typography variant="h6">
                    {(metrics.cacheHitRate * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* Worker Status */}
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MemoryIcon sx={{ mr: 1, color: metrics.workerActive ? theme.palette.success.main : theme.palette.error.main }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Worker Status
                  </Typography>
                  <Typography variant="h6">
                    {metrics.workerActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          {/* Settings */}
          <Collapse in={showSettings}>
            <Box sx={{ mt: 2, p: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Performance Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={config.useWorker}
                        onChange={handleConfigChange('useWorker')}
                        color="primary"
                      />
                    }
                    label="Web Worker"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={config.useCache}
                        onChange={handleConfigChange('useCache')}
                        color="primary"
                      />
                    }
                    label="Caching"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={config.useBatching}
                        onChange={handleConfigChange('useBatching')}
                        color="primary"
                      />
                    }
                    label="Batch Processing"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={config.useDebounce}
                        onChange={handleConfigChange('useDebounce')}
                        color="primary"
                      />
                    }
                    label="Debouncing"
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
      
      {/* Expanded metrics */}
      <Collapse in={expanded}>
        {/* Encrypted Presence Metrics */}
        {/* Additional detailed metrics can be added here */}
        
        {/* Message Reactions Metrics */}
        {renderReactionsMetrics()}
        
        {/* Media Performance Metrics */}
        {renderMediaMetrics()}
      </Collapse>
    </Box>
  );
};

export default PerformanceMonitor;
