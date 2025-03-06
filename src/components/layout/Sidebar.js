import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  IconButton,
  InputBase,
  Badge,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Chat as ChatIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';

// Drawer width
const drawerWidth = 280;

// Styled search component
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Sidebar = ({ open, onClose, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation items
  const navItems = [
    { text: 'Messages', icon: <ChatIcon />, path: '/', badge: 5 },
    { text: 'Contacts', icon: <PeopleIcon />, path: '/contacts', badge: 0 },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', badge: 0 },
  ];

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Drawer content
  const drawerContent = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            alt={user?.displayName || 'User'}
            src={user?.avatar}
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: 'primary.main',
              mr: 1
            }}
          >
            {user?.displayName?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.displayName || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.username || '@username'}
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Search sx={{ 
          backgroundColor: (theme) => 
            theme.palette.mode === 'dark' 
              ? alpha(theme.palette.common.white, 0.05) 
              : alpha(theme.palette.common.black, 0.05)
        }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            value={searchQuery}
            onChange={handleSearch}
          />
        </Search>
      </Box>

      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.2) 
                      : alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: (theme) => 
                      theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.primary.main, 0.3) 
                        : alpha(theme.palette.primary.main, 0.2),
                  },
                },
              }}
            >
              <ListItemIcon>
                {item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 2 }}>
        <Tooltip title="Add new contact">
          <IconButton
            color="primary"
            sx={{
              bgcolor: (theme) => 
                theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.2) 
                  : alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: (theme) => 
                  theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.3) 
                    : alpha(theme.palette.primary.main, 0.2),
              },
              width: 44,
              height: 44
            }}
            onClick={() => handleNavigation('/contacts/add')}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );

  return (
    <>
      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: (theme) => 
                `1px solid ${theme.palette.divider}`
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        // Desktop drawer
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: (theme) => 
                `1px solid ${theme.palette.divider}`
            },
            width: open ? drawerWidth : 0,
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
