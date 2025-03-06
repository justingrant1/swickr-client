/**
 * Encryption Utilities
 * 
 * Provides utility functions for encryption/decryption operations
 * that can be used both in the main thread and web workers.
 * This file serves as a fallback mechanism when web workers are not available
 * or when worker operations fail.
 */

// Cache for encrypted data to improve performance
const encryptionCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Performance metrics
let metrics = {
  encryptionTime: [],
  decryptionTime: [],
  cacheHits: 0,
  cacheMisses: 0,
  totalOperations: 0
};

/**
 * Generate a cache key for encryption operations
 */
const generateCacheKey = (data, recipients) => {
  if (!data) return null;
  
  try {
    // For simple data types
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return `${data.toString()}_${recipients.sort().join('_')}`;
    }
    
    // For objects and arrays
    return `${JSON.stringify(data)}_${recipients.sort().join('_')}`;
  } catch (error) {
    console.warn('Failed to generate cache key:', error);
    return null;
  }
};

/**
 * Clear the encryption cache
 */
export const clearCache = () => {
  encryptionCache.clear();
  return { success: true, message: 'Cache cleared' };
};

/**
 * Get current metrics
 */
export const getMetrics = () => {
  const avgEncryptionTime = metrics.encryptionTime.length > 0
    ? metrics.encryptionTime.reduce((a, b) => a + b, 0) / metrics.encryptionTime.length
    : 0;
    
  const avgDecryptionTime = metrics.decryptionTime.length > 0
    ? metrics.decryptionTime.reduce((a, b) => a + b, 0) / metrics.decryptionTime.length
    : 0;
    
  return {
    averageEncryptionTime: avgEncryptionTime,
    averageDecryptionTime: avgDecryptionTime,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    cacheHitRate: metrics.totalOperations > 0
      ? (metrics.cacheHits / metrics.totalOperations) * 100
      : 0,
    totalOperations: metrics.totalOperations
  };
};

/**
 * Reset metrics
 */
export const resetMetrics = () => {
  metrics = {
    encryptionTime: [],
    decryptionTime: [],
    cacheHits: 0,
    cacheMisses: 0,
    totalOperations: 0
  };
  return { success: true, message: 'Metrics reset' };
};

/**
 * Encrypt data
 * 
 * This is a simplified implementation for demonstration purposes.
 * In a real application, you would use a proper encryption library.
 */
export const encryptData = (data, recipients) => {
  metrics.totalOperations++;
  
  // Check cache first
  const cacheKey = generateCacheKey(data, recipients);
  if (cacheKey && encryptionCache.has(cacheKey)) {
    metrics.cacheHits++;
    return encryptionCache.get(cacheKey);
  }
  
  metrics.cacheMisses++;
  
  // Measure encryption time
  const startTime = performance.now();
  
  // Simulate encryption (in a real app, use a proper encryption library)
  // This is just a placeholder implementation
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const ivString = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Simulate different encrypted keys for each recipient
  const encryptedKeys = {};
  recipients.forEach(recipient => {
    // In a real implementation, this would use the recipient's public key
    encryptedKeys[recipient] = `encrypted_key_for_${recipient}_${Date.now()}`;
  });
  
  // Simulate encrypted data
  const encryptedData = {
    data: btoa(JSON.stringify(data)), // Base64 encode as a simple "encryption"
    iv: ivString,
    encryptedKeys,
    timestamp: Date.now(),
    algorithm: 'AES-GCM'
  };
  
  // Calculate encryption time
  const endTime = performance.now();
  const encryptionTime = endTime - startTime;
  
  // Update metrics
  metrics.encryptionTime.push(encryptionTime);
  if (metrics.encryptionTime.length > 100) {
    metrics.encryptionTime.shift(); // Keep only last 100 measurements
  }
  
  // Cache the result
  if (cacheKey) {
    encryptionCache.set(cacheKey, encryptedData);
    
    // Limit cache size
    if (encryptionCache.size > MAX_CACHE_SIZE) {
      const oldestKey = encryptionCache.keys().next().value;
      encryptionCache.delete(oldestKey);
    }
  }
  
  return {
    ...encryptedData,
    processingTime: encryptionTime
  };
};

/**
 * Decrypt data
 * 
 * This is a simplified implementation for demonstration purposes.
 * In a real application, you would use a proper decryption library.
 */
export const decryptData = (encryptedMessage, iv, encryptedKey, privateKey) => {
  metrics.totalOperations++;
  
  // Measure decryption time
  const startTime = performance.now();
  
  // Simulate decryption (in a real app, use a proper decryption library)
  // This is just a placeholder implementation
  let decryptedData;
  
  try {
    // In a real implementation, this would use the private key to decrypt
    decryptedData = JSON.parse(atob(encryptedMessage)); // Base64 decode as a simple "decryption"
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
  
  // Calculate decryption time
  const endTime = performance.now();
  const decryptionTime = endTime - startTime;
  
  // Update metrics
  metrics.decryptionTime.push(decryptionTime);
  if (metrics.decryptionTime.length > 100) {
    metrics.decryptionTime.shift(); // Keep only last 100 measurements
  }
  
  return {
    data: decryptedData,
    processingTime: decryptionTime
  };
};

/**
 * Batch encrypt multiple data items
 */
export const batchEncrypt = (dataItems, recipients) => {
  return dataItems.map(item => ({
    id: item.id,
    result: encryptData(item.data, recipients)
  }));
};

/**
 * Optimize encryption for presence data
 * 
 * Specialized encryption for presence indicators that can be optimized
 * for performance since they are frequently updated
 */
export const encryptPresenceData = (presenceData, recipients, presenceType) => {
  const result = encryptData(presenceData, recipients);
  return {
    ...result,
    presenceType
  };
};

export default {
  encryptData,
  decryptData,
  batchEncrypt,
  encryptPresenceData,
  clearCache,
  getMetrics,
  resetMetrics
};
