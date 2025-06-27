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

// Wrap the app to initialize database on each request if needed
module.exports = async (req, res) => {
  await initializeOnce();
  return app(req, res);
};
