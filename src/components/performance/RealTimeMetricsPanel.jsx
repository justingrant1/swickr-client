import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Import chart components
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import performanceService from '../../services/performanceService';

/**
 * Real-Time Metrics Panel Component
 * 
 * Displays real-time performance metrics for encrypted presence features
 * with time-series visualization.
 */
const RealTimeMetricsPanel = ({ autoRefresh = true, refreshInterval = 1000 }) => {
  const theme = useTheme();
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(true);
  const [maxDataPoints, setMaxDataPoints] = useState(30);
  const [selectedMetrics, setSelectedMetrics] = useState({
    presenceLatency: true,
    messageLatency: true,
    throughput: true
  });
  
  // Reference to store the last timestamp
  const lastTimestampRef = useRef(Date.now());

  // Load metrics on mount and periodically
  useEffect(() => {
    // Initial load
    if (isRecording) {
      loadLatestMetrics();
    }
    
    // Set up interval for periodic updates if autoRefresh and recording are enabled
    let intervalId;
    if (autoRefresh && isRecording) {
      intervalId = setInterval(loadLatestMetrics, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, isRecording]);

  // Load latest metrics and update history
  const loadLatestMetrics = () => {
    try {
      // Get latest metrics
      const networkMetrics = performanceService.getNetworkMetrics();
      
      // Create timestamp
      const timestamp = Date.now();
      const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      
      // Calculate time difference in seconds for throughput calculation
      const timeDiffSeconds = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;
      
      // Calculate throughput (presence updates per second)
      const throughput = networkMetrics.presenceUpdatesPerSecond || 0;
      
      // Create new data point
      const newDataPoint = {
        timestamp,
        time: formattedTime,
        presenceLatency: networkMetrics.presenceLatency || 0,
        messageLatency: networkMetrics.messageLatency || 0,
        throughput
      };
      
      // Update metrics history, keeping only the most recent maxDataPoints
      setMetricsHistory(prevHistory => {
        const updatedHistory = [...prevHistory, newDataPoint];
        return updatedHistory.slice(-maxDataPoints);
      });
    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadLatestMetrics();
  };

  // Handle recording toggle
  const handleRecordingToggle = () => {
    setIsRecording(prev => !prev);
  };

  // Handle metric selection change
  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // Clear metrics history
  const clearHistory = () => {
    setMetricsHistory([]);
    lastTimestampRef.current = Date.now();
  };

  // Get color for latency values
  const getLatencyColor = (latency) => {
    if (latency <= 300) return theme.palette.success.main;
    if (latency <= 500) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Format value for display in tooltip
  const formatTooltipValue = (value, name) => {
    if (name === 'presenceLatency' || name === 'messageLatency') {
      return `${value.toFixed(1)} ms`;
    }
    if (name === 'throughput') {
      return `${value.toFixed(1)} updates/s`;
    }
    return value;
  };

  // Get friendly name for metric
  const getMetricName = (metric) => {
    switch (metric) {
      case 'presenceLatency':
        return 'Presence Latency';
      case 'messageLatency':
        return 'Message Latency';
      case 'throughput':
        return 'Updates/Second';
      default:
        return metric;
    }
  };

  // Get latest metrics for summary display
  const getLatestMetrics = () => {
    if (metricsHistory.length === 0) {
      return {
        presenceLatency: 0,
        messageLatency: 0,
        throughput: 0
      };
    }
    return metricsHistory[metricsHistory.length - 1];
  };

  // Get average metrics over the recorded history
  const getAverageMetrics = () => {
    if (metricsHistory.length === 0) {
      return {
        presenceLatency: 0,
        messageLatency: 0,
        throughput: 0
      };
    }
    
    const sum = metricsHistory.reduce((acc, item) => ({
      presenceLatency: acc.presenceLatency + item.presenceLatency,
      messageLatency: acc.messageLatency + item.messageLatency,
      throughput: acc.throughput + item.throughput
    }), { presenceLatency: 0, messageLatency: 0, throughput: 0 });
    
    return {
      presenceLatency: sum.presenceLatency / metricsHistory.length,
      messageLatency: sum.messageLatency / metricsHistory.length,
      throughput: sum.throughput / metricsHistory.length
    };
  };

  // Get custom line stroke color
  const getLineColor = (dataKey) => {
    switch (dataKey) {
      case 'presenceLatency':
        return theme.palette.primary.main;
      case 'messageLatency':
        return theme.palette.secondary.main;
      case 'throughput':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  // Latest and average metrics for display
  const latestMetrics = getLatestMetrics();
  const averageMetrics = getAverageMetrics();

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
          <TimelineIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Real-Time Performance Metrics
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={isRecording} 
                onChange={handleRecordingToggle}
                size="small"
                color="primary"
              />
            }
            label={isRecording ? "Recording" : "Paused"}
            sx={{ mr: 1 }}
          />
          
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
                Current Presence Latency
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getLatencyColor(latestMetrics.presenceLatency),
                  fontWeight: 'medium'
                }}
              >
                {latestMetrics.presenceLatency.toFixed(1)} ms
              </Typography>
              <TimerIcon 
                sx={{ 
                  mt: 1, 
                  color: getLatencyColor(latestMetrics.presenceLatency),
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
                Average Presence Latency
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: getLatencyColor(averageMetrics.presenceLatency),
                  fontWeight: 'medium'
                }}
              >
                {averageMetrics.presenceLatency.toFixed(1)} ms
              </Typography>
              <SpeedIcon 
                sx={{ 
                  mt: 1, 
                  color: getLatencyColor(averageMetrics.presenceLatency),
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
                Current Updates/Second
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {latestMetrics.throughput.toFixed(1)}
              </Typography>
              <VisibilityIcon sx={{ mt: 1, opacity: 0.7 }} />
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
                Average Updates/Second
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'medium' }}
              >
                {averageMetrics.throughput.toFixed(1)}
              </Typography>
              <VisibilityIcon sx={{ mt: 1, opacity: 0.7 }} />
            </Paper>
          </Grid>
        </Grid>

        {/* Metric Selection */}
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={selectedMetrics.presenceLatency} 
                onChange={() => handleMetricToggle('presenceLatency')}
                size="small"
                color="primary"
              />
            }
            label="Presence Latency"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={selectedMetrics.messageLatency} 
                onChange={() => handleMetricToggle('messageLatency')}
                size="small"
                color="secondary"
              />
            }
            label="Message Latency"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={selectedMetrics.throughput} 
                onChange={() => handleMetricToggle('throughput')}
                size="small"
                color="success"
              />
            }
            label="Updates/Second"
          />
        </Box>

        {/* Real-Time Chart */}
        <Box sx={{ height: 300, mb: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metricsHistory}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <RechartsTooltip 
                formatter={formatTooltipValue}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              
              {selectedMetrics.presenceLatency && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="presenceLatency"
                  name="Presence Latency"
                  stroke={getLineColor('presenceLatency')}
                  activeDot={{ r: 8 }}
                  dot={{ r: 3 }}
                  strokeWidth={2}
                />
              )}
              
              {selectedMetrics.messageLatency && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="messageLatency"
                  name="Message Latency"
                  stroke={getLineColor('messageLatency')}
                  activeDot={{ r: 8 }}
                  dot={{ r: 3 }}
                  strokeWidth={2}
                />
              )}
              
              {selectedMetrics.throughput && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="throughput"
                  name="Updates/Second"
                  stroke={getLineColor('throughput')}
                  activeDot={{ r: 8 }}
                  dot={{ r: 3 }}
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Performance Analysis */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Performance Analysis
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {averageMetrics.presenceLatency <= 500 ? (
              <>
                <strong>Excellent Performance:</strong> Average presence latency of {averageMetrics.presenceLatency.toFixed(1)}ms 
                is within the target of &lt;500ms. The system is handling {averageMetrics.throughput.toFixed(1)} encrypted presence 
                updates per second with optimal performance.
              </>
            ) : averageMetrics.presenceLatency <= 800 ? (
              <>
                <strong>Acceptable Performance:</strong> Average presence latency of {averageMetrics.presenceLatency.toFixed(1)}ms 
                is slightly above the target of &lt;500ms. Consider enabling additional optimizations to improve performance.
              </>
            ) : (
              <>
                <strong>Performance Warning:</strong> Average presence latency of {averageMetrics.presenceLatency.toFixed(1)}ms 
                exceeds the target of &lt;500ms. Enable worker-based encryption and batch processing to improve performance.
              </>
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RealTimeMetricsPanel;
