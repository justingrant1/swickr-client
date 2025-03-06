import React from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Paper,
  Divider,
  useTheme,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import LanguageIcon from '@mui/icons-material/Language';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

// Components
import NotificationPerformanceSummary from '../components/notifications/NotificationPerformanceSummary';

/**
 * Settings Page
 * 
 * Main settings page that provides access to all application settings
 */
const Settings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Settings categories
  const settingsCategories = [
    {
      title: 'Account',
      items: [
        { 
          name: 'Profile', 
          icon: <PersonIcon />, 
          route: '/settings/profile',
          description: 'Edit your profile information and preferences'
        },
        { 
          name: 'Security & Privacy', 
          icon: <SecurityIcon />, 
          route: '/settings/security',
          description: 'Manage your security settings and privacy controls'
        }
      ]
    },
    {
      title: 'Application',
      items: [
        { 
          name: 'Notification Settings', 
          icon: <NotificationsIcon />, 
          route: '/notifications/settings',
          description: 'Configure notification preferences and alerts',
          highlight: true
        },
        { 
          name: 'Test Notifications', 
          icon: <NotificationsActiveIcon />, 
          route: '/notifications/test',
          description: 'Send test notifications to verify your setup',
          highlight: true
        },
        { 
          name: 'Notification Performance', 
          icon: <SpeedIcon />, 
          route: '/notifications/performance',
          description: 'View push notification performance metrics',
          highlight: true,
          adminOnly: true
        },
        { 
          name: 'Performance', 
          icon: <SpeedIcon />, 
          route: '/performance',
          description: 'Optimize encrypted presence features and performance settings',
          highlight: true
        },
        { 
          name: 'Data & Storage', 
          icon: <StorageIcon />, 
          route: '/settings/storage',
          description: 'Manage cache, storage usage, and data preferences'
        }
      ]
    },
    {
      title: 'Appearance',
      items: [
        { 
          name: 'Theme', 
          icon: <ColorLensIcon />, 
          route: '/settings/theme',
          description: 'Customize the application theme and appearance'
        },
        { 
          name: 'Language', 
          icon: <LanguageIcon />, 
          route: '/settings/language',
          description: 'Change language and regional settings'
        }
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          name: 'Help & Support', 
          icon: <HelpOutlineIcon />, 
          route: '/settings/help',
          description: 'Get help, view documentation, and contact support'
        }
      ]
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Settings
      </Typography>

      {settingsCategories.map((category, index) => (
        <Box key={category.title} sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1, 
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            {category.title}
          </Typography>
          
          {category.title === 'Application' && (
            <Box sx={{ mb: 2 }}>
              <NotificationPerformanceSummary />
            </Box>
          )}
          
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List disablePadding>
              {category.items.map((item, itemIndex) => (
                <React.Fragment key={item.name}>
                  {itemIndex > 0 && <Divider component="li" />}
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => navigate(item.route)}
                      sx={{
                        py: 1.5,
                        ...(item.highlight && {
                          backgroundColor: `${theme.palette.primary.main}10`,
                          '&:hover': {
                            backgroundColor: `${theme.palette.primary.main}20`,
                          }
                        })
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          color: item.highlight ? 'primary.main' : 'inherit',
                          minWidth: '40px'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: item.highlight ? 600 : 400,
                              color: item.highlight ? 'primary.main' : 'inherit'
                            }}
                          >
                            {item.name}
                          </Typography>
                        }
                        secondary={item.description}
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      ))}
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Swickr v1.0.0
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings;
