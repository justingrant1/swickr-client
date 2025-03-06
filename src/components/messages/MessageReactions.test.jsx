import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageReactions from './MessageReactions';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import reactionService from '../../services/reactionService';

// Mock the reactionService
jest.mock('../../services/reactionService', () => ({
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
  getReactions: jest.fn(),
  getCommonEmojis: jest.fn().mockReturnValue(['👍', '❤️', '😊', '👏', '🎉'])
}));

// Mock socket
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User'
  },
  isAuthenticated: true
};

// Sample reactions data
const mockReactions = [
  {
    id: 'reaction1',
    messageId: 'message1',
    userId: 'user2',
    username: 'user2',
    displayName: 'User 2',
    emoji: '👍',
    timestamp: new Date().toISOString()
  },
  {
    id: 'reaction2',
    messageId: 'message1',
    userId: 'user3',
    username: 'user3',
    displayName: 'User 3',
    emoji: '👍',
    timestamp: new Date().toISOString()
  },
  {
    id: 'reaction3',
    messageId: 'message1',
    userId: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    emoji: '❤️',
    timestamp: new Date().toISOString()
  }
];

// Helper function to render with contexts
const renderWithContexts = (ui, { socket = mockSocket, authContext = mockAuthContext } = {}) => {
  return render(
    <AuthContext.Provider value={authContext}>
      <SocketContext.Provider value={socket}>
        {ui}
      </SocketContext.Provider>
    </AuthContext.Provider>
  );
};

describe('MessageReactions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reactionService.getReactions.mockResolvedValue(mockReactions);
  });

  it('renders without crashing', async () => {
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    // Wait for reactions to load
    await waitFor(() => {
      expect(reactionService.getReactions).toHaveBeenCalledWith('message1');
    });
  });

  it('displays reaction counts correctly', async () => {
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      // Should show 2 for 👍 reactions
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Should show 1 for ❤️ reaction
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('highlights user reactions', async () => {
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      // The user has reacted with ❤️, so it should be highlighted
      const heartReaction = screen.getByText('❤️').closest('.reaction');
      expect(heartReaction).toHaveClass('userReacted');
      
      // The user has not reacted with 👍, so it should not be highlighted
      const thumbsUpReaction = screen.getByText('👍').closest('.reaction');
      expect(thumbsUpReaction).not.toHaveClass('userReacted');
    });
  });

  it('shows reaction picker on click', async () => {
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
    
    // Reaction picker should initially be hidden
    expect(screen.queryByTestId('reaction-picker')).not.toBeInTheDocument();
    
    // Click the add reaction button
    fireEvent.click(screen.getByTestId('add-reaction-button'));
    
    // Reaction picker should now be visible
    expect(screen.getByTestId('reaction-picker')).toBeInTheDocument();
    
    // Common emojis should be displayed
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
    expect(screen.getByText('👏')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('adds a reaction when emoji is clicked', async () => {
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
    
    // Open reaction picker
    fireEvent.click(screen.getByTestId('add-reaction-button'));
    
    // Click the 😊 emoji
    fireEvent.click(screen.getByText('😊'));
    
    // Should call addReaction
    expect(reactionService.addReaction).toHaveBeenCalledWith('message1', '😊');
    
    // Reaction picker should be closed after selection
    expect(screen.queryByTestId('reaction-picker')).not.toBeInTheDocument();
  });

  it('removes a reaction when user clicks their own reaction', async () => {
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });
    
    // Click the ❤️ reaction (user already reacted with this)
    fireEvent.click(screen.getByText('❤️'));
    
    // Should call removeReaction
    expect(reactionService.removeReaction).toHaveBeenCalledWith('message1', '❤️');
  });

  it('handles socket events for real-time updates', async () => {
    // Setup socket event handlers
    let addReactionHandler;
    let removeReactionHandler;
    
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'message:reaction:add') {
        addReactionHandler = handler;
      } else if (event === 'message:reaction:remove') {
        removeReactionHandler = handler;
      }
    });
    
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('message:reaction:add', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('message:reaction:remove', expect.any(Function));
    });
    
    // Simulate receiving a new reaction via socket
    const newReaction = {
      id: 'reaction4',
      messageId: 'message1',
      userId: 'user4',
      username: 'user4',
      displayName: 'User 4',
      emoji: '🎉',
      timestamp: new Date().toISOString()
    };
    
    // Update the mock reactions data
    const updatedReactions = [...mockReactions, newReaction];
    reactionService.getReactions.mockResolvedValue(updatedReactions);
    
    // Trigger the socket event
    addReactionHandler(newReaction);
    
    // Re-render with updated data
    await waitFor(() => {
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
    
    // Simulate removing a reaction via socket
    const reactionToRemove = mockReactions[0]; // The first 👍 reaction
    
    // Update the mock reactions data
    const afterRemovalReactions = updatedReactions.filter(r => r.id !== reactionToRemove.id);
    reactionService.getReactions.mockResolvedValue(afterRemovalReactions);
    
    // Trigger the socket event
    removeReactionHandler({
      messageId: 'message1',
      userId: reactionToRemove.userId,
      emoji: reactionToRemove.emoji
    });
    
    // Should still show 👍 but with count decreased
    await waitFor(() => {
      expect(screen.getByText('👍')).toBeInTheDocument();
      // Now only 1 thumbs up reaction
      const thumbsUpCount = screen.getAllByText('1');
      expect(thumbsUpCount.length).toBeGreaterThan(0);
    });
  });

  it('uses initialReactions prop when provided', async () => {
    const initialReactions = [
      {
        id: 'reaction5',
        messageId: 'message1',
        userId: 'user5',
        username: 'user5',
        displayName: 'User 5',
        emoji: '😂',
        timestamp: new Date().toISOString()
      }
    ];
    
    renderWithContexts(
      <MessageReactions 
        messageId="message1" 
        initialReactions={initialReactions} 
      />
    );
    
    // Should use initialReactions and not call getReactions
    await waitFor(() => {
      expect(screen.getByText('😂')).toBeInTheDocument();
      expect(reactionService.getReactions).not.toHaveBeenCalled();
    });
  });

  it('applies Swickr brand styling', async () => {
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
    
    // Open reaction picker
    fireEvent.click(screen.getByTestId('add-reaction-button'));
    
    // Check for Swickr's primary color (#6200ee) in the component
    const reactionPicker = screen.getByTestId('reaction-picker');
    
    // Get computed styles (this is a simplified check, actual implementation may vary)
    const styles = window.getComputedStyle(reactionPicker);
    
    // The component should use the Swickr brand colors somewhere in its styling
    expect(reactionPicker).toHaveStyle({
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    });
    
    // Check that emoji buttons have proper touch target size
    const emojiButtons = screen.getAllByRole('button');
    emojiButtons.forEach(button => {
      const buttonStyles = window.getComputedStyle(button);
      
      // Minimum touch target size should be 44x44 points
      expect(parseInt(buttonStyles.width)).toBeGreaterThanOrEqual(44);
      expect(parseInt(buttonStyles.height)).toBeGreaterThanOrEqual(44);
    });
  });

  it('handles errors gracefully', async () => {
    // Mock an error when fetching reactions
    reactionService.getReactions.mockRejectedValue(new Error('Failed to fetch reactions'));
    
    // Mock console.error to prevent error output in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithContexts(<MessageReactions messageId="message1" />);
    
    await waitFor(() => {
      expect(reactionService.getReactions).toHaveBeenCalledWith('message1');
      expect(console.error).toHaveBeenCalled();
    });
    
    // Component should still render without crashing
    expect(screen.getByTestId('add-reaction-button')).toBeInTheDocument();
  });
});
