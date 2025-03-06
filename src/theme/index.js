import { createTheme } from '@mui/material/styles';

// Swickr brand colors
const PRIMARY_COLOR = '#6200ee'; // Purple
const SECONDARY_COLOR = '#0284c7'; // Blue accent

// Create a theme instance for Swickr
const createSwickrTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: PRIMARY_COLOR,
        light: mode === 'dark' ? '#9b4dff' : '#7e3ff2',
        dark: mode === 'dark' ? '#4b00b5' : '#4a00b0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: SECONDARY_COLOR,
        light: mode === 'dark' ? '#4da8e5' : '#3a9bd8',
        dark: mode === 'dark' ? '#016094' : '#01568a',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212121',
        secondary: mode === 'dark' ? '#b0b0b0' : '#757575',
      },
      error: {
        main: '#f44336',
      },
      warning: {
        main: '#ff9800',
      },
      info: {
        main: '#2196f3',
      },
      success: {
        main: '#4caf50',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '0.875rem',
      },
      body1: {
        fontSize: '1rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
      button: {
        textTransform: 'none',
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
            borderRadius: 8,
            padding: '10px 16px',
            minHeight: 44, // Minimum touch target size
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#7a1fe2' : '#7a1fe2',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            padding: 12, // Ensure minimum touch target size
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            minHeight: 44, // Minimum touch target size
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            minHeight: 44, // Minimum touch target size
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#212121',
            boxShadow: mode === 'dark' 
              ? '0 2px 4px rgba(0,0,0,0.3)' 
              : '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark' 
              ? '0 4px 8px rgba(0,0,0,0.4)' 
              : '0 2px 8px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
      },
    },
  });
};

export default createSwickrTheme;
