// Vercel serverless function entry point
// Set up environment for the server
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Set database path for production (Vercel has writable /tmp directory)
if (!process.env.DB_PATH) {
  process.env.DB_PATH = '/tmp/benders_workflow.db';
}

// Import and initialize database
const { getDatabase } = require('../server/src/config/database');
const { createTables } = require('../server/src/scripts/initDatabase');

// Initialize database on cold start
let initialized = false;

async function initializeOnce() {
  if (!initialized) {
    try {
      console.log('🔧 Initializing database for Vercel serverless...');
      
      // Get database connection (this will create the DB file)
      const db = getDatabase();
      
      // Create tables if they don't exist
      await createTables();
      
      initialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      // Don't throw - let the app continue and handle errors gracefully
    }
  }
}

// Import the main server app
const app = require('../server/src/index.js');

// Wrap the app to initialize database and handle Vercel routing
module.exports = async (req, res) => {
  await initializeOnce();
  
  // Parse the URL to extract the path that should be handled by Express
  const url = new URL(req.url, `https://${req.headers.host}`);
  let path = url.pathname;
  
  // Log the incoming request for debugging
  console.log('🌐 Serverless request:', { 
    method: req.method, 
    url: req.url, 
    path: path,
    originalUrl: req.url
  });
  
  // For Vercel, we need to adjust the path based on the routing
  // If path starts with /api/, remove it since Express routes expect /api/* internally
  // If path is just /health, keep it as is
  if (path.startsWith('/api/')) {
    // Keep the full path for API routes
    req.url = path + (url.search || '');
  } else if (path === '/health') {
    // Health endpoint should be handled directly
    req.url = '/health';
  } else {
    // For other paths, pass them through
    req.url = path + (url.search || '');
  }
  
  // Set the original URL for Express
  req.originalUrl = req.url;
  
  console.log('🔄 Modified request URL:', req.url);
  
  return app(req, res);
};
