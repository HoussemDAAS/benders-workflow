const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class User {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.password = data.password; // Will be hashed
    this.name = data.name;
    this.role = data.role || 'user'; // 'admin', 'manager', 'user'
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.emailVerified = data.emailVerified !== undefined ? data.emailVerified : false;
    this.lastLoginAt = data.lastLoginAt;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    
    // 2FA fields
    this.twoFactorEnabled = data.twoFactorEnabled !== undefined ? data.twoFactorEnabled : false;
    this.twoFactorSecret = data.twoFactorSecret;
    this.twoFactorBackupCodes = data.twoFactorBackupCodes;
    this.twoFactorLastUsed = data.twoFactorLastUsed;
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  // Verify password
  async verifyPassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  }

  // Generate JWT token with optional expiration
  generateToken(expiresIn = null) {
    const payload = {
      id: this.id,
      email: this.email,
      role: this.role,
      name: this.name
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-key', {
      expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '15m' // Shorter access token
    });
  }

  // Generate refresh token (longer expiration)
  generateRefreshToken() {
    const payload = {
      id: this.id,
      email: this.email,
      type: 'refresh',
      tokenId: uuidv4() // Unique token ID for tracking
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret', {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret');
      return decoded.type === 'refresh' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  // Generate token pair (access + refresh)
  generateTokenPair(rememberMe = false) {
    const accessTokenExpiration = '15m'; // Short-lived access token
    const refreshTokenExpiration = rememberMe ? '30d' : '7d'; // Longer refresh token
    
    const accessToken = this.generateToken(accessTokenExpiration);
    const refreshToken = jwt.sign(
      {
        id: this.id,
        email: this.email,
        type: 'refresh',
        tokenId: uuidv4()
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret',
      { expiresIn: refreshTokenExpiration }
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      refreshTokenExpires: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
    };
  }

  // Generate magic link token
  generateMagicLinkToken() {
    const payload = {
      id: this.id,
      email: this.email,
      type: 'magic-link'
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-key', {
      expiresIn: '15m' // Magic links expire in 15 minutes
    });
  }

  // Generate password reset token
  generatePasswordResetToken() {
    const payload = {
      id: this.id,
      email: this.email,
      type: 'password-reset'
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-key', {
      expiresIn: '1h' // Password reset tokens expire in 1 hour
    });
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    } catch (error) {
      return null;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email.toLowerCase()]);
    return row ? User.fromDatabase(row) : null;
  }

  // Find user by ID
  static async findById(id) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]);
    return row ? User.fromDatabase(row) : null;
  }

  // Find all users
  static async findAll(includeInactive = false) {
    const db = getDatabase();
    const sql = includeInactive 
      ? 'SELECT * FROM users ORDER BY created_at DESC'
      : 'SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC';
    
    const rows = await db.all(sql);
    return rows.map(row => User.fromDatabase(row));
  }

  // Generate 2FA secret and return setup info
  generate2FASecret() {
    const secret = speakeasy.generateSecret({
      name: `Benders Workflow (${this.email})`,
      issuer: 'Benders Workflow',
      length: 32
    });
    
    this.twoFactorSecret = secret.base32;
    
    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      manualEntryKey: secret.base32
    };
  }

  // Verify 2FA token
  verify2FAToken(token, allowBackupCode = true) {
    // During setup, we only need the secret to exist, not for 2FA to be enabled
    if (!this.twoFactorSecret) {
      return false;
    }

    // Only check if 2FA is enabled when we're not in setup mode
    // (setup mode is when twoFactorEnabled is false but secret exists)
    const isSetupMode = !this.twoFactorEnabled && this.twoFactorSecret;
    
    if (!isSetupMode && !this.twoFactorEnabled) {
      return false;
    }

    // Check TOTP token first with larger window for better compatibility
    const verified = speakeasy.totp.verify({
      secret: this.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 4 // Allow 2 minutes of variance for better compatibility
    });

    if (verified) {
      this.twoFactorLastUsed = new Date();
      return true;
    }

    // Check backup codes if TOTP fails and backup codes are allowed (only if not in setup mode)
    if (!isSetupMode && allowBackupCode && this.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(this.twoFactorBackupCodes);
      const codeIndex = backupCodes.indexOf(token);
      
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        this.twoFactorBackupCodes = JSON.stringify(backupCodes);
        this.twoFactorLastUsed = new Date();
        return true;
      }
    }

    return false;
  }

  // Enable 2FA
  async enable2FA(verificationToken) {
    if (!this.twoFactorSecret) {
      throw new Error('2FA secret not generated');
    }

    if (!this.verify2FAToken(verificationToken, false)) {
      throw new Error('Invalid verification token');
    }

    this.twoFactorEnabled = true;
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(this.generateBackupCode());
    }
    this.twoFactorBackupCodes = JSON.stringify(backupCodes);

    await this.save();
    
    await ActivityLogger.log('user', this.id, '2fa_enabled', this.id, {
      email: this.email
    });

    return backupCodes;
  }

  // Disable 2FA
  async disable2FA(verificationToken) {
    if (!this.twoFactorEnabled) {
      throw new Error('2FA is not enabled');
    }

    if (!this.verify2FAToken(verificationToken)) {
      throw new Error('Invalid verification token');
    }

    this.twoFactorEnabled = false;
    this.twoFactorSecret = null;
    this.twoFactorBackupCodes = null;
    this.twoFactorLastUsed = null;

    await this.save();
    
    await ActivityLogger.log('user', this.id, '2fa_disabled', this.id, {
      email: this.email
    });
  }

  // Generate backup code
  generateBackupCode() {
    const chars = '0123456789'; // Only numbers, no letters
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate backup codes
  async regenerateBackupCodes(verificationToken) {
    if (!this.twoFactorEnabled) {
      throw new Error('2FA is not enabled');
    }

    if (!this.verify2FAToken(verificationToken)) {
      throw new Error('Invalid verification token');
    }

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(this.generateBackupCode());
    }
    this.twoFactorBackupCodes = JSON.stringify(backupCodes);

    await this.save();
    
    await ActivityLogger.log('user', this.id, '2fa_backup_codes_regenerated', this.id, {
      email: this.email
    });

    return backupCodes;
  }

  // Save user
  async save() {
    const db = getDatabase();
    const isNew = !(await User.findById(this.id));
    
    if (isNew) {
      // Hash password for new users (only if password exists)
      if (this.password) {
        await this.hashPassword();
      }

      await db.run(`
        INSERT INTO users (
          id, email, password, name, role, is_active, email_verified, 
          two_factor_enabled, two_factor_secret, two_factor_backup_codes, two_factor_last_used,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, 
        this.email.toLowerCase(), 
        this.password || null,
        this.name, 
        this.role,
        this.isActive, 
        this.emailVerified,
        this.twoFactorEnabled,
        this.twoFactorSecret,
        this.twoFactorBackupCodes,
        this.twoFactorLastUsed?.toISOString(),
        this.createdAt.toISOString(), 
        this.updatedAt.toISOString()
      ]);

      await ActivityLogger.log('user', this.id, 'created', null, {
        email: this.email,
        name: this.name,
        role: this.role
      });
    } else {
      this.updatedAt = new Date();
      
      // Only hash password if it's being changed
      const existingUser = await User.findById(this.id);
      if (this.password && this.password !== existingUser.password) {
        await this.hashPassword();
      }

      await db.run(`
        UPDATE users 
        SET email = ?, password = ?, name = ?, role = ?, is_active = ?, 
            email_verified = ?, last_login_at = ?,
            two_factor_enabled = ?, two_factor_secret = ?, two_factor_backup_codes = ?, 
            two_factor_last_used = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.email.toLowerCase(), 
        this.password || null,
        this.name, 
        this.role, 
        this.isActive,
        this.emailVerified, 
        this.lastLoginAt?.toISOString(),
        this.twoFactorEnabled,
        this.twoFactorSecret,
        this.twoFactorBackupCodes,
        this.twoFactorLastUsed?.toISOString(),
        this.updatedAt.toISOString(), 
        this.id
      ]);

      await ActivityLogger.log('user', this.id, 'updated', this.id, {
        email: this.email,
        name: this.name,
        role: this.role
      });
    }

    return this;
  }

  // Update last login
  async updateLastLogin() {
    const db = getDatabase();
    this.lastLoginAt = new Date();
    
    await db.run('UPDATE users SET last_login_at = ? WHERE id = ?', [
      this.lastLoginAt.toISOString(), this.id
    ]);
  }

  // Deactivate user (soft delete)
  async deactivate(performedBy = null) {
    const db = getDatabase();
    this.isActive = false;
    this.updatedAt = new Date();
    
    await db.run('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?', [
      this.updatedAt.toISOString(), this.id
    ]);
    
    await ActivityLogger.log('user', this.id, 'deactivated', performedBy, {
      email: this.email,
      name: this.name
    });
  }

  // Update password (for password reset)
  static async updatePassword(userId, hashedPassword) {
    const db = getDatabase();
    const updatedAt = new Date().toISOString();
    
    await db.run(
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [hashedPassword, updatedAt, userId]
    );
    
    await ActivityLogger.log('user', userId, 'password_reset', null, {
      timestamp: updatedAt
    });
  }

  // Create database row from result
  static fromDatabase(row) {
    return new User({
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      isActive: Boolean(row.is_active),
      emailVerified: Boolean(row.email_verified),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      twoFactorEnabled: Boolean(row.two_factor_enabled),
      twoFactorSecret: row.two_factor_secret,
      twoFactorBackupCodes: row.two_factor_backup_codes,
      twoFactorLastUsed: row.two_factor_last_used ? new Date(row.two_factor_last_used) : null
    });
  }

  // Convert to JSON (exclude password and 2FA secret)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      twoFactorEnabled: this.twoFactorEnabled,
      twoFactorLastUsed: this.twoFactorLastUsed
    };
  }

  // Convert to safe JSON for public use
  toSafeJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      emailVerified: this.emailVerified,
      twoFactorEnabled: this.twoFactorEnabled
    };
  }
}

module.exports = User;