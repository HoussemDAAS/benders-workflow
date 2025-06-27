// Vercel serverless function entry point
// Set up environment for the server
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the main server app
const app = require('../server/src/index.js');

module.exports = app;
