const User = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = User.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get current user data from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Authorization middleware - check user roles
const authorize = (roles = []) => {
  // roles can be a single role string or an array of roles
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Optional authentication - adds user to request if token is present but doesn't fail if missing
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = User.verifyToken(token);
      
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors, just proceed without user
    next();
  }
};

// Rate limiting for auth endpoints
const createAuthRateLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + ':' + (req.body.email || 'unknown');
    const now = Date.now();
    
    // Clean old attempts
    for (const [attemptKey, attempt] of attempts.entries()) {
      if (now - attempt.timestamp > windowMs) {
        attempts.delete(attemptKey);
      }
    }
    
    const attempt = attempts.get(key);
    if (attempt && attempt.count >= max) {
      return res.status(429).json({ 
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((attempt.timestamp + windowMs - now) / 1000)
      });
    }
    
    // Track this attempt
    if (attempt) {
      attempt.count++;
    } else {
      attempts.set(key, { count: 1, timestamp: now });
    }
    
    // Clear successful attempts on successful auth
    req.clearAuthAttempts = () => attempts.delete(key);
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  createAuthRateLimit
};