import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, CircularProgress } from '@mui/material';
import MessageReactions from './MessageReactions';
import performanceService from '../../services/performanceService';
import reactionService from '../../services/reactionService';
import { useSocket } from '../../contexts/SocketContext';

/**
 * MessageReactionsContainer Component
 * 
 * Container component for message reactions that handles:
 * - Performance monitoring
 * - Batch operations coordination
 * - Socket event management
 * - Error handling and retries
 */
const MessageReactionsContainer = ({ messageId, message }) => {
  const [reactions, setReactions] = useState({
    reactionCounts: {},
    userReactions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchQueue, setBatchQueue] = useState({
    adds: [],
    removes: []
  });
  
  const { socket } = useSocket();
  const containerRef = useRef(null);
  const loadStartTime = useRef(performance.now());
  const batchProcessingTimerId = useRef(null);
  
  // Get optimal batch processing delay based on performance metrics
  const getOptimalBatchDelay = useCallback(() => {
    const metrics = performanceService.getMetrics();
    
    // Base delay of 250ms
    let delay = 250;
    
    // Adjust based on network conditions
    if (metrics.messageLatency > 150) {
      // Slower network - increase batch window to collect more operations
      delay = Math.min(500, metrics.messageLatency * 1.5);
    } else if (metrics.messageLatency < 50) {
      // Very fast network - can process batches more quickly
      delay = 100;
    }
    
    // Adjust based on current batch efficiency
    if (metrics.reactionBatchEfficiency > 0.8) {
      // If batching is already efficient, slightly increase delay to collect more
      delay += 50;
    } else if (metrics.reactionBatchEfficiency < 0.4) {
      // If batching is inefficient, reduce delay to process smaller batches
      delay = Math.max(50, delay - 100);
    }
    
    console.debug(`Calculated optimal batch delay: ${delay.toFixed(0)}ms`);
    return delay;
  }, []);
  
  // Process batched reactions
  const processBatchedReactions = useCallback(async () => {
    const batchStartTime = performance.now();
    
    try {
      // Process adds
      if (batchQueue.adds.length > 0) {
        const emojisToAdd = [...batchQueue.adds];
        
        // Track batch metrics
        performanceService.trackBatchOperation('reaction', 'add', emojisToAdd.length);
        
        // Process the batch
        await reactionService.addReactionsBatch(messageId, emojisToAdd);
        
        // Clear processed items
        setBatchQueue(prev => ({
          ...prev,
          adds: prev.adds.filter(emoji => !emojisToAdd.includes(emoji))
        }));
        
        console.debug(`Successfully processed batch add of ${emojisToAdd.length} reactions`);
      }
      
      // Process removes
      if (batchQueue.removes.length > 0) {
        const emojisToRemove = [...batchQueue.removes];
        
        // Track batch metrics
        performanceService.trackBatchOperation('reaction', 'remove', emojisToRemove.length);
        
        // Process the batch
        await reactionService.removeReactionsBatch(messageId, emojisToRemove);
        
        // Clear processed items
        setBatchQueue(prev => ({
          ...prev,
          removes: prev.removes.filter(emoji => !emojisToRemove.includes(emoji))
        }));
        
        console.debug(`Successfully processed batch remove of ${emojisToRemove.length} reactions`);
      }
      
      // Track batch processing time
      const batchEndTime = performance.now();
      const processingTime = batchEndTime - batchStartTime;
      performanceService.trackBatchProcessingTime('reaction', processingTime);
      
      // Track batch success
      performanceService.trackBatchSuccess('reaction', true);
      
    } catch (error) {
      console.error('Error processing reaction batch:', error);
      
      // Track batch failure
      performanceService.trackBatchSuccess('reaction', false);
      
      // Set error state
      setError('Failed to process reactions. Retrying...');
      
      // Schedule retry after a delay
      setTimeout(() => {
        if (batchQueue.adds.length > 0 || batchQueue.removes.length > 0) {
          scheduleBatchProcessing(true); // Force immediate processing
        }
      }, 2000);
    }
  }, [messageId, batchQueue]);
  
  // Schedule batch processing with dynamic delay
  const scheduleBatchProcessing = useCallback((immediate = false) => {
    // Clear any existing timer
    if (batchProcessingTimerId.current) {
      clearTimeout(batchProcessingTimerId.current);
      batchProcessingTimerId.current = null;
    }
    
    const delay = immediate ? 0 : getOptimalBatchDelay();
    
    // Set new timer
    batchProcessingTimerId.current = setTimeout(() => {
      processBatchedReactions();
    }, delay);
    
    console.debug(`Scheduled batch processing${immediate ? ' immediately' : ` with ${delay}ms delay`}`);
  }, [getOptimalBatchDelay, processBatchedReactions]);
  
  // Add reaction to batch queue
  const queueReactionAdd = useCallback((emoji) => {
    // Remove from removes queue if present
    setBatchQueue(prev => ({
      adds: [...prev.adds, emoji],
      removes: prev.removes.filter(e => e !== emoji)
    }));
    
    // Schedule processing
    scheduleBatchProcessing();
  }, [scheduleBatchProcessing]);
  
  // Remove reaction from batch queue
  const queueReactionRemove = useCallback((emoji) => {
    // Remove from adds queue if present
    setBatchQueue(prev => ({
      adds: prev.adds.filter(e => e !== emoji),
      removes: [...prev.removes, emoji]
    }));
    
    // Schedule processing
    scheduleBatchProcessing();
  }, [scheduleBatchProcessing]);
  
  // Load initial reactions
  useEffect(() => {
    const fetchReactions = async () => {
      loadStartTime.current = performance.now();
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await reactionService.getReactions(messageId);
        setReactions({
          reactionCounts: data.reactionCounts || {},
          userReactions: data.userReactions || []
        });
        
        // Track load time
        const loadEndTime = performance.now();
        const loadTime = loadEndTime - loadStartTime.current;
        performanceService.trackLoadTime('reactions', messageId, loadTime);
        
        console.debug(`Loaded reactions for message ${messageId} in ${loadTime.toFixed(2)}ms`);
      } catch (err) {
        console.error('Error loading reactions:', err);
        setError('Failed to load reactions');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (messageId) {
      fetchReactions();
    }
    
    // Cleanup function
    return () => {
      if (batchProcessingTimerId.current) {
        clearTimeout(batchProcessingTimerId.current);
      }
      
      // Process any remaining batched operations before unmounting
      if (batchQueue.adds.length > 0 || batchQueue.removes.length > 0) {
        processBatchedReactions();
      }
    };
  }, [messageId, processBatchedReactions, batchQueue.adds.length, batchQueue.removes.length]);
  
  // Handle socket events for real-time updates
  useEffect(() => {
    if (!socket || !messageId) return;
    
    const handleReactionAdded = (data) => {
      if (data.messageId !== messageId) return;
      
      setReactions(prev => {
        const newCounts = { ...prev.reactionCounts };
        newCounts[data.emoji] = (newCounts[data.emoji] || 0) + 1;
        
        return {
          ...prev,
          reactionCounts: newCounts
        };
      });
    };
    
    const handleReactionRemoved = (data) => {
      if (data.messageId !== messageId) return;
      
      setReactions(prev => {
        const newCounts = { ...prev.reactionCounts };
        
        if (newCounts[data.emoji]) {
          if (newCounts[data.emoji] > 1) {
            newCounts[data.emoji]--;
          } else {
            delete newCounts[data.emoji];
          }
        }
        
        return {
          ...prev,
          reactionCounts: newCounts
        };
      });
    };
    
    // Subscribe to socket events
    socket.on('message:reaction:add', handleReactionAdded);
    socket.on('message:reaction:remove', handleReactionRemoved);
    
    // Cleanup socket subscriptions
    return () => {
      socket.off('message:reaction:add', handleReactionAdded);
      socket.off('message:reaction:remove', handleReactionRemoved);
    };
  }, [socket, messageId]);
  
  // Track render performance
  useEffect(() => {
    const renderStartTime = performance.now();
    
    return () => {
      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;
      performanceService.trackRenderTime('reactionsContainer', messageId, renderTime);
    };
  }, [messageId, reactions]);
  
  // If there's an error, show error state
  if (error) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      </Box>
    );
  }
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <CircularProgress size={20} thickness={4} sx={{ color: '#6200ee' }} />
      </Box>
    );
  }
  
  // Render the MessageReactions component with optimized props
  return (
    <Box ref={containerRef}>
      <MessageReactions
        messageId={messageId}
        initialReactions={reactions}
        onAddReaction={queueReactionAdd}
        onRemoveReaction={queueReactionRemove}
      />
    </Box>
  );
};

MessageReactionsContainer.propTypes = {
  messageId: PropTypes.string.isRequired,
  message: PropTypes.object
};

export default React.memo(MessageReactionsContainer);
