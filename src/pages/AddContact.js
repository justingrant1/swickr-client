import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import contactService from '../services/contactService';

// Styled components
const Container = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default
}));

const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const ResultsContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto'
}));

const AddContact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [addingContact, setAddingContact] = useState({});

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Clear previous results if search query is empty
    if (!e.target.value.trim()) {
      setSearchResults([]);
    }
  };

  // Handle search submit
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a username to search');
      return;
    }
    
    setSearching(true);
    setError('');
    
    try {
      const response = await contactService.searchContacts(searchQuery);
      
      if (response.success) {
        setSearchResults(response.data);
      } else {
        setError(response.error || 'Failed to search users');
        setSearchResults([]);
      }
    } catch (err) {
      setError('Error searching users: ' + (err.message || 'Unknown error'));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle add contact
  const handleAddContact = async (contactId) => {
    setAddingContact(prev => ({ ...prev, [contactId]: true }));
    
    try {
      // Get the user details from search results
      const userToAdd = searchResults.find(user => user.id === contactId);
      
      if (!userToAdd) {
        throw new Error('User not found in search results');
      }
      
      const response = await contactService.addContact(userToAdd.username);
      
      if (response.success) {
        setAddingContact(prev => ({ ...prev, [contactId]: 'added' }));
        
        // After a delay, navigate back to contacts
        setTimeout(() => {
          navigate('/contacts');
        }, 1000);
      } else {
        setError(response.error || 'Failed to add contact');
        setAddingContact(prev => {
          const newState = { ...prev };
          delete newState[contactId];
          return newState;
        });
      }
    } catch (err) {
      setError('Error adding contact: ' + (err.message || 'Unknown error'));
      setAddingContact(prev => {
        const newState = { ...prev };
        delete newState[contactId];
        return newState;
      });
    }
  };

  // Handle back button
  const handleBack = () => {
    navigate('/contacts');
  };

  return (
    <Container>
      {/* Header */}
      <Header>
        <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Add New Contact
        </Typography>
      </Header>

      {/* Search form */}
      <SearchContainer>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="Search by username..."
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              endAdornment: (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  sx={{ borderRadius: 2 }}
                >
                  {searching ? <CircularProgress size={24} /> : 'Search'}
                </Button>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                pr: 1
              },
            }}
          />
        </form>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Search for users by their username to add them to your contacts.
        </Typography>
      </SearchContainer>

      {/* Search results */}
      <ResultsContainer>
        {searching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : searchResults.length > 0 ? (
          <List>
            {searchResults.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem
                  sx={{ px: 2, py: 1.5 }}
                  secondaryAction={
                    addingContact[user.id] === 'added' ? (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        disabled
                      >
                        Added
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleAddContact(user.id)}
                        disabled={!!addingContact[user.id]}
                      >
                        {addingContact[user.id] ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Add'
                        )}
                      </Button>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      alt={user.name}
                      src={user.avatar}
                      sx={{ bgcolor: theme => theme.palette.primary.main }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {user.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        @{user.username}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : searchQuery && !searching ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No users found
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Try a different username or check the spelling
            </Typography>
          </Box>
        ) : null}
      </ResultsContainer>
    </Container>
  );
};

export default AddContact;
