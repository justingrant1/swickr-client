import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Contact service
const contactService = {
  // Get user contacts
  getContacts: async () => {
    try {
      const response = await api.get('/contacts');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get contacts error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch contacts' 
      };
    }
  },

  // Add contact by username or email
  addContact: async (identifier) => {
    try {
      const response = await api.post('/contacts', { identifier });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Add contact error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to add contact' 
      };
    }
  },

  // Add contact by QR code
  addContactByQR: async (qrData) => {
    try {
      const response = await api.post('/contacts/qr', { qrData });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Add contact by QR error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to add contact by QR code' 
      };
    }
  },

  // Remove contact
  removeContact: async (contactId) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      return { success: true };
    } catch (error) {
      console.error('Remove contact error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to remove contact' 
      };
    }
  },

  // Get contact by ID
  getContactById: async (contactId) => {
    try {
      const response = await api.get(`/contacts/${contactId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get contact error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch contact' 
      };
    }
  },

  // Search contacts
  searchContacts: async (query) => {
    try {
      const response = await api.get('/contacts/search', {
        params: { query }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search contacts error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to search contacts' 
      };
    }
  },

  // Generate shareable link
  generateShareableLink: async () => {
    try {
      const response = await api.post('/contacts/share');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Generate shareable link error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to generate shareable link' 
      };
    }
  },

  // Add contact via shareable link
  addContactByLink: async (linkToken) => {
    try {
      const response = await api.post('/contacts/link', { linkToken });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Add contact by link error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to add contact by link' 
      };
    }
  }
};

export default contactService;
