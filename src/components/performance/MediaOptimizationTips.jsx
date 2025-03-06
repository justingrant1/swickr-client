import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SpeedIcon from '@mui/icons-material/Speed';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import CompressIcon from '@mui/icons-material/Compress';
import CachedIcon from '@mui/icons-material/Cached';
import ImageIcon from '@mui/icons-material/Image';

/**
 * Media Optimization Tips Component
 * 
 * Displays helpful tips for optimizing media performance in Swickr
 */
const MediaOptimizationTips = () => {
  const theme = useTheme();

  return (
    <Card sx={{ mb: 3, bgcolor: theme.palette.background.paper }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TipsAndUpdatesIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Media Optimization Tips
          </Typography>
        </Box>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Follow these tips to improve media performance and optimize your Swickr experience:
        </Typography>
        
        <List sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1, p: 1 }}>
          <ListItem>
            <ListItemIcon>
              <PhotoSizeSelectActualIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Optimize Image Sizes" 
              secondary="Resize large images before uploading. Images over 2000px in width or height will be automatically resized."
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CompressIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Use WebP Format" 
              secondary="Enable WebP format in settings for up to 75% smaller file sizes with comparable quality."
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CachedIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Enable Media Caching" 
              secondary="Keep media caching enabled to improve load times for frequently viewed media."
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem>
            <ListItemIcon>
              <SpeedIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Batch Upload Media" 
              secondary="Use batch uploads instead of uploading files one by one for better performance."
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem>
            <ListItemIcon>
              <ImageIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Regenerate Thumbnails" 
              secondary="Use the 'Regenerate Thumbnails' feature in advanced settings to apply new optimization settings to existing media."
            />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.primary.main + '10', borderRadius: 1, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
          <Typography variant="subtitle2" gutterBottom>
            Did you know?
          </Typography>
          <Typography variant="body2">
            Swickr's WebP conversion can reduce image sizes by up to 75% while maintaining visual quality.
            This significantly improves loading times and reduces data usage, especially on mobile devices.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MediaOptimizationTips;
