import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create the socket context
const SocketContext = createContext();

/**
 * SocketProvider Component
 *
 * Provides socket.io connection and methods to the application
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }


    let aToken = null
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const {accessToken} = JSON.parse(tokens);
      aToken = accessToken;
    }

    // Create a new socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: aToken
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Notification events
    newSocket.on('new_notification', (notification) => {
      console.log('New notification received:', notification);

      // Show browser notification if supported and permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const title = notification.title || 'Swickr';
          const options = {
            body: notification.body || 'You have a new notification',
            icon: '/assets/icon-192x192.png',
            badge: '/assets/badge.png',
            data: notification.data || {},
            tag: notification.id || 'swickr-notification',
            vibrate: [100, 50, 100]
          };

          // Create and show notification
          new Notification(title, options);
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      }
    });

    newSocket.on('notifications_updated', (data) => {
      console.log('Notifications updated:', data);
    });

    // Set the socket in state
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Mock socket for demo purposes
  /*useEffect(() => {
    if (!socket && isAuthenticated && user) {
      // Create a mock socket for the demo
      const mockSocket = {
        id: 'mock-socket-id',
        connected: true,
        on: (event, callback) => {
          console.log(`Registered mock event listener for: ${event}`);
          // Store event listeners in a global map for demo purposes
          if (!window.mockSocketListeners) {
            window.mockSocketListeners = {};
          }
          if (!window.mockSocketListeners[event]) {
            window.mockSocketListeners[event] = [];
          }
          window.mockSocketListeners[event].push(callback);
        },
        off: (event, callback) => {
          console.log(`Removed mock event listener for: ${event}`);
          if (window.mockSocketListeners && window.mockSocketListeners[event]) {
            const index = window.mockSocketListeners[event].indexOf(callback);
            if (index !== -1) {
              window.mockSocketListeners[event].splice(index, 1);
            }
          }
        },
        emit: (event, data) => {
          console.log(`Mock socket emitted: ${event}`, data);

          // For message reactions, simulate the server response
          if (event === 'message:reaction:add') {
            setTimeout(() => {
              if (window.mockSocketListeners && window.mockSocketListeners['message:reaction:add']) {
                window.mockSocketListeners['message:reaction:add'].forEach(callback => {
                  callback(data);
                });
              }
            }, 300);
          } else if (event === 'message:reaction:remove') {
            setTimeout(() => {
              if (window.mockSocketListeners && window.mockSocketListeners['message:reaction:remove']) {
                window.mockSocketListeners['message:reaction:remove'].forEach(callback => {
                  callback(data);
                });
              }
            }, 300);
          }

          // Simulate notification events for demo
          if (event === 'notification:read') {
            setTimeout(() => {
              if (window.mockSocketListeners && window.mockSocketListeners['notifications_updated']) {
                window.mockSocketListeners['notifications_updated'].forEach(callback => {
                  callback({
                    type: 'read',
                    ids: data.notificationIds,
                    count: data.notificationIds.length
                  });
                });
              }
            }, 300);
          } else if (event === 'notification:read_all') {
            setTimeout(() => {
              if (window.mockSocketListeners && window.mockSocketListeners['notifications_updated']) {
                window.mockSocketListeners['notifications_updated'].forEach(callback => {
                  callback({
                    type: 'read_all',
                    count: 5 // Mock count
                  });
                });
              }
            }, 300);
          }
        },
        disconnect: () => {
          console.log('Mock socket disconnected');
          setConnected(false);
        }
      };

      // Simulate receiving notifications periodically for demo
      const notificationInterval = setInterval(() => {
        if (window.mockSocketListeners && window.mockSocketListeners['new_notification']) {
          const mockNotificationTypes = [
            {
              type: 'new_message',
              title: 'New message from Alex',
              body: 'Hey, how are you doing?',
              data: {
                conversationId: '123',
                messageId: '456',
                senderId: '789',
                isGroup: false
              }
            },
            {
              type: 'friend_request',
              title: 'New friend request',
              body: 'Sara wants to connect with you',
              data: {
                userId: '101112'
              }
            },
            {
              type: 'status_update',
              title: 'Status update',
              body: 'John is now online',
              data: {
                userId: '131415'
              }
            }
          ];

          // Only send a notification 10% of the time to avoid spamming
          if (Math.random() < 0.1) {
            const randomType = mockNotificationTypes[Math.floor(Math.random() * mockNotificationTypes.length)];
            window.mockSocketListeners['new_notification'].forEach(callback => {
              callback({
                id: `mock-notification-${Date.now()}`,
                ...randomType,
                created_at: new Date().toISOString(),
                read: false
              });
            });
          }
        }
      }, 30000); // Every 30 seconds

      setSocket(mockSocket);
      setConnected(true);

      return () => {
        clearInterval(notificationInterval);
      };
    }
  }, [isAuthenticated, user, socket]);*/

  // Context value
  const value = {
    socket,
    connected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * useSocket Hook
 *
 * Custom hook to use the socket context
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * useSocketConnection Hook
 *
 * Custom hook to check if socket is connected
 */
export const useSocketConnection = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketConnection must be used within a SocketProvider');
  }
  return context.connected;
};
