import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import CachedIcon from '@mui/icons-material/Cached';
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';
import MemoryIcon from '@mui/icons-material/Memory';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SecurityIcon from '@mui/icons-material/Security';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';

// Import performance components
import WorkerPerformancePanel from './WorkerPerformancePanel';
import CachePerformancePanel from './CachePerformancePanel';
import BatchPerformancePanel from './BatchPerformancePanel';
import NetworkPerformancePanel from './NetworkPerformancePanel';
import EncryptedPresencePanel from './EncryptedPresencePanel';
import OptimizationComparisonPanel from './OptimizationComparisonPanel';
import RealTimeMetricsPanel from './RealTimeMetricsPanel';
import PerformanceMonitor from './PerformanceMonitor';

// Import services
import performanceService from '../../services/performanceService';
import workerService from '../../services/workerService';

/**
 * Performance Dashboard Component
 * 
 * A comprehensive dashboard for monitoring and optimizing performance
 * of encrypted presence features in Swickr.
 */
const PerformanceDashboard = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000);
  const [workerEnabled, setWorkerEnabled] = useState(true);
  const [batchingEnabled, setBatchingEnabled] = useState(true);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [config, setConfig] = useState({});

  // Load configuration on mount
  useEffect(() => {
    const currentConfig = performanceService.getConfig();
    setConfig(currentConfig);
    setWorkerEnabled(currentConfig.worker?.useWorker || false);
    setBatchingEnabled(currentConfig.batch?.enabled !== false);
    setCacheEnabled(currentConfig.cache?.enabled !== false);
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle worker toggle
  const handleWorkerToggle = (event) => {
    const newValue = event.target.checked;
    setWorkerEnabled(newValue);
    
    // Update worker configuration
    const newConfig = {
      ...config,
      worker: {
        ...config.worker,
        useWorker: newValue
      }
    };
    
    performanceService.updateConfig(newConfig);
    workerService.updateConfig({ worker: { useWorker: newValue } });
    setConfig(newConfig);
  };

  // Handle batching toggle
  const handleBatchingToggle = (event) => {
    const newValue = event.target.checked;
    setBatchingEnabled(newValue);
    
    // Update batching configuration
    const newConfig = {
      ...config,
      batch: {
        ...config.batch,
        enabled: newValue
      }
    };
    
    performanceService.updateConfig(newConfig);
    setConfig(newConfig);
  };

  // Handle cache toggle
  const handleCacheToggle = (event) => {
    const newValue = event.target.checked;
    setCacheEnabled(newValue);
    
    // Update cache configuration
    const newConfig = {
      ...config,
      cache: {
        ...config.cache,
        enabled: newValue
      }
    };
    
    performanceService.updateConfig(newConfig);
    setConfig(newConfig);
  };

  // Handle refresh
  const handleRefresh = () => {
    // Force refresh of metrics
    // This is handled by the individual components
  };

  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = (event) => {
    setAutoRefresh(event.target.checked);
  };

  // Handle clear all caches
  const handleClearCaches = () => {
    performanceService.clearCaches();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SpeedIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Performance Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                  size="small"
                />
              }
              label="Auto-refresh"
              sx={{ mr: 2 }}
            />
            
            <Tooltip title="Refresh metrics">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Performance Settings */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: `${theme.palette.background.default}`,
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SettingsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Performance Optimization Settings
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={workerEnabled}
                    onChange={handleWorkerToggle}
                  />
                }
                label="Web Worker Encryption"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                Offload encryption to background threads
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={batchingEnabled}
                    onChange={handleBatchingToggle}
                  />
                }
                label="Batch Processing"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                Group operations for better efficiency
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={cacheEnabled}
                    onChange={handleCacheToggle}
                  />
                }
                label="Encryption Caching"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                Cache encrypted presence data
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleClearCaches}
              startIcon={<CachedIcon />}
            >
              Clear All Caches
            </Button>
          </Box>
        </Paper>
        
        {/* Tabs for different performance views */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="performance dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<BarChartIcon />} 
              iconPosition="start" 
              label="Overview" 
            />
            <Tab 
              icon={<TimelineIcon />} 
              iconPosition="start" 
              label="Real-Time Metrics" 
            />
            <Tab 
              icon={<SecurityIcon />} 
              iconPosition="start" 
              label="Encrypted Presence" 
            />
            <Tab 
              icon={<CompareArrowsIcon />} 
              iconPosition="start" 
              label="Optimization Comparison" 
            />
            <Tab 
              icon={<MemoryIcon />} 
              iconPosition="start" 
              label="Worker Performance" 
            />
            <Tab 
              icon={<CachedIcon />} 
              iconPosition="start" 
              label="Cache Performance" 
            />
            <Tab 
              icon={<BatchPredictionIcon />} 
              iconPosition="start" 
              label="Batch Performance" 
            />
            <Tab 
              icon={<NetworkCheckIcon />} 
              iconPosition="start" 
              label="Network Performance" 
            />
          </Tabs>
        </Box>
        
        {/* Tab content */}
        <Box sx={{ py: 2 }}>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Performance Overview
              </Typography>
              <PerformanceMonitor />
            </Box>
          )}
          
          {/* Real-Time Metrics Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Real-Time Performance Metrics
              </Typography>
              <RealTimeMetricsPanel autoRefresh={autoRefresh} refreshInterval={1000} />
            </Box>
          )}
          
          {/* Encrypted Presence Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Encrypted Presence Performance
              </Typography>
              <EncryptedPresencePanel autoRefresh={autoRefresh} refreshInterval={refreshInterval} />
            </Box>
          )}
          
          {/* Optimization Comparison Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Optimization Strategy Comparison
              </Typography>
              <OptimizationComparisonPanel autoRefresh={autoRefresh} refreshInterval={refreshInterval} />
            </Box>
          )}
          
          {/* Worker Performance Tab */}
          {activeTab === 4 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Web Worker Performance
              </Typography>
              <WorkerPerformancePanel autoRefresh={autoRefresh} refreshInterval={refreshInterval} />
            </Box>
          )}
          
          {/* Cache Performance Tab */}
          {activeTab === 5 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Cache Performance
              </Typography>
              <CachePerformancePanel />
            </Box>
          )}
          
          {/* Batch Performance Tab */}
          {activeTab === 6 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Batch Processing Performance
              </Typography>
              <BatchPerformancePanel />
            </Box>
          )}
          
          {/* Network Performance Tab */}
          {activeTab === 7 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Network Performance
              </Typography>
              <NetworkPerformancePanel autoRefresh={autoRefresh} refreshInterval={refreshInterval} />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PerformanceDashboard;
