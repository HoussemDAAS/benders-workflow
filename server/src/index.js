require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import database and routes
const { getDatabase } = require('./config/database');
const { createTables } = require('./scripts/initDatabase');

// Import route handlers
const authRoutes = require('./routes/auth');
const workspacesRoutes = require('./routes/workspaces');
const clientsRoutes = require('./routes/clients');
const workflowsRoutes = require('./routes/workflows');
const tasksRoutes = require('./routes/tasks');
// const teamRoutes = require('./routes/team'); // TODO: Commented out for user auth implementation
const meetingsRoutes = require('./routes/meetings');
const dashboardRoutes = require('./routes/dashboard');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting disabled for development
// const limiter = rateLimit({...});
// app.use('/api/', limiter);

// Enhanced CORS configuration for production
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://benders.io',
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow any Vercel deployment
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Email service health check endpoint
app.get('/health/email', async (req, res) => {
  try {
    const emailService = require('./services/emailService');
    const emailHealth = await emailService.healthCheck();
    
    res.json({
      status: emailHealth.totalProviders > 0 ? 'OK' : 'WARNING',
      timestamp: new Date().toISOString(),
      emailService: emailHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/tasks', tasksRoutes);
// app.use('/api/team', teamRoutes); // TODO: Commented out for user auth implementation
app.use('/api/meetings', meetingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Benders Workflow Management API',
    version: '1.0.0',
    description: 'Backend API for the Benders Workflow Management System',
    endpoints: {
      auth: '/api/auth',
      workspaces: '/api/workspaces',
      clients: '/api/clients',
      workflows: '/api/workflows',
      tasks: '/api/tasks',
      team: '/api/team',
      meetings: '/api/meetings',
      dashboard: '/api/dashboard'
    },
    documentation: {
      health: 'GET /health',
      auth: {
        'Login': 'POST /api/auth/login',
        'Magic Link': 'POST /api/auth/magic-link',
        'Verify Magic Link': 'POST /api/auth/verify-magic-link',
        'Register': 'POST /api/auth/register',
        'Get Current User': 'GET /api/auth/me',
        'Logout': 'POST /api/auth/logout'
      },
      clients: {
        'Get all clients': 'GET /api/clients',
        'Get client by ID': 'GET /api/clients/:id',
        'Create client': 'POST /api/clients',
        'Update client': 'PUT /api/clients/:id',
        'Delete client': 'DELETE /api/clients/:id'
      },
      workflows: {
        'Get all workflows': 'GET /api/workflows',
        'Get workflow by ID': 'GET /api/workflows/:id',
        'Create workflow': 'POST /api/workflows',
        'Update workflow': 'PUT /api/workflows/:id',
        'Delete workflow': 'DELETE /api/workflows/:id'
      },
      tasks: {
        'Get all tasks': 'GET /api/tasks',
        'Get task by ID': 'GET /api/tasks/:id',
        'Create task': 'POST /api/tasks',
        'Update task': 'PUT /api/tasks/:id',
        'Move task': 'PATCH /api/tasks/:id/move',
        'Delete task': 'DELETE /api/tasks/:id'
      },
      team: {
        'Get all team members': 'GET /api/team',
        'Get team member by ID': 'GET /api/team/:id',
        'Create team member': 'POST /api/team',
        'Update team member': 'PUT /api/team/:id',
        'Delete team member': 'DELETE /api/team/:id'
      },
      meetings: {
        'Get all meetings': 'GET /api/meetings',
        'Get meeting by ID': 'GET /api/meetings/:id',
        'Create meeting': 'POST /api/meetings',
        'Update meeting': 'PUT /api/meetings/:id',
        'Delete meeting': 'DELETE /api/meetings/:id'
      },
      dashboard: {
        'Get dashboard stats': 'GET /api/dashboard/stats',
        'Get recent activity': 'GET /api/dashboard/recent-activity',
        'Get task distribution': 'GET /api/dashboard/task-distribution',
        'Get workflow progress': 'GET /api/dashboard/workflow-progress'
      }
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

module.exports = app;