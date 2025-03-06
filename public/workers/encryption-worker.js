/**
 * Encryption Web Worker
 * 
 * This worker handles encryption and decryption operations in a separate thread
 * to avoid blocking the main UI thread, improving performance and responsiveness.
 */

// Cache for encrypted data to improve performance
const encryptionCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Performance metrics
const metrics = {
  encryptionTime: [],
  decryptionTime: [],
  cacheHits: 0,
  cacheMisses: 0,
  totalOperations: 0,
  batchSizes: []
};

/**
 * Generate a cache key for encryption operations
 */
const generateCacheKey = (data, recipients) => {
  if (!data) return null;
  
  try {
    // For simple data types
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return `${data.toString()}_${recipients.map(r => r.userId || r).sort().join('_')}`;
    }
    
    // For objects and arrays
    return `${JSON.stringify(data)}_${recipients.map(r => r.userId || r).sort().join('_')}`;
  } catch (error) {
    console.warn('Failed to generate cache key:', error);
    return null;
  }
};

// Mock encryption functions (in production, these would use the Web Crypto API)
const encryptData = (data, key) => {
  // Convert data to string if it's an object
  const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  // In a real implementation, this would use the Web Crypto API
  // This is a simplified mock that simulates encryption
  const encoded = new TextEncoder().encode(dataStr);
  const encrypted = new Uint8Array(encoded.length);
  
  // Simple XOR encryption (for demonstration only - NOT secure)
  for (let i = 0; i < encoded.length; i++) {
    encrypted[i] = encoded[i] ^ key.charCodeAt(i % key.length);
  }
  
  return {
    encryptedData: Array.from(encrypted),
    iv: crypto.getRandomValues(new Uint8Array(16))
  };
};

const decryptData = (encryptedData, key, iv) => {
  // In a real implementation, this would use the Web Crypto API
  // This is a simplified mock that simulates decryption
  const encrypted = new Uint8Array(encryptedData);
  const decrypted = new Uint8Array(encrypted.length);
  
  // Simple XOR decryption (for demonstration only - NOT secure)
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ key.charCodeAt(i % key.length);
  }
  
  return new TextDecoder().decode(decrypted);
};

const encryptGroupMessage = (message, recipients, useCache = true) => {
  metrics.totalOperations++;
  const startTime = performance.now();
  
  try {
    // Check cache first if caching is enabled
    if (useCache) {
      const cacheKey = generateCacheKey(message, recipients);
      if (cacheKey && encryptionCache.has(cacheKey)) {
        metrics.cacheHits++;
        const cachedResult = encryptionCache.get(cacheKey);
        
        // Add processing time to the cached result
        const endTime = performance.now();
        return {
          ...cachedResult,
          processingTime: endTime - startTime,
          fromCache: true
        };
      }
      metrics.cacheMisses++;
    }
    
    // Generate a random symmetric key
    const symmetricKey = Math.random().toString(36).substring(2, 10);
    
    // Encrypt the message with the symmetric key
    const { encryptedData, iv } = encryptData(message, symmetricKey);
    
    // Encrypt the symmetric key for each recipient
    const recipientKeys = {};
    recipients.forEach(recipient => {
      // In a real implementation, we would encrypt the symmetric key
      // with each recipient's public key
      const publicKey = recipient.publicKey || recipient;
      recipientKeys[recipient.userId || recipient] = encryptData(symmetricKey, publicKey).encryptedData;
    });
    
    const result = {
      encryptedMessage: encryptedData,
      iv: Array.from(iv),
      recipientKeys
    };
    
    // Cache the result if caching is enabled
    if (useCache) {
      const cacheKey = generateCacheKey(message, recipients);
      if (cacheKey) {
        encryptionCache.set(cacheKey, result);
        
        // Limit cache size
        if (encryptionCache.size > MAX_CACHE_SIZE) {
          const oldestKey = encryptionCache.keys().next().value;
          encryptionCache.delete(oldestKey);
        }
      }
    }
    
    // Calculate and store encryption time
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    metrics.encryptionTime.push(processingTime);
    
    // Keep only the last 100 measurements
    if (metrics.encryptionTime.length > 100) {
      metrics.encryptionTime.shift();
    }
    
    return {
      ...result,
      processingTime,
      fromCache: false
    };
  } catch (error) {
    const endTime = performance.now();
    return { 
      error: error.message,
      processingTime: endTime - startTime
    };
  }
};

const decryptMessage = (encryptedMessage, iv, encryptedKey, privateKey) => {
  metrics.totalOperations++;
  const startTime = performance.now();
  
  try {
    // Decrypt the symmetric key using the private key
    const symmetricKey = decryptData(encryptedKey, privateKey);
    
    // Decrypt the message using the symmetric key
    const decryptedMessage = decryptData(encryptedMessage, symmetricKey, iv);
    
    // Calculate and store decryption time
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    metrics.decryptionTime.push(processingTime);
    
    // Keep only the last 100 measurements
    if (metrics.decryptionTime.length > 100) {
      metrics.decryptionTime.shift();
    }
    
    return { 
      decryptedMessage,
      processingTime
    };
  } catch (error) {
    const endTime = performance.now();
    return { 
      error: error.message,
      processingTime: endTime - startTime
    };
  }
};

/**
 * Get current metrics
 */
const getMetrics = () => {
  const avgEncryptionTime = metrics.encryptionTime.length > 0
    ? metrics.encryptionTime.reduce((a, b) => a + b, 0) / metrics.encryptionTime.length
    : 0;
    
  const avgDecryptionTime = metrics.decryptionTime.length > 0
    ? metrics.decryptionTime.reduce((a, b) => a + b, 0) / metrics.decryptionTime.length
    : 0;
    
  const avgBatchSize = metrics.batchSizes.length > 0
    ? metrics.batchSizes.reduce((a, b) => a + b, 0) / metrics.batchSizes.length
    : 0;
    
  return {
    averageEncryptionTime: avgEncryptionTime,
    averageDecryptionTime: avgDecryptionTime,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    cacheHitRate: metrics.totalOperations > 0
      ? (metrics.cacheHits / metrics.totalOperations) * 100
      : 0,
    totalOperations: metrics.totalOperations,
    averageBatchSize: avgBatchSize,
    cacheSize: encryptionCache.size
  };
};

/**
 * Clear the cache
 */
const clearCache = () => {
  encryptionCache.clear();
  return { success: true, message: 'Cache cleared' };
};

/**
 * Reset metrics
 */
const resetMetrics = () => {
  metrics.encryptionTime = [];
  metrics.decryptionTime = [];
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.totalOperations = 0;
  metrics.batchSizes = [];
  return { success: true, message: 'Metrics reset' };
};

/**
 * Handle messages from the main thread
 */
self.onmessage = (e) => {
  const { action, data } = e.data;
  const taskId = data?.callbackId;
  const timestamp = data?.timestamp || Date.now();
  
  try {
    switch (action) {
      case 'encrypt':
        // Encrypt data for a group of recipients
        const encryptedResult = encryptGroupMessage(data.message, data.recipients);
        self.postMessage({ 
          action: 'encrypt_result', 
          encryptedData: {
            ...encryptedResult,
            callbackId: taskId
          },
          taskId,
          processingTime: encryptedResult.processingTime
        });
        break;
        
      case 'decrypt':
        // Decrypt data using the user's private key
        const decryptedResult = decryptMessage(
          data.encryptedMessage,
          data.iv,
          data.encryptedKey,
          data.privateKey
        );
        self.postMessage({ 
          action: 'decrypt_result', 
          decryptedData: {
            ...decryptedResult,
            callbackId: taskId
          },
          taskId,
          processingTime: decryptedResult.processingTime
        });
        break;
        
      case 'encrypt_presence':
        // Encrypt presence data (typing indicators, read receipts, etc.)
        // Use aggressive caching for presence data
        const encryptedPresence = encryptGroupMessage(data.presenceData, data.recipients, true);
        self.postMessage({ 
          action: 'encrypt_presence_result', 
          encryptedData: {
            ...encryptedPresence,
            presenceType: data.presenceType,
            callbackId: taskId
          },
          taskId,
          processingTime: encryptedPresence.processingTime
        });
        break;
        
      case 'decrypt_presence':
        // Decrypt presence data
        const decryptedPresence = decryptMessage(
          data.encryptedData,
          data.iv,
          data.encryptedKey,
          data.privateKey
        );
        self.postMessage({ 
          action: 'decrypt_presence_result', 
          decryptedData: {
            ...decryptedPresence,
            presenceType: data.presenceType,
            callbackId: taskId
          },
          taskId,
          processingTime: decryptedPresence.processingTime
        });
        break;
        
      case 'batch_encrypt':
        // Track batch size for metrics
        if (data.batch && data.batch.length) {
          metrics.batchSizes.push(data.batch.length);
          if (metrics.batchSizes.length > 100) {
            metrics.batchSizes.shift();
          }
        }
        
        // Batch encrypt multiple presence updates
        const startBatchTime = performance.now();
        const batchResults = data.batch.map(item => ({
          id: item.id,
          result: encryptGroupMessage(item.data, data.recipients, true)
        }));
        const endBatchTime = performance.now();
        
        self.postMessage({ 
          action: 'batch_encrypt_result', 
          results: batchResults.map(result => ({
            ...result,
            callbackId: taskId
          })),
          taskId,
          processingTime: endBatchTime - startBatchTime,
          batchSize: data.batch.length
        });
        break;
        
      case 'get_metrics':
        // Return current metrics
        self.postMessage({ 
          action: 'metrics_result', 
          metrics: getMetrics(),
          taskId
        });
        break;
        
      case 'clear_cache':
        // Clear the encryption cache
        self.postMessage({ 
          action: 'cache_cleared', 
          result: clearCache(),
          taskId
        });
        break;
        
      case 'reset_metrics':
        // Reset performance metrics
        self.postMessage({ 
          action: 'metrics_reset', 
          result: resetMetrics(),
          taskId
        });
        break;
        
      default:
        self.postMessage({ 
          error: `Unknown action: ${action}`,
          taskId
        });
    }
  } catch (error) {
    self.postMessage({ 
      error: error.message,
      action: `${action}_error`,
      taskId
    });
  }
};

// Notify the main thread that the worker is ready
self.postMessage({ status: 'ready' });
