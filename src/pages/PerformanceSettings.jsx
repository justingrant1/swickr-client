import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpeedIcon from '@mui/icons-material/Speed';
import { useNavigate } from 'react-router-dom';

import PerformanceMonitor from '../components/performance/PerformanceMonitor';
import performanceService from '../services/performanceService';

/**
 * Performance Settings Page
 * 
 * Allows users to view performance metrics and adjust performance settings
 * for encrypted presence features.
 */
const PerformanceSettings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [deviceInfo, setDeviceInfo] = useState({
    cores: navigator.hardwareConcurrency || 'Unknown',
    memory: 'Unknown',
    connection: 'Unknown',
    platform: navigator.platform || 'Unknown'
  });

  // Get device memory if available
  useEffect(() => {
    // Check if navigator.deviceMemory is available (Chrome only)
    if (navigator.deviceMemory) {
      setDeviceInfo(prev => ({
        ...prev,
        memory: `${navigator.deviceMemory} GB`
      }));
    }

    // Check connection type if available
    if (navigator.connection) {
      const connection = navigator.connection;
      setDeviceInfo(prev => ({
        ...prev,
        connection: connection.effectiveType || connection.type || 'Unknown'
      }));

      // Listen for connection changes
      const updateConnectionInfo = () => {
        setDeviceInfo(prev => ({
          ...prev,
          connection: connection.effectiveType || connection.type || 'Unknown'
        }));
      };

      navigator.connection.addEventListener('change', updateConnectionInfo);
      return () => {
        navigator.connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  // Reset all performance settings to default
  const handleResetToDefault = () => {
    performanceService.updateConfig({
      debounce: {
        typing: 300,
        presence: 2000,
        encryption: 50,
        enabled: true
      },
      batch: {
        maxItems: 10,
        maxWaitTime: 100,
        enabled: true
      },
      cache: {
        maxSize: 100,
        ttl: 5 * 60 * 1000, // 5 minutes
        enabled: true
      },
      worker: {
        useWorker: true,
        maxConcurrent: 4
      }
    });

    setNotification({
      open: true,
      message: 'Performance settings have been reset to defaults',
      severity: 'success'
    });
  };

  // Optimize for current device
  const handleOptimizeForDevice = () => {
    // Get device capabilities
    const cores = navigator.hardwareConcurrency || 2;
    const isLowEndDevice = cores <= 2;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Adjust settings based on device capabilities
    const optimizedConfig = {
      debounce: {
        typing: isMobileDevice ? 500 : 300,
        presence: isLowEndDevice ? 3000 : 2000,
        encryption: isLowEndDevice ? 100 : 50,
        enabled: true
      },
      batch: {
        maxItems: isLowEndDevice ? 5 : (cores > 4 ? 15 : 10),
        maxWaitTime: isLowEndDevice ? 200 : 100,
        enabled: true
      },
      cache: {
        maxSize: isLowEndDevice ? 50 : (cores > 4 ? 200 : 100),
        ttl: isLowEndDevice ? 3 * 60 * 1000 : 5 * 60 * 1000, // 3 or 5 minutes
        enabled: true
      },
      worker: {
        useWorker: !isLowEndDevice,
        maxConcurrent: Math.max(1, Math.floor(cores / 2))
      }
    };

    performanceService.updateConfig(optimizedConfig);

    setNotification({
      open: true,
      message: 'Performance settings optimized for your device',
      severity: 'success'
    });
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/settings')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
          Performance Settings
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Performance Monitor
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Monitor real-time performance metrics for encrypted presence features.
        </Typography>
        
        <PerformanceMonitor />
        
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mt: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={handleOptimizeForDevice}
            fullWidth={isMobile}
          >
            Optimize for My Device
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={handleResetToDefault}
            fullWidth={isMobile}
          >
            Reset to Defaults
          </Button>
        </Box>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Device Information
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2, mt: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            CPU Cores:
          </Typography>
          <Typography variant="body2">
            {deviceInfo.cores}
          </Typography>
          
          <Typography variant="body2" fontWeight="medium">
            Memory:
          </Typography>
          <Typography variant="body2">
            {deviceInfo.memory}
          </Typography>
          
          <Typography variant="body2" fontWeight="medium">
            Network:
          </Typography>
          <Typography variant="body2">
            {deviceInfo.connection}
          </Typography>
          
          <Typography variant="body2" fontWeight="medium">
            Platform:
          </Typography>
          <Typography variant="body2">
            {deviceInfo.platform}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          These device capabilities are used to optimize performance settings for encrypted presence features.
          Higher-end devices can handle more concurrent encryption operations and larger batch sizes.
        </Typography>
      </Paper>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PerformanceSettings;
