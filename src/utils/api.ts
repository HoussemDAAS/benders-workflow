// Utility to get the correct API base URL based on environment
export const getApiBaseUrl = () => {
  // Check if we have an explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use the same domain with /api prefix
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Default to localhost for development
  return 'http://localhost:3001/api';
};

// Utility to get the base server URL (without /api)
export const getServerBaseUrl = () => {
  // Check if we have an explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  
  // In production, use the same domain
  if (import.meta.env.PROD) {
    return '';
  }
  
  // Default to localhost for development
  return 'http://localhost:3001';
};
