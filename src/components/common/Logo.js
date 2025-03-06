import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FlashOn } from '@mui/icons-material';

// Logo component for Swickr
const Logo = ({ variant = 'default', sx = {} }) => {
  const theme = useTheme();
  
  // Determine size based on variant
  const getSize = () => {
    switch (variant) {
      case 'small':
        return {
          fontSize: '1.25rem',
          iconSize: 20
        };
      case 'large':
        return {
          fontSize: '2.5rem',
          iconSize: 36
        };
      case 'default':
      default:
        return {
          fontSize: '1.75rem',
          iconSize: 28
        };
    }
  };
  
  const { fontSize, iconSize } = getSize();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        ...sx 
      }}
    >
      <FlashOn 
        sx={{ 
          color: theme.palette.primary.main,
          fontSize: iconSize,
          mr: 0.5
        }} 
      />
      <Typography
        variant="h6"
        component="span"
        sx={{
          fontWeight: 700,
          fontSize,
          color: theme.palette.primary.main,
          letterSpacing: '-0.5px'
        }}
      >
        Swickr
      </Typography>
    </Box>
  );
};

export default Logo;
