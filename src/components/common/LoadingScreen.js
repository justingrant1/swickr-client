import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Loading screen component
const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: (theme) => theme.palette.background.default
      }}
    >
      <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
      <Typography
        variant="h6"
        sx={{ mt: 3, color: 'text.secondary', fontWeight: 500 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
