import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  CssBaseline, 
  ThemeProvider, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container 
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import ReactionsDemo from './pages/ReactionsDemo';
import Settings from './pages/Settings';
import PerformanceSettings from './pages/PerformanceSettings';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import NotificationTestPage from './pages/NotificationTestPage';
import NotificationPerformanceDashboard from './pages/NotificationPerformanceDashboard';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationBadge from './components/notifications/NotificationBadge';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import NotificationToast from './components/notifications/NotificationToast';

// Create theme with Swickr brand colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#6200ee', // Purple primary color
    },
    secondary: {
      main: '#0284c7', // Blue accent color
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

/**
 * Main App Component
 * 
 * Provides routing and global providers for the application
 */
function App() {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  const handleOpenNotificationDrawer = () => {
    setNotificationDrawerOpen(true);
  };

  const handleCloseNotificationDrawer = () => {
    setNotificationDrawerOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Router>
              <AppBar position="static" color="primary">
                <Toolbar>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Swickr
                  </Typography>
                  <Button color="inherit" component={Link} to="/">
                    Home
                  </Button>
                  <Button color="inherit" component={Link} to="/reactions-demo">
                    Reactions Demo
                  </Button>
                  <Button color="inherit" component={Link} to="/settings">
                    Settings
                  </Button>
                  <NotificationBadge onClick={handleOpenNotificationDrawer} />
                </Toolbar>
              </AppBar>
              
              <Container sx={{ mt: 4 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/reactions-demo" element={<ReactionsDemo />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/performance" element={<PerformanceSettings />} />
                  <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
                  <Route path="/notifications/test" element={<NotificationTestPage />} />
                  <Route path="/notifications/performance" element={<NotificationPerformanceDashboard />} />
                </Routes>
              </Container>

              {/* Notification Components */}
              <NotificationDrawer 
                open={notificationDrawerOpen} 
                onClose={handleCloseNotificationDrawer} 
              />
              <NotificationToast />
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Home Component
 * 
 * Simple home page with links to other pages
 */
function Home() {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Swickr
      </Typography>
      <Typography variant="body1" paragraph>
        A high-performance messaging service with focus on speed and simplicity.
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/reactions-demo"
          size="large"
          sx={{ m: 1 }}
        >
          Try Message Reactions Demo
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          component={Link} 
          to="/notifications/test"
          size="large"
          sx={{ m: 1 }}
        >
          Test Push Notifications
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          component={Link} 
          to="/settings"
          size="large"
          sx={{ m: 1 }}
        >
          Settings
        </Button>
      </Box>
      
      <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
        New! Push notifications are now available. Configure them in the Settings.
      </Typography>
    </Box>
  );
}

export default App;
