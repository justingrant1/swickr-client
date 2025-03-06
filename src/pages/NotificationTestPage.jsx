import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Slider,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Speed as SpeedIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';
import NotificationPerformanceSummary from '../components/notifications/NotificationPerformanceSummary';

/**
 * NotificationTestPage Component
 * 
 * Page for testing push notifications and notification performance
 */
const NotificationTestPage = () => {
  const navigate = useNavigate();
  const { pushEnabled, enablePushNotifications, fetchPerformanceMetrics } = useNotifications();
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    title: 'Test Notification',
    body: 'This is a test notification from Swickr',
    type: 'message',
    userId: '',
    url: '/'
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Performance test settings
  const [performanceSettings, setPerformanceSettings] = useState({
    count: 5,
    delay: 500,
    simulateClient: true
  });
  
  // Performance test progress
  const [testProgress, setTestProgress] = useState({
    running: false,
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    results: null
  });
  
  // Handle form field changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle performance settings changes
  const handlePerformanceSettingChange = (event) => {
    const { name, value, checked } = event.target;
    setPerformanceSettings(prev => ({
      ...prev,
      [name]: name === 'simulateClient' ? checked : value
    }));
  };
  
  // Handle slider change
  const handleSliderChange = (name) => (event, newValue) => {
    setPerformanceSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/notifications/test', formData);
      
      setSnackbar({
        open: true,
        message: 'Test notification sent successfully',
        severity: 'success'
      });
      
      // Refresh performance metrics after sending test notification
      setTimeout(() => {
        fetchPerformanceMetrics();
      }, 2000);
      
    } catch (error) {
      console.error('Error sending test notification:', error);
      
      setSnackbar({
        open: true,
        message: `Failed to send test notification: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle performance test
  const handlePerformanceTest = async () => {
    setTestProgress({
      running: true,
      total: performanceSettings.count,
      current: 0,
      success: 0,
      failed: 0,
      results: null
    });
    
    try {
      const response = await axios.post('/api/notifications/performance-test/test', {
        count: performanceSettings.count,
        delay: performanceSettings.delay,
        simulateClient: performanceSettings.simulateClient
      });
      
      // Start polling for progress
      pollTestProgress();
      
    } catch (error) {
      console.error('Error starting performance test:', error);
      
      setSnackbar({
        open: true,
        message: `Failed to start performance test: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
      
      setTestProgress(prev => ({
        ...prev,
        running: false
      }));
    }
  };
  
  // Poll for test progress
  const pollTestProgress = async () => {
    try {
      const response = await axios.get('/api/notifications/performance-test/test/status');
      
      if (response.data) {
        setTestProgress({
          running: response.data.running,
          total: response.data.total,
          current: response.data.current,
          success: response.data.success,
          failed: response.data.failed,
          results: response.data.running ? null : response.data.results
        });
        
        if (response.data.running) {
          // Continue polling
          setTimeout(pollTestProgress, 1000);
        } else {
          // Test complete, refresh metrics
          fetchPerformanceMetrics();
          
          setSnackbar({
            open: true,
            message: 'Performance test completed successfully',
            severity: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Error polling test progress:', error);
      setTestProgress(prev => ({
        ...prev,
        running: false
      }));
    }
  };
  
  // Handle enabling push notifications
  const handleEnablePushNotifications = async () => {
    const result = await enablePushNotifications();
    
    if (result) {
      setSnackbar({
        open: true,
        message: 'Push notifications enabled successfully',
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to enable push notifications. Please check browser permissions.',
        severity: 'error'
      });
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Render test results
  const renderTestResults = () => {
    if (!testProgress.results) return null;
    
    const { averageDuration, successRate, minDuration, maxDuration, failureReasons } = testProgress.results;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Results
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2">
                  Success Rate
                </Typography>
                <Typography variant="h5" component="div">
                  {successRate ? `${successRate.toFixed(1)}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2">
                  Avg. Duration
                </Typography>
                <Typography variant="h5" component="div">
                  {averageDuration ? `${averageDuration.toFixed(0)} ms` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2">
                  Min Duration
                </Typography>
                <Typography variant="h5" component="div">
                  {minDuration ? `${minDuration} ms` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2">
                  Max Duration
                </Typography>
                <Typography variant="h5" component="div">
                  {maxDuration ? `${maxDuration} ms` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {failureReasons && Object.keys(failureReasons).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Failure Reasons:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              {Object.entries(failureReasons).map(([reason, count]) => (
                <Box component="li" key={reason}>
                  <Typography variant="body2">
                    {reason}: {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          edge="start" 
          onClick={() => navigate('/settings')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Test Push Notifications
        </Typography>
      </Box>
      
      {!pushEnabled && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={handleEnablePushNotifications}
            >
              Enable Now
            </Button>
          }
        >
          Push notifications are not enabled. Enable them to receive notifications.
        </Alert>
      )}
      
      <NotificationPerformanceSummary />
      
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: `${theme.palette.primary.main}10`,
          }}
        >
          <Tab 
            icon={<NotificationsIcon />} 
            label="Single Notification" 
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab 
            icon={<SpeedIcon />} 
            label="Performance Test" 
            id="tab-1"
            aria-controls="tabpanel-1"
          />
        </Tabs>
        
        <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" aria-labelledby="tab-0" sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Send Test Notification
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notification Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notification Body"
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Notification Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Notification Type"
                  >
                    <MenuItem value="message">Message</MenuItem>
                    <MenuItem value="mention">Mention</MenuItem>
                    <MenuItem value="contact_request">Contact Request</MenuItem>
                    <MenuItem value="status_update">Status Update</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target User ID (leave empty for yourself)"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL (optional)"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="e.g., /conversations/123"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{ 
                    backgroundColor: '#6200ee',
                    '&:hover': {
                      backgroundColor: '#5000d1'
                    }
                  }}
                >
                  Send Test Notification
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" aria-labelledby="tab-1" sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Performance Test
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            Send multiple notifications to test performance metrics. This will help you evaluate notification delivery speed and reliability.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography id="count-slider-label" gutterBottom>
                Number of Notifications: {performanceSettings.count}
              </Typography>
              <Slider
                aria-labelledby="count-slider-label"
                value={performanceSettings.count}
                onChange={handleSliderChange('count')}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' }
                ]}
                min={1}
                max={20}
                name="count"
                disabled={testProgress.running}
                sx={{ color: '#6200ee' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography id="delay-slider-label" gutterBottom>
                Delay Between Notifications: {performanceSettings.delay}ms
              </Typography>
              <Slider
                aria-labelledby="delay-slider-label"
                value={performanceSettings.delay}
                onChange={handleSliderChange('delay')}
                step={100}
                marks={[
                  { value: 0, label: '0ms' },
                  { value: 500, label: '500ms' },
                  { value: 1000, label: '1s' }
                ]}
                min={0}
                max={1000}
                name="delay"
                disabled={testProgress.running}
                sx={{ color: '#6200ee' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={performanceSettings.simulateClient}
                    onChange={handlePerformanceSettingChange}
                    name="simulateClient"
                    color="primary"
                    disabled={testProgress.running}
                  />
                }
                label="Simulate client-side events (received, displayed, clicked)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                disabled={testProgress.running || !pushEnabled}
                startIcon={testProgress.running ? <CircularProgress size={20} /> : <SpeedIcon />}
                onClick={handlePerformanceTest}
                sx={{ 
                  backgroundColor: '#6200ee',
                  '&:hover': {
                    backgroundColor: '#5000d1'
                  }
                }}
              >
                {testProgress.running ? 'Running Test...' : 'Run Performance Test'}
              </Button>
            </Grid>
          </Grid>
          
          {testProgress.running && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Progress: {testProgress.current} / {testProgress.total} notifications
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(testProgress.current / testProgress.total) * 100} 
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="textSecondary">
                  Success: {testProgress.success}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Failed: {testProgress.failed}
                </Typography>
              </Box>
            </Box>
          )}
          
          {renderTestResults()}
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/notifications/performance')}
          startIcon={<AssessmentIcon />}
          sx={{ 
            borderColor: '#6200ee',
            color: '#6200ee',
            '&:hover': {
              borderColor: '#5000d1',
              backgroundColor: `${theme.palette.primary.main}10`
            }
          }}
        >
          View Full Performance Dashboard
        </Button>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationTestPage;
