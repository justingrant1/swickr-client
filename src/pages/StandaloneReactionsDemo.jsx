import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Container, Grid, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MessageReactions from '../components/messages/MessageReactions';

// Mock data for the demo
const mockUsers = [
  { id: 'user1', username: 'alice', displayName: 'Alice', avatarUrl: 'https://mui.com/static/images/avatar/1.jpg' },
  { id: 'user2', username: 'bob', displayName: 'Bob', avatarUrl: 'https://mui.com/static/images/avatar/2.jpg' },
  { id: 'user3', username: 'charlie', displayName: 'Charlie', avatarUrl: 'https://mui.com/static/images/avatar/3.jpg' },
  { id: 'user4', username: 'dana', displayName: 'Dana', avatarUrl: 'https://mui.com/static/images/avatar/4.jpg' },
];

const mockMessages = [
  { 
    id: 'msg1', 
    content: 'Hey everyone! Welcome to the Swickr message reactions demo!', 
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userId: 'user1'
  },
  { 
    id: 'msg2', 
    content: 'This is a standalone demo showing how message reactions work in Swickr.', 
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    userId: 'user2'
  },
  { 
    id: 'msg3', 
    content: 'You can add reactions to messages using the emoji picker.', 
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    userId: 'user3'
  },
  { 
    id: 'msg4', 
    content: 'Try clicking on a message to see the reaction options!', 
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    userId: 'user4'
  },
];

// Initial reactions for the demo
const initialReactions = [
  { id: 'react1', messageId: 'msg1', userId: 'user2', emoji: '👍', timestamp: new Date(Date.now() - 3500000).toISOString() },
  { id: 'react2', messageId: 'msg1', userId: 'user3', emoji: '👍', timestamp: new Date(Date.now() - 3400000).toISOString() },
  { id: 'react3', messageId: 'msg1', userId: 'user4', emoji: '❤️', timestamp: new Date(Date.now() - 3300000).toISOString() },
  { id: 'react4', messageId: 'msg2', userId: 'user1', emoji: '👏', timestamp: new Date(Date.now() - 2900000).toISOString() },
  { id: 'react5', messageId: 'msg2', userId: 'user3', emoji: '👏', timestamp: new Date(Date.now() - 2800000).toISOString() },
  { id: 'react6', messageId: 'msg3', userId: 'user1', emoji: '😊', timestamp: new Date(Date.now() - 2300000).toISOString() },
  { id: 'react7', messageId: 'msg4', userId: 'user1', emoji: '👍', timestamp: new Date(Date.now() - 1700000).toISOString() },
];

/**
 * Standalone demo for the message reactions feature
 */
const StandaloneReactionsDemo = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [reactions, setReactions] = useState(initialReactions);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(mockUsers[0]);

  // Function to handle adding a reaction
  const handleAddReaction = (messageId, emoji) => {
    // Check if the user already reacted with this emoji
    const existingReaction = reactions.find(
      r => r.messageId === messageId && r.userId === currentUser.id && r.emoji === emoji
    );

    if (existingReaction) {
      // If the reaction exists, remove it (toggle behavior)
      setReactions(reactions.filter(r => r.id !== existingReaction.id));
    } else {
      // Add a new reaction
      const newReaction = {
        id: `react${Date.now()}`,
        messageId,
        userId: currentUser.id,
        emoji,
        timestamp: new Date().toISOString()
      };
      setReactions([...reactions, newReaction]);
    }
  };

  // Function to handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: `msg${Date.now()}`,
        content: newMessage,
        timestamp: new Date().toISOString(),
        userId: currentUser.id
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  // Function to handle switching users (for demo purposes)
  const handleSwitchUser = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  // Get reactions for a specific message
  const getReactionsForMessage = (messageId) => {
    return reactions.filter(r => r.messageId === messageId).map(r => {
      const user = mockUsers.find(u => u.id === r.userId);
      return {
        ...r,
        username: user?.username,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl
      };
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Swickr Message Reactions Demo
        </Typography>
        <Typography variant="body1" paragraph>
          This is a standalone demo of the message reactions feature in Swickr. You can switch between users, 
          send messages, and add reactions to see how the feature works.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current User: {currentUser.displayName}
          </Typography>
          <Grid container spacing={1}>
            {mockUsers.map(user => (
              <Grid item key={user.id}>
                <Avatar 
                  src={user.avatarUrl} 
                  alt={user.displayName}
                  onClick={() => handleSwitchUser(user.id)}
                  sx={{ 
                    cursor: 'pointer',
                    border: user.id === currentUser.id ? '2px solid #6200ee' : 'none',
                    width: 40,
                    height: 40
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3, maxHeight: '50vh', overflow: 'auto' }}>
        {messages.map(message => {
          const user = mockUsers.find(u => u.id === message.userId);
          const isCurrentUser = message.userId === currentUser.id;
          const messageReactions = getReactionsForMessage(message.id);
          
          return (
            <Box 
              key={message.id} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Avatar 
                  src={user?.avatarUrl} 
                  alt={user?.displayName} 
                  sx={{ width: 24, height: 24, mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {user?.displayName} • {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
              
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  bgcolor: isCurrentUser ? '#e3f2fd' : '#f5f5f5',
                  maxWidth: '80%'
                }}
              >
                <Typography variant="body1">{message.content}</Typography>
              </Paper>
              
              <Box sx={{ mt: 0.5 }}>
                <MessageReactions 
                  messageId={message.id}
                  initialReactions={messageReactions}
                  onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
                  currentUserId={currentUser.id}
                />
              </Box>
            </Box>
          );
        })}
      </Paper>

      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            size="small"
            sx={{ mr: 1 }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StandaloneReactionsDemo;
