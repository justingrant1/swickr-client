import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Card, 
  CardContent,
  Chip,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import { 
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  Speed as SpeedIcon,
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

/**
 * NotificationPerformanceSummary
 * 
 * A compact summary of notification performance metrics for embedding in profile or settings pages
 */
const NotificationPerformanceSummary = () => {
  const { performanceMetrics, metricsLoading, fetchPerformanceMetrics } = useNotifications();
  const navigate = useNavigate();
  const theme = useTheme();

  // Fetch metrics if not already loaded
  useEffect(() => {
    if (!performanceMetrics && !metricsLoading) {
      fetchPerformanceMetrics();
    }
  }, [performanceMetrics, metricsLoading, fetchPerformanceMetrics]);

  // Format time in milliseconds to a readable format
  const formatTime = (ms) => {
    if (ms < 1) return '< 1 ms';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // Calculate success rate
  const getSuccessRate = () => {
    if (!performanceMetrics || performanceMetrics.sendCount === 0) return 0;
    return (performanceMetrics.successCount / performanceMetrics.sendCount) * 100;
  };

  // Determine performance rating
  const getPerformanceRating = () => {
    if (!performanceMetrics) return { label: 'Unknown', color: 'default' };
    
    const avgTime = performanceMetrics.averageSendTime || performanceMetrics.averageDuration;
    const successRate = getSuccessRate();
    
    if (successRate < 50) return { label: 'Poor', color: 'error' };
    if (avgTime > 1000) return { label: 'Slow', color: 'warning' };
    if (successRate > 95 && avgTime < 300) return { label: 'Excellent', color: 'success' };
    if (successRate > 85) return { label: 'Good', color: 'success' };
    return { label: 'Fair', color: 'warning' };
  };

  const successRate = getSuccessRate();
  const performanceRating = getPerformanceRating();

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ mr: 1, color: '#6200ee' }} />
          Notification Performance
        </Typography>
        
        <Button 
          variant="text" 
          color="primary" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/notification-performance')}
          sx={{ color: '#6200ee' }}
        >
          View Details
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {metricsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} sx={{ color: '#6200ee' }} />
        </Box>
      ) : !performanceMetrics ? (
        <Typography color="textSecondary" align="center">
          No performance data available
        </Typography>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Total Notifications
                </Typography>
                <Typography variant="h5" component="div" sx={{ fontWeight: 500 }}>
                  {performanceMetrics.sendCount || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <SuccessIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                  <Typography variant="body2" color="textSecondary">
                    {performanceMetrics.successCount || 0} successful
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h5" component="div" sx={{ fontWeight: 500 }}>
                  {successRate.toFixed(1)}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label={performanceRating.label} 
                    size="small" 
                    color={performanceRating.color}
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Average Time
                </Typography>
                <Typography variant="h5" component="div" sx={{ fontWeight: 500 }}>
                  {formatTime(performanceMetrics.averageSendTime || performanceMetrics.averageDuration || 0)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <SpeedIcon fontSize="small" sx={{ color: '#0284c7', mr: 0.5 }} />
                  <Typography variant="body2" color="textSecondary">
                    Target: &lt;500ms
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Click Rate
                </Typography>
                <Typography variant="h5" component="div" sx={{ fontWeight: 500 }}>
                  {performanceMetrics.clickRate ? `${performanceMetrics.clickRate.toFixed(1)}%` : 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <ErrorIcon fontSize="small" sx={{ 
                    color: performanceMetrics.failureCount > 0 ? 'error.main' : 'text.secondary',
                    mr: 0.5 
                  }} />
                  <Typography variant="body2" color="textSecondary">
                    {performanceMetrics.failureCount || 0} failures
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          size="small" 
          onClick={() => fetchPerformanceMetrics()}
          sx={{ color: '#6200ee' }}
        >
          Refresh
        </Button>
      </Box>
    </Paper>
  );
};

export default NotificationPerformanceSummary;
