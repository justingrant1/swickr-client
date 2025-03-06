import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Card, 
  CardContent, 
  Divider,
  Button,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  Speed as SpeedIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

/**
 * Notification Performance Widget
 * 
 * A compact widget that displays key push notification performance metrics
 * Can be embedded in other components/pages
 */
const NotificationPerformanceWidget = ({ refreshInterval = 60000 }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authToken } = useAuth();

  // Fetch metrics from the API
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications/performance', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        setMetrics(response.data.metrics);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch metrics on component mount and at regular intervals
  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, authToken]);

  // Format time in milliseconds to a readable format
  const formatTime = (ms) => {
    if (!ms && ms !== 0) return 'N/A';
    if (ms < 1) return '< 1 ms';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // Calculate success rate
  const getSuccessRate = () => {
    if (!metrics || metrics.sendCount === 0) return 0;
    return (metrics.successCount / metrics.sendCount) * 100;
  };

  // Determine performance rating
  const getPerformanceRating = () => {
    if (!metrics) return { label: 'Unknown', color: 'default' };
    
    const successRate = getSuccessRate();
    const avgTime = metrics.averageSendTime || metrics.averageDuration;
    
    if (successRate < 50) return { label: 'Poor', color: 'error' };
    if (avgTime > 1000) return { label: 'Slow', color: 'warning' };
    if (successRate > 95 && avgTime < 300) return { label: 'Excellent', color: 'success' };
    if (successRate > 85) return { label: 'Good', color: 'success' };
    return { label: 'Fair', color: 'warning' };
  };

  const performanceRating = getPerformanceRating();
  const successRate = getSuccessRate();

  return (
    <Card sx={{ 
      width: '100%', 
      boxShadow: 2,
      borderRadius: 2,
      borderLeft: 4, 
      borderColor: metrics ? 
        (successRate > 90 ? '#4caf50' : successRate > 75 ? '#ff9800' : '#f44336') : 
        '#e0e0e0'
    }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon sx={{ mr: 1, color: '#6200ee' }} />
            Notification Performance
          </Typography>
          
          <Box>
            <Tooltip title="Refresh metrics">
              <Button 
                size="small" 
                onClick={fetchMetrics} 
                disabled={loading}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <RefreshIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        
        {loading && !metrics ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Success Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {successRate >= 90 ? (
                    <SuccessIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <ErrorIcon fontSize="small" sx={{ color: 'warning.main', mr: 0.5 }} />
                  )}
                  <Typography variant="body1" fontWeight="medium">
                    {successRate.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Avg. Time
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon fontSize="small" sx={{ color: '#0284c7', mr: 0.5 }} />
                  <Typography variant="body1" fontWeight="medium">
                    {formatTime(metrics?.averageSendTime || metrics?.averageDuration)}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip 
                  label={performanceRating.label} 
                  size="small" 
                  color={performanceRating.color}
                  sx={{ fontWeight: 'medium' }}
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="textSecondary">
                Total: {metrics?.sendCount || 0} notifications
              </Typography>
              
              <Typography variant="body2">
                <Link to="/notification-performance" style={{ color: '#6200ee', textDecoration: 'none' }}>
                  View Details
                </Link>
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationPerformanceWidget;
