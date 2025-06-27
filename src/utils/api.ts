// Utility to get the correct API base URL based on environment
export const getApiBaseUrl = () => {
  // Debug logging
  console.log('🔍 Environment detection:', {
    'import.meta.env.VITE_API_URL': import.meta.env.VITE_API_URL,
    'import.meta.env.PROD': import.meta.env.PROD,
    'import.meta.env.MODE': import.meta.env.MODE,
    'window.location.hostname': window.location.hostname
  });

  // Check if we have an explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 Using explicit VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're in production more robustly
  const isProduction = import.meta.env.PROD || 
                      import.meta.env.MODE === 'production' || 
                      window.location.hostname !== 'localhost';
  
  // In production, use the same domain with /api prefix
  if (isProduction) {
    console.log('🚀 Production detected, using relative API URL: /api');
    return '/api';
  }
  
  // Default to localhost for development
  console.log('🔧 Development detected, using localhost: http://localhost:3001/api');
  return 'http://localhost:3001/api';
};

// Utility to get the base server URL (without /api)
export const getServerBaseUrl = () => {
  // Check if we have an explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  
  // Check if we're in production more robustly
  const isProduction = import.meta.env.PROD || 
                      import.meta.env.MODE === 'production' || 
                      window.location.hostname !== 'localhost';
  
  // In production, use the same domain
  if (isProduction) {
    return '';
  }
  
  // Default to localhost for development
  return 'http://localhost:3001';
};
