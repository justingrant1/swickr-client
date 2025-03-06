import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Card, 
  CardContent, 
  Divider,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Container,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  Speed as SpeedIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  DeleteOutline as DeleteIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import NotificationPerformanceChart from '../components/notifications/NotificationPerformanceChart';

/**
 * Notification Performance Dashboard
 * 
 * Displays real-time metrics about push notification performance
 */
function NotificationPerformanceDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [timeRange, setTimeRange] = useState('daily');
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

  // Reset metrics
  const resetMetrics = async () => {
    try {
      const response = await axios.post('/api/notifications/performance/reset', {}, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        fetchMetrics();
      } else {
        setError(response.data.error || 'Failed to reset metrics');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
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
    
    const avgTime = metrics.averageSendTime || metrics.averageDuration;
    const successRate = getSuccessRate();
    
    if (successRate < 50) return { label: 'Poor', color: 'error' };
    if (avgTime > 1000) return { label: 'Slow', color: 'warning' };
    if (successRate > 95 && avgTime < 300) return { label: 'Excellent', color: 'success' };
    if (successRate > 85) return { label: 'Good', color: 'success' };
    return { label: 'Fair', color: 'warning' };
  };

  // Get top failure reasons
  const getTopFailureReasons = () => {
    if (!metrics || !metrics.failureReasons) return [];
    
    return Object.entries(metrics.failureReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  };

  // Get notification types with stats
  const getNotificationTypeStats = () => {
    if (!metrics || !metrics.sendTimesByType) return [];
    
    return Object.entries(metrics.sendTimesByType)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        averageTime: stats.averageTime
      }))
      .sort((a, b) => b.count - a.count);
  };

  const performanceRating = getPerformanceRating();
  const successRate = getSuccessRate();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ mr: 1, color: '#6200ee' }} />
          Push Notification Performance
        </Typography>
        
        <Box>
          <Tooltip title="Refresh metrics">
            <IconButton 
              onClick={fetchMetrics} 
              disabled={loading}
              sx={{ mr: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset all metrics">
            <IconButton 
              color="warning" 
              onClick={resetMetrics}
              disabled={loading}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading && !metrics ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: 2,
                borderRadius: 2,
                borderLeft: 4, 
                borderColor: successRate > 90 ? '#4caf50' : successRate > 75 ? '#ff9800' : '#f44336'
              }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Notifications
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 500 }}>
                    {metrics?.sendCount || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <SuccessIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                    <Typography variant="body2" color="textSecondary">
                      {metrics?.successCount || 0} successful
                    </Typography>
                    <ErrorIcon fontSize="small" sx={{ color: 'error.main', ml: 1, mr: 0.5 }} />
                    <Typography variant="body2" color="textSecondary">
                      {metrics?.failureCount || 0} failed
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: 2,
                borderRadius: 2,
                borderLeft: 4, 
                borderColor: successRate > 90 ? '#4caf50' : successRate > 75 ? '#ff9800' : '#f44336'
              }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 500 }}>
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
                boxShadow: 2,
                borderRadius: 2,
                borderLeft: 4, 
                borderColor: '#0284c7'
              }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Time
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 500 }}>
                    {formatTime(metrics?.averageSendTime || metrics?.averageDuration || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <SpeedIcon fontSize="small" sx={{ color: '#0284c7', mr: 0.5 }} />
                    <Typography variant="body2" color="textSecondary">
                      Min: {formatTime(metrics?.minDuration || 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                      Max: {formatTime(metrics?.maxDuration || 0)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: 2,
                borderRadius: 2,
                borderLeft: 4, 
                borderColor: '#6200ee'
              }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Performance Rating
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 500, color: theme => {
                    switch(performanceRating.color) {
                      case 'success': return theme.palette.success.main;
                      case 'warning': return theme.palette.warning.main;
                      case 'error': return theme.palette.error.main;
                      default: return theme.palette.text.primary;
                    }
                  }}}>
                    {performanceRating.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <InfoIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="textSecondary">
                      Based on success rate and speed
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Performance Chart */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1, color: '#6200ee' }} />
                Performance Trends
              </Typography>
              
              <Tabs 
                value={timeRange} 
                onChange={(e, newValue) => setTimeRange(newValue)}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab value="hourly" label="Hourly" />
                <Tab value="daily" label="Daily" />
                <Tab value="weekly" label="Weekly" />
              </Tabs>
            </Box>
            
            <NotificationPerformanceChart 
              timeRange={timeRange} 
              height={300}
              showTitle={false}
            />
          </Paper>
          
          {/* Detailed Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChartIcon sx={{ mr: 1, color: '#6200ee' }} />
                  Notification Types
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Avg. Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getNotificationTypeStats().map((type) => (
                        <TableRow key={type.type}>
                          <TableCell component="th" scope="row">
                            {type.type}
                          </TableCell>
                          <TableCell align="right">{type.count}</TableCell>
                          <TableCell align="right">{formatTime(type.averageTime)}</TableCell>
                        </TableRow>
                      ))}
                      {getNotificationTypeStats().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PieChartIcon sx={{ mr: 1, color: '#6200ee' }} />
                  Failure Reasons
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Reason</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getTopFailureReasons().map((failure) => (
                        <TableRow key={failure.reason}>
                          <TableCell component="th" scope="row">
                            {failure.reason}
                          </TableCell>
                          <TableCell align="right">{failure.count}</TableCell>
                          <TableCell align="right">
                            {((failure.count / (metrics?.failureCount || 1)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {getTopFailureReasons().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No failures recorded
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Test Notification Button */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                axios.post('/api/notifications/test', {}, {
                  headers: { Authorization: `Bearer ${authToken}` }
                });
              }}
              sx={{ 
                backgroundColor: '#6200ee',
                '&:hover': {
                  backgroundColor: '#5000d6'
                }
              }}
            >
              Send Test Notification
            </Button>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Send a test notification to measure performance
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
}

export default NotificationPerformanceDashboard;
