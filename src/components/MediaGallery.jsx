import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Grid, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useMedia } from '../context/MediaContext';
import MediaDisplay from './MediaDisplay';
import mediaService from '../services/mediaService';

// Styled components
const GalleryContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
}));

const MediaItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  aspectRatio: '1/1',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.9,
  }
}));

const MediaItemImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const MediaItemIcon = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.primary.main,
}));

const MediaTypeLabel = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(0.5),
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  fontSize: '0.75rem',
  textAlign: 'center',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
  height: '100%',
}));

const LoadMoreButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

const FilterBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StatsBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

/**
 * MediaGallery Component
 * 
 * Displays a gallery of media files shared in a conversation
 */
const MediaGallery = ({ conversationId, onClose }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [contextMedia, setContextMedia] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  
  const { 
    galleryState,
    getConversationMedia, 
    downloadMedia, 
    deleteMedia,
    loadMoreMedia,
    setMediaFilter,
    resetMediaFilter,
    loadingMedia
  } = useMedia();

  const { mediaList, pagination, loading, error, filter } = galleryState;

  // Initial data fetch
  useEffect(() => {
    const fetchMedia = async () => {
      if (!conversationId) return;
      
      try {
        await getConversationMedia(conversationId);
      } catch (err) {
        console.error('Error fetching media:', err);
      }
    };

    fetchMedia();
    
    // Cleanup function to reset gallery state when component unmounts
    return () => {
      // Reset filter when unmounting
      resetMediaFilter();
    };
  }, [conversationId, getConversationMedia, resetMediaFilter]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Apply filter based on tab
    if (newValue === 'all') {
      setMediaFilter({ mediaType: null }, conversationId);
    } else {
      setMediaFilter({ mediaType: newValue }, conversationId);
    }
  };

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (conversationId && pagination.hasMore && !loading) {
      loadMoreMedia(conversationId);
    }
  }, [conversationId, pagination.hasMore, loading, loadMoreMedia]);

  // Handle media click
  const handleMediaClick = (mediaItem) => {
    setSelectedMedia(mediaItem);
  };

  // Handle close preview
  const handleClosePreview = () => {
    setSelectedMedia(null);
  };

  // Handle menu open
  const handleMenuOpen = (event, mediaItem) => {
    event.stopPropagation();
    setContextMedia(mediaItem);
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setContextMedia(null);
  };

  // Handle download
  const handleDownload = () => {
    if (contextMedia) {
      downloadMedia(
        contextMedia.id, 
        contextMedia.originalFilename || `${contextMedia.mediaType}-file`
      );
    }
    handleMenuClose();
  };

  // Handle delete
  const handleDelete = async () => {
    if (contextMedia) {
      try {
        await deleteMedia(contextMedia.id);
      } catch (err) {
        console.error('Error deleting media:', err);
      }
    }
    handleMenuClose();
  };

  // Handle filter menu
  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle sort menu
  const handleSortMenuOpen = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    resetMediaFilter(conversationId);
    setActiveTab('all');
    handleFilterMenuClose();
  };

  // Render media type icon
  const renderMediaTypeIcon = (mediaItem) => {
    const mediaType = mediaItem.mediaType || 
      (mediaItem.mimeType ? mediaItem.mimeType.split('/')[0] : 'unknown');
    
    if (mediaType === 'image') {
      return <ImageIcon fontSize="large" />;
    } else if (mediaType === 'video') {
      return <VideoIcon fontSize="large" />;
    } else if (mediaType === 'audio') {
      return <AudioIcon fontSize="large" />;
    } else {
      return <FileIcon fontSize="large" />;
    }
  };

  // Render media thumbnail
  const renderMediaThumbnail = (mediaItem) => {
    const mediaType = mediaItem.mediaType || 
      (mediaItem.mimeType ? mediaItem.mimeType.split('/')[0] : 'unknown');
    
    // Use the thumbnail URL from the media service
    const thumbnailUrl = mediaService.getMediaThumbnailUrl(mediaItem.id);
    
    if (mediaType === 'image') {
      return (
        <MediaItemImage 
          src={thumbnailUrl || mediaItem.url} 
          alt={mediaItem.originalFilename || 'Image'} 
          loading="lazy"
        />
      );
    }
    
    return (
      <MediaItemIcon>
        {renderMediaTypeIcon(mediaItem)}
      </MediaItemIcon>
    );
  };

  // Render content
  const renderContent = () => {
    if (loading && mediaList.length === 0) {
      return (
        <EmptyState>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading media...
          </Typography>
        </EmptyState>
      );
    }

    if (error && mediaList.length === 0) {
      return (
        <EmptyState>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => getConversationMedia(conversationId)}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </EmptyState>
      );
    }

    if (mediaList.length === 0) {
      return (
        <EmptyState>
          <Typography variant="body1">
            No media files found in this conversation.
          </Typography>
        </EmptyState>
      );
    }

    return (
      <>
        <Grid container spacing={1} sx={{ p: 1, flexGrow: 1, overflow: 'auto' }}>
          {mediaList.map((mediaItem) => (
            <Grid item xs={4} sm={3} md={2} key={mediaItem.id}>
              <MediaItem onClick={() => handleMediaClick(mediaItem)}>
                {renderMediaThumbnail(mediaItem)}
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }
                  }}
                  onClick={(e) => handleMenuOpen(e, mediaItem)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <MediaTypeLabel>
                  {mediaItem.originalFilename || `${mediaItem.mediaType} file`}
                </MediaTypeLabel>
              </MediaItem>
            </Grid>
          ))}
        </Grid>
        
        {pagination.hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <LoadMoreButton
              variant="outlined"
              onClick={handleLoadMore}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Loading...' : 'Load More'}
            </LoadMoreButton>
          </Box>
        )}
      </>
    );
  };

  return (
    <GalleryContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Media Gallery
        </Typography>
        <Tooltip title="Sort options">
          <IconButton onClick={handleSortMenuOpen}>
            <SortIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Filter options">
          <IconButton onClick={handleFilterMenuOpen}>
            <FilterIcon />
          </IconButton>
        </Tooltip>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={
          <Badge badgeContent={pagination.total || 0} color="primary" showZero={false}>
            All
          </Badge>
        } value="all" />
        <Tab label={
          <Badge badgeContent={pagination.counts?.image || 0} color="primary" showZero={false}>
            Images
          </Badge>
        } value="image" />
        <Tab label={
          <Badge badgeContent={pagination.counts?.video || 0} color="primary" showZero={false}>
            Videos
          </Badge>
        } value="video" />
        <Tab label={
          <Badge badgeContent={pagination.counts?.audio || 0} color="primary" showZero={false}>
            Audio
          </Badge>
        } value="audio" />
        <Tab label={
          <Badge badgeContent={pagination.counts?.document || 0} color="primary" showZero={false}>
            Documents
          </Badge>
        } value="document" />
      </Tabs>
      
      {/* Stats bar */}
      <StatsBar>
        <Typography variant="body2">
          {pagination.total} {pagination.total === 1 ? 'item' : 'items'}
          {filter.mediaType && ` • Filtered by: ${filter.mediaType}`}
          {filter.sort && ` • Sorted: ${filter.sort}`}
        </Typography>
      </StatsBar>
      
      {renderContent()}
      
      {/* Media preview dialog */}
      <Dialog
        open={!!selectedMedia}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" noWrap sx={{ maxWidth: '80%' }}>
            {selectedMedia?.originalFilename || 'Media Preview'}
          </Typography>
          <IconButton onClick={handleClosePreview}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMedia && (
            <MediaDisplay media={selectedMedia} />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (selectedMedia) {
                downloadMedia(
                  selectedMedia.id, 
                  selectedMedia.originalFilename || `${selectedMedia.mediaType}-file`
                );
              }
            }}
            startIcon={<DownloadIcon />}
          >
            Download
          </Button>
          <Button 
            onClick={handleClosePreview}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Context menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDownload}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Filter menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem onClick={handleFilterReset}>
          <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
          Reset Filters
        </MenuItem>
      </Menu>
      
      {/* Sort menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortMenuClose}
      >
        <MenuItem onClick={() => {
          setMediaFilter({ sort: 'newest' }, conversationId);
          handleSortMenuClose();
        }}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => {
          setMediaFilter({ sort: 'oldest' }, conversationId);
          handleSortMenuClose();
        }}>
          Oldest First
        </MenuItem>
        <MenuItem onClick={() => {
          setMediaFilter({ sort: 'largest' }, conversationId);
          handleSortMenuClose();
        }}>
          Largest First
        </MenuItem>
        <MenuItem onClick={() => {
          setMediaFilter({ sort: 'smallest' }, conversationId);
          handleSortMenuClose();
        }}>
          Smallest First
        </MenuItem>
      </Menu>
    </GalleryContainer>
  );
};

MediaGallery.propTypes = {
  conversationId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default MediaGallery;
