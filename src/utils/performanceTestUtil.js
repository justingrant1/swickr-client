/**
 * Performance Test Utility for Encrypted Presence Features
 * 
 * This utility provides methods to test and benchmark the performance of
 * encrypted presence features in Swickr, including encryption/decryption times,
 * network latency, and overall end-to-end performance.
 */

import performanceService from '../services/performanceService';
import workerService from '../services/workerService';

/**
 * Run a complete performance test suite for encrypted presence features
 * @param {Object} options - Test configuration options
 * @param {number} options.iterations - Number of test iterations to run (default: 100)
 * @param {boolean} options.useWorker - Whether to use Web Worker for encryption (default: true)
 * @param {boolean} options.useCache - Whether to use caching (default: true)
 * @param {boolean} options.useBatch - Whether to use batch processing (default: true)
 * @param {number} options.batchSize - Batch size for batch processing (default: 10)
 * @param {Function} options.onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Test results
 */
export const runPerformanceTest = async (options = {}) => {
  const {
    iterations = 100,
    useWorker = true,
    useCache = true,
    useBatch = true,
    batchSize = 10,
    onProgress = null
  } = options;

  // Store original configuration to restore later
  const originalConfig = {
    useWorker: performanceService.getConfig().useWorker,
    useCache: performanceService.getConfig().useCache,
    useBatch: performanceService.getConfig().useBatch,
    batchSize: performanceService.getConfig().batchSize
  };

  // Apply test configuration
  performanceService.updateConfig({
    useWorker,
    useCache,
    useBatch,
    batchSize
  });

  // Reset metrics before starting test
  performanceService.resetMetrics();

  // Test results
  const results = {
    encryptionTimes: [],
    decryptionTimes: [],
    networkLatencies: [],
    endToEndLatencies: [],
    summary: {}
  };

  try {
    // Generate test data - simulate presence updates
    const testData = Array.from({ length: iterations }, (_, i) => ({
      userId: `user-${Math.floor(Math.random() * 100)}`,
      status: ['online', 'away', 'typing'][Math.floor(Math.random() * 3)],
      timestamp: Date.now(),
      data: `Test data ${i} with some random content ${Math.random()}`
    }));

    // Process test data
    for (let i = 0; i < testData.length; i++) {
      const item = testData[i];
      
      // Simulate encryption
      const encryptStart = performance.now();
      const encrypted = await encryptPresenceData(item, useWorker);
      const encryptEnd = performance.now();
      
      // Record encryption time
      const encryptionTime = encryptEnd - encryptStart;
      results.encryptionTimes.push(encryptionTime);
      
      // Simulate network transmission
      const networkStart = performance.now();
      await simulateNetworkTransmission(encrypted);
      const networkEnd = performance.now();
      
      // Record network latency
      const networkLatency = networkEnd - networkStart;
      results.networkLatencies.push(networkLatency);
      
      // Simulate decryption
      const decryptStart = performance.now();
      await decryptPresenceData(encrypted, useWorker);
      const decryptEnd = performance.now();
      
      // Record decryption time
      const decryptionTime = decryptEnd - decryptStart;
      results.decryptionTimes.push(decryptionTime);
      
      // Record end-to-end latency
      const endToEndLatency = encryptionTime + networkLatency + decryptionTime;
      results.endToEndLatencies.push(endToEndLatency);
      
      // Report progress
      if (onProgress) {
        onProgress({
          iteration: i + 1,
          total: iterations,
          progress: ((i + 1) / iterations) * 100,
          currentLatency: endToEndLatency
        });
      }
    }
    
    // Calculate summary statistics
    results.summary = {
      encryption: calculateStats(results.encryptionTimes),
      decryption: calculateStats(results.decryptionTimes),
      network: calculateStats(results.networkLatencies),
      endToEnd: calculateStats(results.endToEndLatencies),
      totalIterations: iterations,
      configuration: {
        useWorker,
        useCache,
        useBatch,
        batchSize
      },
      timestamp: new Date().toISOString(),
      meetsTarget: calculateStats(results.endToEndLatencies).average < 500
    };
    
  } catch (error) {
    console.error('Error running performance test:', error);
    throw error;
  } finally {
    // Restore original configuration
    performanceService.updateConfig(originalConfig);
  }
  
  return results;
};

/**
 * Run multiple performance tests with different configurations and compare results
 * @param {Array<Object>} configurations - Array of test configurations
 * @param {number} iterations - Number of iterations per test
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Comparison results
 */
export const compareOptimizationStrategies = async (
  configurations = [
    { name: 'No Optimization', useWorker: false, useCache: false, useBatch: false },
    { name: 'Worker Only', useWorker: true, useCache: false, useBatch: false },
    { name: 'Cache Only', useWorker: false, useCache: true, useBatch: false },
    { name: 'Batch Only', useWorker: false, useCache: false, useBatch: true },
    { name: 'All Optimizations', useWorker: true, useCache: true, useBatch: true }
  ],
  iterations = 50,
  onProgress = null
) => {
  const results = [];
  
  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    
    if (onProgress) {
      onProgress({
        phase: 'start',
        configName: config.name,
        configIndex: i,
        totalConfigs: configurations.length
      });
    }
    
    const testResult = await runPerformanceTest({
      iterations,
      ...config,
      onProgress: (progress) => {
        if (onProgress) {
          onProgress({
            phase: 'running',
            configName: config.name,
            configIndex: i,
            totalConfigs: configurations.length,
            ...progress
          });
        }
      }
    });
    
    results.push({
      name: config.name,
      configuration: config,
      summary: testResult.summary
    });
    
    if (onProgress) {
      onProgress({
        phase: 'complete',
        configName: config.name,
        configIndex: i,
        totalConfigs: configurations.length
      });
    }
  }
  
  // Calculate improvement percentages relative to no optimization
  const baselineResult = results.find(r => r.name === 'No Optimization');
  if (baselineResult) {
    const baselineEndToEnd = baselineResult.summary.endToEnd.average;
    
    results.forEach(result => {
      if (result.name !== 'No Optimization') {
        const currentEndToEnd = result.summary.endToEnd.average;
        const improvementPercent = ((baselineEndToEnd - currentEndToEnd) / baselineEndToEnd) * 100;
        result.improvementPercent = parseFloat(improvementPercent.toFixed(2));
      }
    });
  }
  
  return {
    results,
    timestamp: new Date().toISOString(),
    iterations
  };
};

/**
 * Calculate statistics for an array of values
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} Statistics object with min, max, average, median, and percentiles
 */
const calculateStats = (values) => {
  if (!values || values.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      p95: 0,
      p99: 0
    };
  }
  
  // Sort values for percentile calculations
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate statistics
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const sum = sortedValues.reduce((acc, val) => acc + val, 0);
  const average = sum / sortedValues.length;
  
  // Calculate median (50th percentile)
  const medianIndex = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
    : sortedValues[medianIndex];
  
  // Calculate 95th percentile
  const p95Index = Math.floor(sortedValues.length * 0.95);
  const p95 = sortedValues[p95Index];
  
  // Calculate 99th percentile
  const p99Index = Math.floor(sortedValues.length * 0.99);
  const p99 = sortedValues[p99Index];
  
  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    average: parseFloat(average.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    p95: parseFloat(p95.toFixed(2)),
    p99: parseFloat(p99.toFixed(2))
  };
};

/**
 * Simulate encrypting presence data
 * @param {Object} data - Data to encrypt
 * @param {boolean} useWorker - Whether to use Web Worker
 * @returns {Promise<Object>} Encrypted data
 */
const encryptPresenceData = async (data, useWorker) => {
  // In a real implementation, this would use actual encryption
  // For this test utility, we'll simulate encryption time
  
  const dataStr = JSON.stringify(data);
  
  if (useWorker) {
    // Simulate worker-based encryption (typically faster)
    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 15));
  } else {
    // Simulate main thread encryption (typically slower)
    await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 25));
  }
  
  // Simulate encrypted data
  return {
    encryptedData: btoa(dataStr),
    metadata: {
      timestamp: Date.now(),
      userId: data.userId
    }
  };
};

/**
 * Simulate decrypting presence data
 * @param {Object} encryptedData - Encrypted data
 * @param {boolean} useWorker - Whether to use Web Worker
 * @returns {Promise<Object>} Decrypted data
 */
const decryptPresenceData = async (encryptedData, useWorker) => {
  // In a real implementation, this would use actual decryption
  // For this test utility, we'll simulate decryption time
  
  if (useWorker) {
    // Simulate worker-based decryption (typically faster)
    await new Promise(resolve => setTimeout(resolve, 3 + Math.random() * 12));
  } else {
    // Simulate main thread decryption (typically slower)
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
  }
  
  // Simulate decrypted data
  const dataStr = atob(encryptedData.encryptedData);
  return JSON.parse(dataStr);
};

/**
 * Simulate network transmission of encrypted data
 * @param {Object} encryptedData - Encrypted data to transmit
 * @returns {Promise<void>}
 */
const simulateNetworkTransmission = async (encryptedData) => {
  // Simulate network latency with random variation
  // Normal distribution around 100ms with jitter
  const baseLatency = 100;
  const jitter = Math.random() * 50 - 25; // -25 to +25ms jitter
  
  // Occasional packet loss or retransmission (5% chance)
  const hasIssue = Math.random() < 0.05;
  const retransmissionDelay = hasIssue ? 200 + Math.random() * 300 : 0;
  
  // Total simulated network latency
  const totalLatency = Math.max(10, baseLatency + jitter + retransmissionDelay);
  
  await new Promise(resolve => setTimeout(resolve, totalLatency));
};

export default {
  runPerformanceTest,
  compareOptimizationStrategies
};
