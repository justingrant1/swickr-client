import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

/**
 * Notification Performance Chart Component
 * 
 * Displays a visual chart of notification performance metrics over time
 * Can be used in the performance dashboard or other components
 */
const NotificationPerformanceChart = ({ 
  timeRange = 'daily', // 'hourly', 'daily', 'weekly'
  height = 300,
  showTitle = true
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authToken } = useAuth();
  const theme = useTheme();

  // Primary and accent colors from Swickr's brand identity
  const primaryColor = '#6200ee'; // Purple
  const accentColor = '#0284c7';  // Blue

  // Fetch performance data based on time range
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let endpoint = '/api/notifications/performance/daily';
        if (timeRange === 'hourly') {
          endpoint = '/api/notifications/performance/hourly';
        } else if (timeRange === 'weekly') {
          endpoint = '/api/notifications/performance/weekly';
        }
        
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        if (response.data.success) {
          setData(response.data.data);
          setError(null);
        } else {
          setError(response.data.error || 'Failed to fetch performance data');
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, authToken]);

  // Format time label based on time range
  const formatTimeLabel = (timestamp) => {
    const date = new Date(timestamp);
    
    if (timeRange === 'hourly') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === 'daily') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (timeRange === 'weekly') {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
    
    return timestamp;
  };

  // Calculate chart dimensions
  const chartWidth = '100%';
  const chartHeight = height;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  
  // If loading or no data, show loading or empty state
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: chartHeight
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: chartHeight
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: chartHeight,
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 1
        }}
      >
        <Typography color="textSecondary">No performance data available</Typography>
      </Box>
    );
  }
  
  // Calculate max values for scaling
  const maxSuccessRate = Math.max(...data.map(d => d.successRate || 0), 100);
  const maxAvgTime = Math.max(...data.map(d => d.averageDuration || 0), 1000);
  const maxCount = Math.max(...data.map(d => d.sendCount || 0), 10);
  
  // Calculate scales
  const timeScale = index => (index / (data.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
  const successRateScale = value => chartHeight - padding.bottom - ((value / maxSuccessRate) * (chartHeight - padding.top - padding.bottom));
  const avgTimeScale = value => chartHeight - padding.bottom - ((value / maxAvgTime) * (chartHeight - padding.top - padding.bottom));
  const countScale = value => chartHeight - padding.bottom - ((value / maxCount) * (chartHeight - padding.top - padding.bottom));
  
  // Generate path data
  const successRatePath = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${timeScale(i)} ${successRateScale(d.successRate || 0)}`
  ).join(' ');
  
  const avgTimePath = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${timeScale(i)} ${avgTimeScale(d.averageDuration || 0)}`
  ).join(' ');
  
  const countPath = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${timeScale(i)} ${countScale(d.sendCount || 0)}`
  ).join(' ');

  return (
    <Box sx={{ width: '100%' }}>
      {showTitle && (
        <Typography variant="h6" gutterBottom>
          Notification Performance Trends
        </Typography>
      )}
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 2, 
          border: `1px solid ${theme.palette.divider}`,
          height: chartHeight
        }}
      >
        <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
          {/* X-axis */}
          <line 
            x1={padding.left} 
            y1={chartHeight - padding.bottom} 
            x2={chartWidth - padding.right} 
            y2={chartHeight - padding.bottom} 
            stroke={theme.palette.divider} 
            strokeWidth={1} 
          />
          
          {/* Y-axis */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight - padding.bottom} 
            stroke={theme.palette.divider} 
            strokeWidth={1} 
          />
          
          {/* Success rate line */}
          <path 
            d={successRatePath} 
            fill="none" 
            stroke={primaryColor} 
            strokeWidth={2} 
          />
          
          {/* Average time line */}
          <path 
            d={avgTimePath} 
            fill="none" 
            stroke={accentColor} 
            strokeWidth={2} 
            strokeDasharray="5,5" 
          />
          
          {/* Time labels */}
          {data.map((d, i) => (
            i % Math.ceil(data.length / 5) === 0 && (
              <g key={`time-${i}`}>
                <line 
                  x1={timeScale(i)} 
                  y1={chartHeight - padding.bottom} 
                  x2={timeScale(i)} 
                  y2={chartHeight - padding.bottom + 5} 
                  stroke={theme.palette.text.secondary} 
                  strokeWidth={1} 
                />
                <text 
                  x={timeScale(i)} 
                  y={chartHeight - padding.bottom + 20} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill={theme.palette.text.secondary}
                >
                  {formatTimeLabel(d.timestamp)}
                </text>
              </g>
            )
          ))}
          
          {/* Data points for success rate */}
          {data.map((d, i) => (
            <circle 
              key={`success-${i}`}
              cx={timeScale(i)} 
              cy={successRateScale(d.successRate || 0)} 
              r={3} 
              fill={primaryColor} 
            />
          ))}
          
          {/* Data points for average time */}
          {data.map((d, i) => (
            <circle 
              key={`time-${i}`}
              cx={timeScale(i)} 
              cy={avgTimeScale(d.averageDuration || 0)} 
              r={3} 
              fill={accentColor} 
            />
          ))}
          
          {/* Legend */}
          <g transform={`translate(${padding.left + 10}, ${padding.top + 20})`}>
            <line x1={0} y1={0} x2={20} y2={0} stroke={primaryColor} strokeWidth={2} />
            <circle cx={10} cy={0} r={3} fill={primaryColor} />
            <text x={25} y={4} fontSize="12" fill={theme.palette.text.primary}>Success Rate</text>
            
            <line x1={0} y1={20} x2={20} y2={20} stroke={accentColor} strokeWidth={2} strokeDasharray="5,5" />
            <circle cx={10} cy={20} r={3} fill={accentColor} />
            <text x={25} y={24} fontSize="12" fill={theme.palette.text.primary}>Avg. Time</text>
          </g>
        </svg>
      </Paper>
    </Box>
  );
};

export default NotificationPerformanceChart;
