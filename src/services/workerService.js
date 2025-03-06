/**
 * Worker Service
 * 
 * Provides a dedicated service for managing Web Worker operations,
 * particularly for encryption tasks to improve performance.
 */

// Worker instance
let encryptionWorker = null;
let workerReady = false;
let pendingTasks = [];
let callbackMap = new Map();
let callbackCounter = 0;

// Performance metrics
let workerMetrics = {
  totalTasks: 0,
  successfulTasks: 0,
  failedTasks: 0,
  averageProcessingTime: 0,
  processingTimes: [],
  maxConcurrentTasks: 0,
  currentConcurrentTasks: 0
};

// Worker configuration
const workerConfig = {
  maxRetries: 3,
  retryDelay: 500,
  fallbackToMainThread: true,
  adaptiveTaskDistribution: true,
  maxConcurrentTasks: navigator.hardwareConcurrency || 4
};

/**
 * Check if Web Workers are supported in the current environment
 */
const isWebWorkerSupported = () => {
  return typeof Worker !== 'undefined';
};

/**
 * Initialize the encryption worker
 */
const initWorker = () => {
  if (!isWebWorkerSupported() || encryptionWorker) {
    return;
  }
  
  try {
    encryptionWorker = new Worker('/workers/encryption-worker.js');
    
    encryptionWorker.onmessage = (event) => {
      const { action, status, encryptedData, decryptedData, results, error, taskId, processingTime } = event.data;
      
      if (status === 'ready') {
        workerReady = true;
        processPendingTasks();
        return;
      }
      
      if (error) {
        console.error('Encryption worker error:', error);
        workerMetrics.failedTasks++;
        
        // Handle the error for the specific task
        if (taskId && callbackMap.has(taskId)) {
          const { reject, retries } = callbackMap.get(taskId);
          
          if (retries < workerConfig.maxRetries) {
            // Retry the task
            setTimeout(() => {
              const task = pendingTasks.find(t => t.data && t.data.callbackId === taskId);
              if (task) {
                task.data.retries = retries + 1;
                encryptionWorker.postMessage(task);
              }
            }, workerConfig.retryDelay);
          } else if (workerConfig.fallbackToMainThread) {
            // Fallback to main thread processing
            handleMainThreadFallback(taskId);
          } else {
            // Give up and reject the promise
            reject(new Error(`Worker failed after ${retries} retries: ${error}`));
            callbackMap.delete(taskId);
          }
        }
        
        return;
      }
      
      // Update metrics
      workerMetrics.successfulTasks++;
      workerMetrics.currentConcurrentTasks = Math.max(0, workerMetrics.currentConcurrentTasks - 1);
      
      if (processingTime) {
        workerMetrics.processingTimes.push(processingTime);
        // Keep only the last 100 processing times
        if (workerMetrics.processingTimes.length > 100) {
          workerMetrics.processingTimes.shift();
        }
        
        // Update average processing time
        workerMetrics.averageProcessingTime = workerMetrics.processingTimes.reduce((a, b) => a + b, 0) / workerMetrics.processingTimes.length;
      }
      
      // Handle different response types
      switch (action) {
        case 'encrypt_result':
          handleCallbackResponse(encryptedData);
          break;
          
        case 'decrypt_result':
          handleCallbackResponse(decryptedData);
          break;
          
        case 'encrypt_presence_result':
          handleCallbackResponse(encryptedData);
          break;
          
        case 'decrypt_presence_result':
          handleCallbackResponse(decryptedData);
          break;
          
        case 'batch_encrypt_result':
          if (results && results.length > 0) {
            handleCallbackResponse(results);
          }
          break;
          
        default:
          console.warn('Unknown worker response action:', action);
      }
    };
    
    encryptionWorker.onerror = (error) => {
      console.error('Encryption worker error:', error);
      workerReady = false;
      workerMetrics.failedTasks++;
      
      // Attempt to recover by reinitializing the worker
      terminateWorker();
      setTimeout(() => {
        initWorker();
      }, 1000);
    };
    
    console.log('Encryption worker initialized');
  } catch (error) {
    console.error('Failed to initialize encryption worker:', error);
    encryptionWorker = null;
  }
};

/**
 * Process any pending tasks once the worker is ready
 */
const processPendingTasks = () => {
  if (!workerReady || !encryptionWorker) {
    return;
  }
  
  // Limit concurrent tasks
  const availableSlots = workerConfig.maxConcurrentTasks - workerMetrics.currentConcurrentTasks;
  const tasksToProcess = pendingTasks.slice(0, availableSlots);
  pendingTasks = pendingTasks.slice(availableSlots);
  
  if (tasksToProcess.length > 0) {
    workerMetrics.currentConcurrentTasks += tasksToProcess.length;
    workerMetrics.maxConcurrentTasks = Math.max(workerMetrics.maxConcurrentTasks, workerMetrics.currentConcurrentTasks);
    
    tasksToProcess.forEach(task => {
      encryptionWorker.postMessage(task);
    });
  }
};

/**
 * Handle callback responses from the worker
 */
const handleCallbackResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return;
  }
  
  // Check for callback ID in the data object
  const callbackId = data.callbackId || (data.id ? data.id : null);
  
  if (callbackId && callbackMap.has(callbackId)) {
    const { resolve } = callbackMap.get(callbackId);
    resolve(data);
    callbackMap.delete(callbackId);
    
    // Process next tasks if available
    processPendingTasks();
  }
};

/**
 * Fallback to main thread processing when worker fails
 */
const handleMainThreadFallback = (taskId) => {
  if (!callbackMap.has(taskId)) {
    return;
  }
  
  const { resolve, reject, action, data } = callbackMap.get(taskId);
  
  console.warn('Falling back to main thread for encryption task:', action);
  
  try {
    // Simulate the worker's processing in the main thread
    // This is a simplified version - in a real app, you'd need to implement
    // the actual encryption/decryption logic here
    
    switch (action) {
      case 'encrypt':
        // Simulate encryption in main thread
        import('../utils/encryptionUtils').then(({ encryptData }) => {
          const result = encryptData(data.message, data.recipients);
          resolve(result);
        }).catch(err => reject(err));
        break;
        
      case 'decrypt':
        // Simulate decryption in main thread
        import('../utils/encryptionUtils').then(({ decryptData }) => {
          const result = decryptData(
            data.encryptedMessage,
            data.iv,
            data.encryptedKey,
            data.privateKey
          );
          resolve(result);
        }).catch(err => reject(err));
        break;
        
      case 'encrypt_presence':
        // Simulate presence encryption in main thread
        import('../utils/encryptionUtils').then(({ encryptData }) => {
          const result = encryptData(data.presenceData, data.recipients);
          resolve({ ...result, presenceType: data.presenceType });
        }).catch(err => reject(err));
        break;
        
      case 'batch_encrypt':
        // Simulate batch encryption in main thread
        import('../utils/encryptionUtils').then(({ encryptData }) => {
          const results = data.batch.map(item => ({
            id: item.id,
            result: encryptData(item.data, data.recipients)
          }));
          resolve(results);
        }).catch(err => reject(err));
        break;
        
      default:
        reject(new Error(`Unknown action for main thread fallback: ${action}`));
    }
  } catch (error) {
    reject(error);
  } finally {
    callbackMap.delete(taskId);
  }
};

/**
 * Generate a unique callback ID
 */
const generateCallbackId = () => {
  return `cb_${Date.now()}_${callbackCounter++}`;
};

/**
 * Encrypt data using the Web Worker
 */
const encryptWithWorker = (data, recipients) => {
  return new Promise((resolve, reject) => {
    if (!isWebWorkerSupported() && !workerConfig.fallbackToMainThread) {
      reject(new Error('Web Workers not supported in this browser'));
      return;
    }
    
    if (!encryptionWorker && isWebWorkerSupported()) {
      initWorker();
    }
    
    const callbackId = generateCallbackId();
    workerMetrics.totalTasks++;
    
    // Store both resolve and reject functions along with task details
    callbackMap.set(callbackId, {
      resolve,
      reject,
      retries: 0,
      action: 'encrypt',
      data: { message: data, recipients }
    });
    
    const message = {
      action: 'encrypt',
      data: {
        message: data,
        recipients,
        callbackId,
        timestamp: Date.now()
      }
    };
    
    if (workerReady && encryptionWorker) {
      // Check if we should add to pending tasks or process immediately
      if (workerMetrics.currentConcurrentTasks < workerConfig.maxConcurrentTasks) {
        workerMetrics.currentConcurrentTasks++;
        encryptionWorker.postMessage(message);
      } else {
        pendingTasks.push(message);
      }
    } else if (workerConfig.fallbackToMainThread && !isWebWorkerSupported()) {
      // Fallback to main thread immediately if workers aren't supported
      handleMainThreadFallback(callbackId);
    } else {
      pendingTasks.push(message);
    }
  });
};

/**
 * Decrypt data using the Web Worker
 */
const decryptWithWorker = (encryptedMessage, iv, encryptedKey, privateKey) => {
  return new Promise((resolve, reject) => {
    if (!isWebWorkerSupported() && !workerConfig.fallbackToMainThread) {
      reject(new Error('Web Workers not supported in this browser'));
      return;
    }
    
    if (!encryptionWorker && isWebWorkerSupported()) {
      initWorker();
    }
    
    const callbackId = generateCallbackId();
    workerMetrics.totalTasks++;
    
    // Store both resolve and reject functions along with task details
    callbackMap.set(callbackId, {
      resolve,
      reject,
      retries: 0,
      action: 'decrypt',
      data: { encryptedMessage, iv, encryptedKey, privateKey }
    });
    
    const message = {
      action: 'decrypt',
      data: {
        encryptedMessage,
        iv,
        encryptedKey,
        privateKey,
        callbackId,
        timestamp: Date.now()
      }
    };
    
    if (workerReady && encryptionWorker) {
      // Check if we should add to pending tasks or process immediately
      if (workerMetrics.currentConcurrentTasks < workerConfig.maxConcurrentTasks) {
        workerMetrics.currentConcurrentTasks++;
        encryptionWorker.postMessage(message);
      } else {
        pendingTasks.push(message);
      }
    } else if (workerConfig.fallbackToMainThread && !isWebWorkerSupported()) {
      // Fallback to main thread immediately if workers aren't supported
      handleMainThreadFallback(callbackId);
    } else {
      pendingTasks.push(message);
    }
  });
};

/**
 * Encrypt presence data using the Web Worker
 */
const encryptPresenceWithWorker = (presenceData, recipients, presenceType) => {
  return new Promise((resolve, reject) => {
    if (!isWebWorkerSupported() && !workerConfig.fallbackToMainThread) {
      reject(new Error('Web Workers not supported in this browser'));
      return;
    }
    
    if (!encryptionWorker && isWebWorkerSupported()) {
      initWorker();
    }
    
    const callbackId = generateCallbackId();
    workerMetrics.totalTasks++;
    
    // Store both resolve and reject functions along with task details
    callbackMap.set(callbackId, {
      resolve,
      reject,
      retries: 0,
      action: 'encrypt_presence',
      data: { presenceData, recipients, presenceType }
    });
    
    const message = {
      action: 'encrypt_presence',
      data: {
        presenceData,
        recipients,
        presenceType,
        callbackId,
        timestamp: Date.now()
      }
    };
    
    if (workerReady && encryptionWorker) {
      // Check if we should add to pending tasks or process immediately
      if (workerMetrics.currentConcurrentTasks < workerConfig.maxConcurrentTasks) {
        workerMetrics.currentConcurrentTasks++;
        encryptionWorker.postMessage(message);
      } else {
        pendingTasks.push(message);
      }
    } else if (workerConfig.fallbackToMainThread && !isWebWorkerSupported()) {
      // Fallback to main thread immediately if workers aren't supported
      handleMainThreadFallback(callbackId);
    } else {
      pendingTasks.push(message);
    }
  });
};

/**
 * Batch encrypt multiple presence updates using the Web Worker
 */
const batchEncryptWithWorker = (batch, recipients) => {
  return new Promise((resolve, reject) => {
    if (!isWebWorkerSupported() && !workerConfig.fallbackToMainThread) {
      reject(new Error('Web Workers not supported in this browser'));
      return;
    }
    
    if (!encryptionWorker && isWebWorkerSupported()) {
      initWorker();
    }
    
    const callbackId = generateCallbackId();
    workerMetrics.totalTasks++;
    
    // Store both resolve and reject functions along with task details
    callbackMap.set(callbackId, {
      resolve,
      reject,
      retries: 0,
      action: 'batch_encrypt',
      data: { batch, recipients }
    });
    
    // Add callback ID to first batch item for tracking
    const batchWithCallbacks = batch.map((item, index) => ({
      ...item,
      callbackId: index === 0 ? callbackId : undefined
    }));
    
    const message = {
      action: 'batch_encrypt',
      data: {
        batch: batchWithCallbacks,
        recipients
      }
    };
    
    if (workerReady && encryptionWorker) {
      // Check if we should add to pending tasks or process immediately
      if (workerMetrics.currentConcurrentTasks < workerConfig.maxConcurrentTasks) {
        workerMetrics.currentConcurrentTasks++;
        encryptionWorker.postMessage(message);
      } else {
        pendingTasks.push(message);
      }
    } else if (workerConfig.fallbackToMainThread && !isWebWorkerSupported()) {
      // Fallback to main thread immediately if workers aren't supported
      handleMainThreadFallback(callbackId);
    } else {
      pendingTasks.push(message);
    }
  });
};

/**
 * Terminate the worker
 */
const terminateWorker = () => {
  if (encryptionWorker) {
    encryptionWorker.terminate();
    encryptionWorker = null;
    workerReady = false;
    pendingTasks = [];
    callbackMap.clear();
  }
};

/**
 * Get worker metrics
 */
const getWorkerMetrics = () => {
  return { ...workerMetrics };
};

/**
 * Update worker configuration
 */
const updateWorkerConfig = (newConfig) => {
  Object.assign(workerConfig, newConfig);
  return { ...workerConfig };
};

/**
 * Reset worker metrics
 */
const resetWorkerMetrics = () => {
  workerMetrics = {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    processingTimes: [],
    maxConcurrentTasks: 0,
    currentConcurrentTasks: 0
  };
  return { ...workerMetrics };
};

// Initialize the worker
initWorker();

// Export the service
export default {
  encryptWithWorker,
  decryptWithWorker,
  encryptPresenceWithWorker,
  batchEncryptWithWorker,
  isWebWorkerSupported,
  terminateWorker,
  getWorkerMetrics,
  updateWorkerConfig,
  resetWorkerMetrics
};
