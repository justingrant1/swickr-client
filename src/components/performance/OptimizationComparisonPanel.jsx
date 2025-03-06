import React, { useState, useEffect } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import CachedIcon from '@mui/icons-material/Cached';
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';

// Import chart components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import performanceService from '../../services/performanceService';

/**
 * Optimization Comparison Panel Component
 * 
 * Visualizes performance comparisons between different optimization strategies
 * for encrypted presence features.
 */
const OptimizationComparisonPanel = ({ autoRefresh = true, refreshInterval = 3000 }) => {
  const theme = useTheme();
  const [comparisonData, setComparisonData] = useState([]);
  const [comparisonType, setComparisonType] = useState('latency');
  const [comparisonView, setComparisonView] = useState('chart');

  // Load comparison data on mount and periodically
  useEffect(() => {
    // Initial load
    loadComparisonData();
    
    // Set up interval for periodic updates if autoRefresh is enabled
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(loadComparisonData, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, comparisonType]);

  // Load comparison data
  const loadComparisonData = () => {
    try {
      // Get comparison data from performance service
      const data = performanceService.getOptimizationComparison(comparisonType);
      setComparisonData(data);
    } catch (error) {
      console.error('Error loading optimization comparison data:', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadComparisonData();
  };

  // Handle comparison type change
  const handleComparisonTypeChange = (event, newType) => {
    if (newType !== null) {
      setComparisonType(newType);
    }
  };

  // Handle view type change
  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setComparisonView(newView);
    }
  };

  // Get chart color based on optimization type
  const getChartColor = (optimizationType) => {
    switch (optimizationType) {
      case 'No Optimization':
        return theme.palette.error.main;
      case 'Cache Only':
        return theme.palette.info.main;
      case 'Worker Only':
        return theme.palette.warning.main;
      case 'Batch Only':
        return theme.palette.secondary.main;
      case 'All Optimizations':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Format chart data for display
  const formatChartData = () => {
    if (!comparisonData || comparisonData.length === 0) {
      return [];
    }

    return comparisonData.map(item => ({
      ...item,
      // Format values for better display
      value: Math.round(item.value * 100) / 100
    }));
  };

  // Get chart title based on comparison type
  const getChartTitle = () => {
    switch (comparisonType) {
      case 'latency':
        return 'End-to-End Latency (ms)';
      case 'throughput':
        return 'Updates Per Second';
      case 'cpu':
        return 'CPU Usage (%)';
      case 'memory':
        return 'Memory Usage (MB)';
      default:
        return 'Performance Comparison';
    }
  };

  // Get improvement percentage compared to no optimization
  const getImprovementPercentage = (optimizationType) => {
    if (!comparisonData || comparisonData.length === 0) {
      return 0;
    }

    const noOptimizationData = comparisonData.find(item => item.name === 'No Optimization');
    const optimizationData = comparisonData.find(item => item.name === optimizationType);

    if (!noOptimizationData || !optimizationData) {
      return 0;
    }

    // For latency and resource usage, lower is better
    if (comparisonType === 'latency' || comparisonType === 'cpu' || comparisonType === 'memory') {
      return Math.round(((noOptimizationData.value - optimizationData.value) / noOptimizationData.value) * 100);
    }
    
    // For throughput, higher is better
    return Math.round(((optimizationData.value - noOptimizationData.value) / noOptimizationData.value) * 100);
  };

  // Get icon for optimization type
  const getOptimizationIcon = (optimizationType) => {
    switch (optimizationType) {
      case 'Cache Only':
        return <CachedIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case 'Worker Only':
        return <MemoryIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case 'Batch Only':
        return <BatchPredictionIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case 'All Optimizations':
        return <SpeedIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      default:
        return null;
    }
  };

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
          <CompareArrowsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Optimization Comparison
          </Typography>
          
          <Tooltip title="Refresh data">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <ToggleButtonGroup
            value={comparisonType}
            exclusive
            onChange={handleComparisonTypeChange}
            size="small"
            aria-label="comparison type"
          >
            <ToggleButton value="latency" aria-label="latency">
              Latency
            </ToggleButton>
            <ToggleButton value="throughput" aria-label="throughput">
              Throughput
            </ToggleButton>
            <ToggleButton value="cpu" aria-label="cpu usage">
              CPU Usage
            </ToggleButton>
            <ToggleButton value="memory" aria-label="memory usage">
              Memory
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={comparisonView}
            exclusive
            onChange={handleViewChange}
            size="small"
            aria-label="view type"
          >
            <ToggleButton value="chart" aria-label="chart view">
              Chart
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Chart View */}
        {comparisonView === 'chart' && (
          <Box sx={{ height: 300, mb: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formatChartData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name, props) => {
                    return [`${value} ${comparisonType === 'latency' ? 'ms' : 
                      comparisonType === 'throughput' ? 'updates/s' : 
                      comparisonType === 'cpu' ? '%' : 'MB'}`, 
                      props.payload.name];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name={getChartTitle()}
                  fill={theme.palette.primary.main}
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  fillOpacity={0.8}
                >
                  {
                    comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getChartColor(entry.name)} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Table View */}
        {comparisonView === 'table' && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              {comparisonData.map((item) => (
                <Grid item xs={12} sm={6} key={item.name}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor: item.name === 'All Optimizations' 
                        ? `${theme.palette.success.main}10` 
                        : undefined,
                      borderColor: item.name === 'All Optimizations'
                        ? theme.palette.success.main
                        : undefined
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getOptimizationIcon(item.name)}
                      <Typography variant="subtitle2">
                        {item.name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {getChartTitle()}:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'medium',
                          color: getChartColor(item.name)
                        }}
                      >
                        {item.value.toFixed(1)} {comparisonType === 'latency' ? 'ms' : 
                          comparisonType === 'throughput' ? 'updates/s' : 
                          comparisonType === 'cpu' ? '%' : 'MB'}
                      </Typography>
                    </Box>
                    
                    {item.name !== 'No Optimization' && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Improvement:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'medium',
                            color: getImprovementPercentage(item.name) > 0 
                              ? theme.palette.success.main 
                              : theme.palette.error.main
                          }}
                        >
                          {getImprovementPercentage(item.name)}%
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Insights */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Performance Insights
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {comparisonType === 'latency' ? (
              <>
                <strong>Latency Impact:</strong> Using all optimizations reduces end-to-end latency by 
                {' '}{getImprovementPercentage('All Optimizations')}% compared to no optimization.
                {getImprovementPercentage('All Optimizations') > 50 ? 
                  ' This significant improvement ensures encrypted presence updates stay well below the 500ms target.' :
                  ' Continue monitoring and optimizing to meet the 500ms target for encrypted presence updates.'}
              </>
            ) : comparisonType === 'throughput' ? (
              <>
                <strong>Throughput Impact:</strong> Using all optimizations increases update throughput by 
                {' '}{getImprovementPercentage('All Optimizations')}% compared to no optimization.
                {getImprovementPercentage('All Optimizations') > 50 ? 
                  ' This allows the system to handle more concurrent users and presence updates.' :
                  ' Further optimization may be needed to support larger user bases.'}
              </>
            ) : comparisonType === 'cpu' ? (
              <>
                <strong>CPU Usage Impact:</strong> Using all optimizations reduces CPU usage by 
                {' '}{getImprovementPercentage('All Optimizations')}% compared to no optimization.
                {getImprovementPercentage('All Optimizations') > 30 ? 
                  ' This significantly improves client-side performance and battery life on mobile devices.' :
                  ' Consider additional optimizations to further reduce CPU usage.'}
              </>
            ) : (
              <>
                <strong>Memory Usage Impact:</strong> Using all optimizations affects memory usage by 
                {' '}{getImprovementPercentage('All Optimizations')}% compared to no optimization.
                {getImprovementPercentage('All Optimizations') > 0 ? 
                  ' The memory savings help improve overall application performance.' :
                  ' The slight increase in memory usage is offset by significant performance gains in other areas.'}
              </>
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Cell component for custom bar colors
const Cell = props => {
  const { fill, x, y, width, height } = props;
  return <rect x={x} y={y} width={width} height={height} fill={fill} radius={[4, 4, 0, 0]} />;
};

export default OptimizationComparisonPanel;
