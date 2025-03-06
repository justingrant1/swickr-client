import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Badge,
  Paper,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Message as MessageIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';
import contactService from '../services/contactService';

// Styled components
const ContactsContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const ContactsList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: 0
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  textTransform: 'none',
  fontWeight: 600
}));

const Contacts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveConversation } = useMessaging();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({ username: '', name: '' });
  const [addContactLoading, setAddContactLoading] = useState(false);
  const [addContactError, setAddContactError] = useState('');
  const [error, setError] = useState('');

  // Fetch contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await contactService.getContacts();
        
        if (response.success) {
          setContacts(response.data);
          setFilteredContacts(response.data);
        } else {
          setError(response.error || 'Failed to load contacts');
          // Use mock data as fallback for development
          const mockContacts = [
            {
              id: '1',
              username: 'alexj',
              name: 'Alex Johnson',
              avatar: '',
              status: 'online',
              lastSeen: new Date()
            },
            {
              id: '2',
              username: 'saraw',
              name: 'Sara Williams',
              avatar: '',
              status: 'offline',
              lastSeen: new Date(Date.now() - 1000 * 60 * 30)
            },
            {
              id: '3',
              username: 'johns',
              name: 'John Smith',
              avatar: '',
              status: 'online',
              lastSeen: new Date()
            },
            {
              id: '4',
              username: 'emilyd',
              name: 'Emily Davis',
              avatar: '',
              status: 'offline',
              lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24)
            }
          ];
          setContacts(mockContacts);
          setFilteredContacts(mockContacts);
        }
      } catch (err) {
        setError('Error loading contacts: ' + (err.message || 'Unknown error'));
        setContacts([]);
        setFilteredContacts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, []);

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle add contact dialog open
  const handleAddContactOpen = () => {
    setAddContactOpen(true);
    setAddContactError('');
    setNewContact({ username: '', name: '' });
  };

  // Handle add contact dialog close
  const handleAddContactClose = () => {
    setAddContactOpen(false);
  };

  // Handle new contact input change
  const handleNewContactChange = (e) => {
    const { name, value } = e.target;
    setNewContact(prev => ({ ...prev, [name]: value }));
  };

  // Handle add contact submit
  const handleAddContact = async () => {
    // Validate input
    if (!newContact.username.trim()) {
      setAddContactError('Username is required');
      return;
    }

    setAddContactLoading(true);
    setAddContactError('');

    try {
      const response = await contactService.addContact(newContact.username);
      
      if (response.success) {
        // Add new contact to the list
        setContacts(prev => [...prev, response.data]);
        setAddContactOpen(false);
      } else {
        setAddContactError(response.error || 'Failed to add contact');
      }
    } catch (err) {
      setAddContactError('Error adding contact: ' + (err.message || 'Unknown error'));
    } finally {
      setAddContactLoading(false);
    }
  };

  // Handle message contact
  const handleMessageContact = (contact) => {
    // Create a conversation object from the contact
    const conversation = {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar
    };

    // Set active conversation and navigate to home
    setActiveConversation(conversation);
    navigate('/');
  };

  // Format last seen time
  const formatLastSeen = (date, status) => {
    if (status === 'online') return 'Online';
    
    const now = new Date();
    const lastSeen = new Date(date);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    if (lastSeen.toDateString() === new Date(now - 86400000).toDateString()) {
      return 'Yesterday';
    }
    
    return lastSeen.toLocaleDateString();
  };

  return (
    <ContactsContainer>
      {/* Header and search */}
      <SearchContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Contacts
          </Typography>
          <ActionButton
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleAddContactOpen}
          >
            Add Contact
          </ActionButton>
        </Box>
        <TextField
          fullWidth
          placeholder="Search contacts..."
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
            },
          }}
        />
      </SearchContainer>

      {/* Contacts list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : filteredContacts.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No contacts found
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {searchQuery ? 'Try a different search term' : 'Add contacts to start messaging'}
          </Typography>
        </Box>
      ) : (
        <ContactsList>
          {filteredContacts.map((contact) => (
            <React.Fragment key={contact.id}>
              <ListItem
                sx={{ px: 2, py: 1.5 }}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="message"
                      onClick={() => handleMessageContact(contact)}
                      sx={{ mr: 1 }}
                    >
                      <MessageIcon color="primary" />
                    </IconButton>
                    <IconButton edge="end" aria-label="options">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color={contact.status === 'online' ? "success" : "default"}
                  >
                    <Avatar
                      alt={contact.name}
                      src={contact.avatar}
                      sx={{ bgcolor: theme => theme.palette.primary.main }}
                    >
                      {contact.name.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {contact.name}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="text.secondary">
                        @{contact.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatLastSeen(contact.lastSeen, contact.status)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </ContactsList>
      )}

      {/* Add contact dialog */}
      <Dialog
        open={addContactOpen}
        onClose={handleAddContactClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Add New Contact
            <IconButton edge="end" onClick={handleAddContactClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              name="username"
              value={newContact.username}
              onChange={handleNewContactChange}
              error={!!addContactError}
              helperText={addContactError}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Display Name (optional)"
              name="name"
              value={newContact.name}
              onChange={handleNewContactChange}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleAddContactClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddContact}
            variant="contained"
            color="primary"
            disabled={addContactLoading}
            startIcon={addContactLoading ? <CircularProgress size={20} /> : null}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>
    </ContactsContainer>
  );
};

export default Contacts;
