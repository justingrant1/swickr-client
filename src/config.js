/**
 * Application Configuration
 */

// API URL - defaults to localhost for development
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Socket URL - defaults to localhost for development
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

// Brand colors
export const BRAND_COLORS = {
  primary: '#6200ee',  // Purple
  secondary: '#0284c7', // Blue
};

// Common emojis for reactions
export const COMMON_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '✅'];

// Maximum file upload size in bytes (5MB)
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

// Performance targets
export const PERFORMANCE_TARGETS = {
  messageLatency: 500, // ms
  appLaunchTime: 2000, // ms
};

// Feature flags
export const FEATURES = {
  messageReactions: true,
  endToEndEncryption: true,
  mediaSharing: true,
};
