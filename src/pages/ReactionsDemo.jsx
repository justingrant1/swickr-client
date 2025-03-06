import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Divider, 
  TextField, 
  Button,
  Card,
  CardContent,
  Avatar,
  Grid,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MessageReactions from '../components/messages/MessageReactions';
import { v4 as uuidv4 } from 'uuid';

/**
 * ReactionsDemo Component
 * 
 * A demo page to showcase the message reactions feature
 */
const ReactionsDemo = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Sample user data
  const currentUser = {
    id: '1',
    username: 'CurrentUser',
    avatarUrl: 'https://i.pravatar.cc/150?img=1'
  };
  
  const otherUser = {
    id: '2',
    username: 'OtherUser',
    avatarUrl: 'https://i.pravatar.cc/150?img=2'
  };
  
  // Load initial demo messages
  useEffect(() => {
    const initialMessages = [
      {
        id: uuidv4(),
        content: 'Hey there! Welcome to Swickr message reactions demo.',
        sender: otherUser,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        initialReactions: {
          reactions: [],
          reactionCounts: [
            { emoji: '👋', count: 1, userIds: [currentUser.id] }
          ],
          userReactions: ['👋']
        }
      },
      {
        id: uuidv4(),
        content: 'Hi! This looks great. Can you tell me more about the reactions feature?',
        sender: currentUser,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        initialReactions: {
          reactions: [],
          reactionCounts: [
            { emoji: '👍', count: 1, userIds: [otherUser.id] }
          ],
          userReactions: []
        }
      },
      {
        id: uuidv4(),
        content: 'Sure! You can react to any message with emojis. Just click the reaction button below a message or click on an existing reaction to toggle it.',
        sender: otherUser,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        initialReactions: {
          reactions: [],
          reactionCounts: [
            { emoji: '❤️', count: 1, userIds: [currentUser.id] },
            { emoji: '👏', count: 1, userIds: [otherUser.id] }
          ],
          userReactions: ['❤️']
        }
      },
      {
        id: uuidv4(),
        content: 'Try adding some reactions to these messages to see how it works!',
        sender: otherUser,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        initialReactions: {
          reactions: [],
          reactionCounts: [],
          userReactions: []
        }
      }
    ];
    
    setMessages(initialMessages);
  }, []);
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: uuidv4(),
      content: newMessage,
      sender: currentUser,
      timestamp: new Date().toISOString(),
      initialReactions: {
        reactions: [],
        reactionCounts: [],
        userReactions: []
      }
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
        Swickr Message Reactions Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demo showcases the message reactions feature. You can add reactions to messages,
        remove them by clicking again, and see reaction counts.
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          height: 500, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Messages area */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            p: 2, 
            overflowY: 'auto',
            backgroundColor: theme.palette.background.default
          }}
        >
          {messages.map((message) => (
            <Box 
              key={message.id}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: message.sender.id === currentUser.id ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: message.sender.id === currentUser.id ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <Avatar 
                  src={message.sender.avatarUrl} 
                  alt={message.sender.username}
                  sx={{ width: 36, height: 36 }}
                />
                
                <Card 
                  sx={{ 
                    maxWidth: '70%',
                    backgroundColor: message.sender.id === currentUser.id 
                      ? theme.palette.primary.main 
                      : theme.palette.background.paper,
                    color: message.sender.id === currentUser.id 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.primary,
                    borderRadius: 2
                  }}
                >
                  <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: 0.5,
                        textAlign: 'right',
                        opacity: 0.8
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              
              {/* Message reactions */}
              <Box 
                sx={{ 
                  ml: message.sender.id === currentUser.id ? 0 : 5,
                  mr: message.sender.id === currentUser.id ? 5 : 0,
                  width: '70%',
                  display: 'flex',
                  justifyContent: message.sender.id === currentUser.id ? 'flex-end' : 'flex-start'
                }}
              >
                <MessageReactions 
                  messageId={message.id} 
                  initialReactions={message.initialReactions}
                />
              </Box>
            </Box>
          ))}
        </Box>
        
        <Divider />
        
        {/* Message input area */}
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 4
              }
            }}
          />
          
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            sx={{ 
              borderRadius: 4,
              minWidth: 100
            }}
          >
            Send
          </Button>
        </Box>
      </Paper>
      
      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
        Note: This is a demo with simulated data. In the actual app, reactions would be saved to the server and synchronized in real-time.
      </Typography>
    </Container>
  );
};

export default ReactionsDemo;
