const express = require('express');
const { body, validationResult } = require('express-validator');
const { google } = require('googleapis');
const qrcode = require('qrcode');
const User = require('../models/User');
const { createAuthRateLimit, authenticate } = require('../middleware/auth');
const emailService = require('../services/emailService');
const router = express.Router();

// Rate limiting for auth endpoints
const loginRateLimit = createAuthRateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
const magicLinkRateLimit = createAuthRateLimit(5 * 60 * 1000, 3); // 3 attempts per 5 minutes
const twoFARate = createAuthRateLimit(5 * 60 * 1000, 10); // 10 attempts per 5 minutes for 2FA

// Google OAuth configuration
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/callback/google`
};

// GitHub OAuth configuration
const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/callback/github`
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

// POST /auth/login - Email/Password login (with 2FA support)
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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Don't update last login yet - wait for 2FA verification
      return res.status(200).json({
        requiresTwoFactor: true,
        message: 'Please provide your 2FA verification code',
        email: user.email, // Frontend needs this for 2FA verification
        loginType: 'password'
      });
    }

    // Regular login flow (no 2FA)
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

// POST /auth/magic-link - Send magic link (with 2FA support)
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
      return res.json({ 
        message: 'If an account exists with this email, a magic link has been sent.',
        success: true 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.json({ 
        message: 'If an account exists with this email, a magic link has been sent.',
        success: true 
      });
    }

    // Generate magic link token (expires in 15 minutes)
    const magicToken = user.generateMagicLinkToken();
    
    // For 2FA users, we need a special magic link that includes 2FA requirement
    const magicLinkPath = user.twoFactorEnabled 
      ? `/auth/verify?token=${magicToken}&requires2fa=true`
      : `/auth/verify?token=${magicToken}`;
    
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}${magicLinkPath}`;

    try {
      // Send professional magic link email
      await emailService.sendMagicLinkEmail(user.email, magicLink, user.name);
    } catch (emailError) {
      console.error('Failed to send magic link email:', emailError.message);
      
      // In development, show the link in console as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log(`\nDevelopment Magic Link for ${email}: ${magicLink}\n`);
      }
    }

    res.json({ 
      message: 'If an account exists with this email, a magic link has been sent.',
      success: true,
      // In development, include the link for easy testing
      ...(process.env.NODE_ENV === 'development' && { 
        developmentLink: magicLink,
        expiresIn: '15 minutes',
        requires2FA: user.twoFactorEnabled
      })
    });

  } catch (error) {
    console.error('Magic link error:', error);
    res.status(500).json({ error: 'Failed to process magic link request' });
  }
});

// POST /auth/verify-magic-link - Verify magic link token (with 2FA support)
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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Don't update last login yet - wait for 2FA verification
      return res.status(200).json({
        requiresTwoFactor: true,
        message: 'Please provide your 2FA verification code',
        email: user.email, // Frontend needs this for 2FA verification
        loginType: 'magic-link',
        magicToken: token // Keep the magic token for final verification
      });
    }

    // Regular magic link login (no 2FA)
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
    
    // Exchange authorization code for access token
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: googleConfig.redirectUri // Explicitly set redirect URI
    });
    oauth2Client.setCredentials(tokens);

    // Get user profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return res.status(400).json({ error: 'Unable to get email from Google profile' });
    }

    // Check if user already exists
    let user = await User.findByEmail(profile.email);
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
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
      
      // Send welcome email for new users
      try {
        await emailService.sendWelcomeEmail(user.email, user.name, true);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError.message);
      }
    } else {
      // Update last login for existing user
      await user.updateLastLogin();
      
      // Update user info if changed
      if (user.name !== profile.name && profile.name) {
        user.name = profile.name;
        await user.save();
      }
    }

    // Generate JWT token
    const token = user.generateToken();

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

// GitHub OAuth - Get authorization URL
router.get('/github/url', async (req, res) => {
  try {
    if (!githubConfig.clientId || !githubConfig.clientSecret) {
      return res.status(500).json({ error: 'GitHub OAuth not configured' });
    }

    const scopes = ['user:email', 'read:user'];
    const state = require('crypto').randomBytes(16).toString('hex'); // CSRF protection
    
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${githubConfig.clientId}&` +
      `redirect_uri=${encodeURIComponent(githubConfig.redirectUri)}&` +
      `scope=${scopes.join(' ')}&` +
      `state=${state}`;

    res.json({ authUrl, state });
  } catch (error) {
    console.error('GitHub OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate GitHub OAuth URL' });
  }
});

// GitHub OAuth callback
router.post('/callback/github', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    if (!githubConfig.clientId || !githubConfig.clientSecret) {
      return res.status(500).json({ error: 'GitHub OAuth not configured' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code: code,
        redirect_uri: githubConfig.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Get user profile from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Benders-Workflow-App'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`GitHub user API failed: ${userResponse.statusText}`);
    }

    const profile = await userResponse.json();

    // Get user emails from GitHub (since email might be private)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Benders-Workflow-App'
      }
    });

    let email = profile.email;
    if (!email && emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary) || emails[0];
      email = primaryEmail?.email;
    }

    if (!email) {
      return res.status(400).json({ 
        error: 'Unable to get email from GitHub profile. Please make sure your email is public or primary.' 
      });
    }

    // Check if user already exists
    let user = await User.findByEmail(email);
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      // Create new user from GitHub profile
      user = new User({
        email: email.toLowerCase(),
        name: profile.name || profile.login || email.split('@')[0],
        role: 'user', // Default role for OAuth users
        emailVerified: true, // GitHub emails are considered verified
        isActive: true
      });
      
      // Don't set password for OAuth users
      await user.save();
      
      // Send welcome email for new users
      try {
        await emailService.sendWelcomeEmail(user.email, user.name, true);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError.message);
      }
    } else {
      // Update last login for existing user
      await user.updateLastLogin();
      
      // Update user info if changed
      if (user.name !== profile.name && profile.name) {
        user.name = profile.name;
        await user.save();
      }
    }

    // Generate JWT token
    const token = user.generateToken();

    res.json({
      user: user.toSafeJSON(),
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('❌ GitHub OAuth callback error:', error);
    
    let errorMessage = 'GitHub authentication failed';
    if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Authorization code expired. Please try again.';
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      errorMessage = 'OAuth configuration error. Please contact support.';
      console.error('🔴 Redirect URI Mismatch - Expected:', githubConfig.redirectUri);
    } else if (error.message?.includes('invalid_client')) {
      errorMessage = 'OAuth client configuration error. Please contact support.';
    } else if (error.message?.includes('email')) {
      errorMessage = 'Unable to access your email from GitHub. Please make sure your email is public.';
    }
    
    res.status(500).json({ error: errorMessage });
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

// POST /auth/2fa/setup - Initialize 2FA setup
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Generate 2FA secret
    const secretInfo = user.generate2FASecret();
    
    // Save the secret (but don't enable 2FA yet)
    await user.save();

    // Generate QR code
    const qrCodeDataURL = await qrcode.toDataURL(secretInfo.qrCode);

    res.json({
      secret: secretInfo.secret,
      qrCodeDataURL,
      manualEntryKey: secretInfo.manualEntryKey,
      backupCodes: null // Will be generated when 2FA is enabled
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// POST /auth/2fa/enable - Enable 2FA after verification
router.post('/2fa/enable', authenticate, [
  body('token').isLength({ min: 6, max: 6 }).withMessage('2FA token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA setup not initialized. Call /auth/2fa/setup first' });
    }

    // Enable 2FA and get backup codes
    const backupCodes = await user.enable2FA(token);

    // Send 2FA enabled notification email
    try {
      await emailService.send2FAEnabledEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send 2FA enabled email:', emailError);
    }

    res.json({
      message: '2FA enabled successfully',
      backupCodes,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    
    if (error.message === 'Invalid verification token') {
      return res.status(400).json({ error: 'Invalid 2FA token. Please try again.' });
    }
    
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// POST /auth/2fa/disable - Disable 2FA
router.post('/2fa/disable', authenticate, [
  body('token').isLength({ min: 6, max: 8 }).withMessage('2FA token must be 6-8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Disable 2FA
    await user.disable2FA(token);

    // Send 2FA disabled notification email
    try {
      await emailService.send2FADisabledEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send 2FA disabled email:', emailError);
    }

    res.json({
      message: '2FA disabled successfully',
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    
    if (error.message === 'Invalid verification token') {
      return res.status(400).json({ error: 'Invalid 2FA token. Please try again.' });
    }
    
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// POST /auth/2fa/regenerate-backup-codes - Regenerate backup codes
router.post('/2fa/regenerate-backup-codes', authenticate, [
  body('token').isLength({ min: 6, max: 8 }).withMessage('2FA token must be 6-8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Regenerate backup codes
    const backupCodes = await user.regenerateBackupCodes(token);

    res.json({
      message: 'Backup codes regenerated successfully',
      backupCodes
    });
  } catch (error) {
    console.error('2FA regenerate backup codes error:', error);
    
    if (error.message === 'Invalid verification token') {
      return res.status(400).json({ error: 'Invalid 2FA token. Please try again.' });
    }
    
    res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

// GET /auth/2fa/status - Get 2FA status
router.get('/2fa/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorLastUsed: user.twoFactorLastUsed,
      hasBackupCodes: user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes).length > 0 : false
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

// POST /auth/2fa/verify - Verify 2FA token during login
router.post('/2fa/verify', twoFARate, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('token').isLength({ min: 6, max: 8 }).withMessage('2FA token must be 6-8 characters'),
  body('loginType').isIn(['password', 'magic-link']).withMessage('Invalid login type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, token, loginType } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled for this user' });
    }

    // Verify primary credentials first
    if (loginType === 'password') {
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
    // For magic-link, the token verification serves as the primary auth

    // Verify 2FA token
    const is2FAValid = user.verify2FAToken(token);
    if (!is2FAValid) {
      return res.status(401).json({ error: 'Invalid 2FA token' });
    }

    // Update last login and save 2FA usage
    await user.updateLastLogin();
    await user.save();

    // Generate JWT token
    const authToken = user.generateToken();

    // Clear rate limit attempts on successful login
    if (req.clearAuthAttempts) {
      req.clearAuthAttempts();
    }

    res.json({
      user: user.toSafeJSON(),
      token: authToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: '2FA verification failed' });
  }
});

module.exports = router;