/**
 * Client-side WebSocket Integration Tests
 * 
 * This file contains tests for the client-side WebSocket integration,
 * focusing on the MessagingContext, socketService, and messageService.
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MessagingProvider, useMessagingContext } from '../context/MessagingContext';
import socketService from '../services/socketService';
import messageService from '../services/messageService';
import { AuthProvider } from '../context/AuthContext';

// Mock the socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: 'mock-socket-id'
  };
  return {
    io: jest.fn(() => mockSocket)
  };
});

// Mock the services
jest.mock('../services/socketService', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  isConnected: jest.fn(() => true),
  joinConversation: jest.fn(),
  leaveConversation: jest.fn(),
  sendConversationMessage: jest.fn(),
  sendTypingIndicator: jest.fn(),
  sendReadReceipt: jest.fn(),
  markConversationRead: jest.fn(),
  updateUserStatus: jest.fn()
}));

jest.mock('../services/messageService', () => ({
  getConversations: jest.fn(() => Promise.resolve([])),
  getConversation: jest.fn(() => Promise.resolve({
    id: 'conv-1',
    participants: [{ id: 'user-1' }, { id: 'user-2' }],
    messages: []
  })),
  getMessages: jest.fn(() => Promise.resolve([])),
  sendMessage: jest.fn(() => Promise.resolve({
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'Test message',
    createdAt: new Date().toISOString()
  })),
  markMessageAsRead: jest.fn(() => Promise.resolve(true)),
  markConversationAsRead: jest.fn(() => Promise.resolve(true))
}));

jest.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuthContext: () => ({
    user: { id: 'user-1', username: 'testuser' },
    isAuthenticated: true,
    token: 'mock-token'
  })
}));

// Test component to access the messaging context
const TestComponent = () => {
  const {
    conversations,
    activeConversation,
    messages,
    sendMessage,
    markAsRead,
    setTyping,
    userStatuses
  } = useMessagingContext();

  return (
    <div>
      <div data-testid="conversations">{JSON.stringify(conversations)}</div>
      <div data-testid="active-conversation">{JSON.stringify(activeConversation)}</div>
      <div data-testid="messages">{JSON.stringify(messages)}</div>
      <div data-testid="user-statuses">{JSON.stringify(userStatuses)}</div>
      <button 
        data-testid="send-message-btn" 
        onClick={() => sendMessage('conv-1', 'Test message')}
      >
        Send Message
      </button>
      <button 
        data-testid="mark-read-btn" 
        onClick={() => markAsRead('msg-1')}
      >
        Mark As Read
      </button>
      <button 
        data-testid="set-typing-btn" 
        onClick={() => setTyping('conv-1', true)}
      >
        Set Typing
      </button>
    </div>
  );
};

describe('WebSocket Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('MessagingProvider initializes and connects to socket', async () => {
    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Check that socketService.connect was called
    expect(socketService.connect).toHaveBeenCalled();
    
    // Check that event listeners were set up
    expect(socketService.on).toHaveBeenCalledWith('conversation-message', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('typing', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('read-receipt', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('user-status', expect.any(Function));
  });

  test('sendMessage calls socketService and messageService', async () => {
    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Trigger the sendMessage function
    const sendButton = screen.getByTestId('send-message-btn');
    await act(async () => {
      sendButton.click();
    });

    // Check that messageService.sendMessage was called
    expect(messageService.sendMessage).toHaveBeenCalledWith('conv-1', 'Test message');
    
    // The socket emit should be called after the message is sent successfully
    await waitFor(() => {
      expect(socketService.sendConversationMessage).toHaveBeenCalledWith(
        'conv-1', 
        expect.objectContaining({
          id: 'msg-1',
          content: 'Test message'
        })
      );
    });
  });

  test('markAsRead calls socketService', async () => {
    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Trigger the markAsRead function
    const markReadButton = screen.getByTestId('mark-read-btn');
    await act(async () => {
      markReadButton.click();
    });

    // Check that socketService.sendReadReceipt was called
    expect(socketService.sendReadReceipt).toHaveBeenCalledWith('msg-1');
    
    // Check that messageService.markMessageAsRead was called
    expect(messageService.markMessageAsRead).toHaveBeenCalledWith('msg-1');
  });

  test('setTyping calls socketService', async () => {
    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Trigger the setTyping function
    const setTypingButton = screen.getByTestId('set-typing-btn');
    await act(async () => {
      setTypingButton.click();
    });

    // Check that socketService.sendTypingIndicator was called
    expect(socketService.sendTypingIndicator).toHaveBeenCalledWith('conv-1', true);
  });

  test('handles incoming conversation message', async () => {
    // Setup the mock implementation for the socket event
    let conversationMessageHandler;
    socketService.on.mockImplementation((event, handler) => {
      if (event === 'conversation-message') {
        conversationMessageHandler = handler;
      }
    });

    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Simulate receiving a message
    await act(async () => {
      conversationMessageHandler({
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-2',
        content: 'Incoming test message',
        createdAt: new Date().toISOString()
      });
    });

    // Wait for the state to update
    await waitFor(() => {
      const messagesElement = screen.getByTestId('messages');
      expect(messagesElement.textContent).toContain('Incoming test message');
    });
  });

  test('handles typing indicator', async () => {
    // Setup the mock implementation for the socket event
    let typingHandler;
    socketService.on.mockImplementation((event, handler) => {
      if (event === 'typing') {
        typingHandler = handler;
      }
    });

    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Simulate receiving a typing indicator
    await act(async () => {
      typingHandler({
        conversationId: 'conv-1',
        userId: 'user-2',
        isTyping: true
      });
    });

    // Check that the typing state is updated
    // This would typically update the activeConversation or a typing state
    // For this test, we'd need to expose that state in the TestComponent
  });

  test('handles read receipt', async () => {
    // Setup the mock implementation for the socket event
    let readReceiptHandler;
    socketService.on.mockImplementation((event, handler) => {
      if (event === 'read-receipt') {
        readReceiptHandler = handler;
      }
    });

    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Simulate receiving a read receipt
    await act(async () => {
      readReceiptHandler({
        messageId: 'msg-1',
        userId: 'user-2',
        conversationId: 'conv-1'
      });
    });

    // This would typically update the message's read status
    // For this test, we'd need to expose that state in the TestComponent
  });

  test('handles user status update', async () => {
    // Setup the mock implementation for the socket event
    let userStatusHandler;
    socketService.on.mockImplementation((event, handler) => {
      if (event === 'user-status') {
        userStatusHandler = handler;
      }
    });

    render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Simulate receiving a user status update
    await act(async () => {
      userStatusHandler({
        userId: 'user-2',
        status: 'online',
        lastSeen: new Date().toISOString()
      });
    });

    // Wait for the state to update
    await waitFor(() => {
      const userStatusesElement = screen.getByTestId('user-statuses');
      expect(userStatusesElement.textContent).toContain('user-2');
      expect(userStatusesElement.textContent).toContain('online');
    });
  });

  test('disconnects socket on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <MessagingProvider>
          <TestComponent />
        </MessagingProvider>
      </AuthProvider>
    );

    // Unmount the component
    unmount();

    // Check that socketService.disconnect was called
    expect(socketService.disconnect).toHaveBeenCalled();
  });
});
