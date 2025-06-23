const express = require('express');
const { body, validationResult } = require('express-validator');
const { google } = require('googleapis');
const User = require('../models/User');
const { createAuthRateLimit } = require('../middleware/auth');
const router = express.Router();

// Rate limiting for auth endpoints
const loginRateLimit = createAuthRateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
const magicLinkRateLimit = createAuthRateLimit(5 * 60 * 1000, 3); // 3 attempts per 5 minutes

// Google OAuth configuration
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/callback/google`
};

// Create Google OAuth client
const createGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirectUri
  );
};

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateMagicLink = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('role').optional().isIn(['admin', 'manager', 'user']).withMessage('Invalid role'),
];

// POST /auth/login - Email/Password login
router.post('/login', loginRateLimit, validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = user.generateToken();

    // Clear rate limit attempts on successful login
    if (req.clearAuthAttempts) {
      req.clearAuthAttempts();
    }

    res.json({
      user: user.toSafeJSON(),
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/magic-link - Send magic link
router.post('/magic-link', magicLinkRateLimit, validateMagicLink, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return res.json({ message: 'If an account exists with this email, a magic link has been sent.' });
    }

    // Generate magic link token
    const magicToken = user.generateMagicLinkToken();
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/verify?token=${magicToken}`;

    // In a real app, you would send this via email
    // For now, we'll log it to console for testing
    console.log('🔗 Magic Link for', email, ':', magicLink);

    // TODO: Implement actual email sending
    // await sendMagicLinkEmail(user.email, magicLink);

    res.json({ message: 'If an account exists with this email, a magic link has been sent.' });
  } catch (error) {
    console.error('Magic link error:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// POST /auth/verify-magic-link - Verify magic link token
router.post('/verify-magic-link', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify token
    const decoded = User.verifyToken(token);
    if (!decoded || decoded.type !== 'magic-link') {
      return res.status(401).json({ error: 'Invalid or expired magic link' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate new auth token
    const authToken = user.generateToken();

    res.json({
      user: user.toSafeJSON(),
      token: authToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    res.status(500).json({ error: 'Magic link verification failed' });
  }
});

// POST /auth/register - Register new user (admin only in production)
router.post('/register', validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      role,
      emailVerified: true // Auto-verify in development
    });

    await user.save();

    // Generate token
    const token = user.generateToken();

    res.status(201).json({
      user: user.toSafeJSON(),
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = User.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(user.toSafeJSON());
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// POST /auth/logout - Logout (client-side token removal)
router.post('/logout', async (req, res) => {
  try {
    // In a more advanced implementation, you could blacklist tokens
    // For now, we rely on client-side token removal
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Google OAuth - Get authorization URL
router.get('/google/url', async (req, res) => {
  try {
    if (!googleConfig.clientId || !googleConfig.clientSecret) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const oauth2Client = createGoogleOAuthClient();
    
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      redirect_uri: googleConfig.redirectUri // Explicitly set redirect URI
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate Google OAuth URL' });
  }
});

// Google OAuth callback
router.post('/callback/google', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    if (!googleConfig.clientId || !googleConfig.clientSecret) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    // Create OAuth client with explicit redirect URI
    const oauth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.redirectUri
    );
    
    console.log('🔧 Google OAuth Debug:', {
      clientId: googleConfig.clientId,
      redirectUri: googleConfig.redirectUri,
      codeReceived: !!code
    });
    
    // Exchange authorization code for access token
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: googleConfig.redirectUri // Explicitly set redirect URI
    });
    oauth2Client.setCredentials(tokens);

    // Get user profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    console.log('✅ Google Profile Retrieved:', {
      email: profile.email,
      name: profile.name,
      verified_email: profile.verified_email
    });

    if (!profile.email) {
      return res.status(400).json({ error: 'Unable to get email from Google profile' });
    }

    // Check if user already exists
    let user = await User.findByEmail(profile.email);
    
    if (!user) {
      // Create new user from Google profile
      user = new User({
        email: profile.email.toLowerCase(),
        name: profile.name || profile.email.split('@')[0],
        role: 'user', // Default role for OAuth users
        emailVerified: true, // Google emails are verified
        isActive: true
      });
      
      // Don't set password for OAuth users
      await user.save();
      
      console.log(`✓ Created new user from Google OAuth: ${profile.email}`);
    } else {
      // Update last login for existing user
      await user.updateLastLogin();
      
      // Update user info if changed
      if (user.name !== profile.name && profile.name) {
        user.name = profile.name;
        await user.save();
      }
      
      console.log(`✓ Existing user logged in via Google OAuth: ${profile.email}`);
    }

    // Generate JWT token
    const token = user.generateToken();

    console.log('🎉 Google OAuth Success:', {
      userId: user.id,
      email: user.email,
      tokenGenerated: !!token
    });

    res.json({
      user: user.toSafeJSON(),
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    
    let errorMessage = 'Google authentication failed';
    if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Authorization code expired. Please try again.';
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      errorMessage = 'OAuth configuration error. Please contact support.';
      console.error('🔴 Redirect URI Mismatch - Expected:', googleConfig.redirectUri);
    } else if (error.message?.includes('invalid_client')) {
      errorMessage = 'OAuth client configuration error. Please contact support.';
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// GitHub OAuth callback handlers (placeholder for future implementation)
router.post('/callback/github', async (req, res) => {
  try {
    const { code } = req.body;
    
    // TODO: Implement GitHub OAuth flow
    // 1. Exchange code for access token
    // 2. Get user profile from GitHub
    // 3. Create or find user in database
    // 4. Generate JWT token
    
    res.status(501).json({ error: 'GitHub OAuth not yet implemented' });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'GitHub OAuth failed' });
  }
});

// POST /auth/refresh - Refresh token (placeholder)
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // TODO: Implement refresh token logic
    // For now, users need to re-authenticate when tokens expire
    
    res.status(501).json({ error: 'Token refresh not yet implemented' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

module.exports = router;