import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  Grid,
  TextField,
  MenuItem,
  Snackbar,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CachedIcon from '@mui/icons-material/Cached';
import SpeedIcon from '@mui/icons-material/Speed';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

import mediaService from '../../services/mediaService';
import performanceService from '../../services/performanceService';
import MediaOptimizationTips from './MediaOptimizationTips';

/**
 * Media Performance Settings Component
 * 
 * Provides controls for configuring media performance optimizations
 * and tools for regenerating thumbnails and viewing statistics
 */
const MediaPerformanceSettings = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [regenerateOptions, setRegenerateOptions] = useState({
    forceAll: false,
    webpOnly: true,
    conversationId: ''
  });
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState({
    useWebp: true,
    useCache: true,
    thumbnailSize: 300,
    webpQuality: 80
  });
  const [activeTab, setActiveTab] = useState(0);

  // Load initial stats and configuration
  useEffect(() => {
    loadStats();
    loadConfig();
  }, []);

  // Load media statistics
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const mediaStats = await mediaService.getMediaStats();
      setStats(mediaStats);
    } catch (err) {
      setError(err.message || 'Failed to load media statistics');
    } finally {
      setLoading(false);
    }
  };

  // Load current configuration
  const loadConfig = () => {
    const currentConfig = performanceService.getConfig();
    setConfig({
      useWebp: currentConfig.media?.useWebp ?? true,
      useCache: currentConfig.media?.useCache ?? true,
      thumbnailSize: currentConfig.media?.thumbnailSize ?? 300,
      webpQuality: currentConfig.media?.webpQuality ?? 80
    });
  };

  // Handle configuration changes
  const handleConfigChange = (key) => (event) => {
    const newValue = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    
    const newConfig = {
      ...config,
      [key]: newValue
    };
    
    setConfig(newConfig);
    
    // Update performance service config
    performanceService.updateConfig({
      media: {
        useWebp: newConfig.useWebp,
        useCache: newConfig.useCache,
        thumbnailSize: parseInt(newConfig.thumbnailSize, 10),
        webpQuality: parseInt(newConfig.webpQuality, 10)
      }
    });
  };

  // Handle regenerate options changes
  const handleRegenerateOptionChange = (key) => (event) => {
    const newValue = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    
    setRegenerateOptions({
      ...regenerateOptions,
      [key]: newValue
    });
  };

  // Regenerate thumbnails
  const handleRegenerateThumbnails = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      
      const result = await mediaService.regenerateThumbnails(
        regenerateOptions,
        (progressPercent) => setProgress(progressPercent)
      );
      
      setSuccess(`Successfully regenerated ${result.processed} thumbnails`);
      
      // Reload stats after regeneration
      await loadStats();
    } catch (err) {
      setError(err.message || 'Failed to regenerate thumbnails');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Clear success message
  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{ mb: 2, bgcolor: theme.palette.background.paper, borderRadius: '4px 4px 0 0' }}
      >
        <Tab 
          icon={<SettingsIcon />} 
          label="Settings" 
          iconPosition="start"
        />
        <Tab 
          icon={<TipsAndUpdatesIcon />} 
          label="Optimization Tips" 
          iconPosition="start"
        />
      </Tabs>

      {activeTab === 0 && (
        <Card sx={{ bgcolor: theme.palette.background.paper }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ImageIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Media Performance Settings
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {/* Configuration Section */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                  Configuration
                </Typography>
                
                <Box sx={{ pl: 2, borderLeft: `4px solid ${theme.palette.primary.main}`, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.useWebp}
                        onChange={handleConfigChange('useWebp')}
                        color="primary"
                      />
                    }
                    label="Use WebP Format"
                  />
                  
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 2, mb: 1 }}>
                    WebP provides superior compression for images, reducing file size by up to 75%
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.useCache}
                        onChange={handleConfigChange('useCache')}
                        color="primary"
                      />
                    }
                    label="Enable Media Caching"
                  />
                  
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 2, mb: 1 }}>
                    Caching improves media loading performance by storing frequently accessed media
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="Thumbnail Size"
                        type="number"
                        value={config.thumbnailSize}
                        onChange={handleConfigChange('thumbnailSize')}
                        variant="outlined"
                        size="small"
                        fullWidth
                        InputProps={{
                          endAdornment: <Typography variant="caption">px</Typography>
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="WebP Quality"
                        type="number"
                        value={config.webpQuality}
                        onChange={handleConfigChange('webpQuality')}
                        variant="outlined"
                        size="small"
                        fullWidth
                        InputProps={{
                          endAdornment: <Typography variant="caption">%</Typography>
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* Statistics Section */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon fontSize="small" sx={{ mr: 1 }} />
                  Media Statistics
                </Typography>
                
                {loading && !stats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : stats ? (
                  <Box sx={{ pl: 2, borderLeft: `4px solid ${theme.palette.info.main}` }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Total Media Count:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {stats.totalCount}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          WebP Thumbnails:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {stats.webpCount} ({Math.round(stats.webpCount / stats.totalCount * 100)}%)
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Total Storage:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatBytes(stats.totalSize)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Space Saved:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatBytes(stats.spaceSaved)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Cache Hit Rate:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {stats.cacheHitRate ? `${Math.round(stats.cacheHitRate * 100)}%` : 'N/A'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Avg. Processing Time:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {stats.avgProcessingTime ? `${Math.round(stats.avgProcessingTime)}ms` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        startIcon={<CachedIcon />}
                        onClick={loadStats}
                        disabled={loading}
                      >
                        Refresh Stats
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">
                    No media statistics available
                  </Alert>
                )}
              </Grid>
              
              {/* Regenerate Thumbnails Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <StorageIcon fontSize="small" sx={{ mr: 1 }} />
                  Regenerate Thumbnails
                </Typography>
                
                <Box sx={{ pl: 2, borderLeft: `4px solid ${theme.palette.warning.main}`, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Regenerate thumbnails to apply the latest optimization settings to existing media.
                    This process may take some time depending on the number of media items.
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Conversation ID"
                        value={regenerateOptions.conversationId}
                        onChange={handleRegenerateOptionChange('conversationId')}
                        variant="outlined"
                        size="small"
                        fullWidth
                        placeholder="Leave empty for all"
                      />
                    </Grid>
                    
                    <Grid item xs={6} sm={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={regenerateOptions.webpOnly}
                            onChange={handleRegenerateOptionChange('webpOnly')}
                            color="primary"
                          />
                        }
                        label="WebP Only"
                      />
                    </Grid>
                    
                    <Grid item xs={6} sm={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={regenerateOptions.forceAll}
                            onChange={handleRegenerateOptionChange('forceAll')}
                            color="primary"
                          />
                        }
                        label="Force All"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CachedIcon />}
                      onClick={handleRegenerateThumbnails}
                      disabled={loading}
                      sx={{ mr: 2 }}
                    >
                      Regenerate Thumbnails
                    </Button>
                    
                    {loading && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={24} variant={progress > 0 ? "determinate" : "indeterminate"} value={progress} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {progress > 0 ? `${progress}%` : 'Processing...'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <MediaOptimizationTips />
      )}
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        message={success}
      />
    </Box>
  );
};

export default MediaPerformanceSettings;
