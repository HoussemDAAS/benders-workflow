const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

  // Generate JWT token
  generateToken() {
    const payload = {
      id: this.id,
      email: this.email,
      role: this.role,
      name: this.name
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
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
        INSERT INTO users (id, email, password, name, role, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, 
        this.email.toLowerCase(), 
        this.password || null, // Allow null for OAuth users
        this.name, 
        this.role,
        this.isActive, 
        this.emailVerified, 
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
            email_verified = ?, last_login_at = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.email.toLowerCase(), 
        this.password || null, // Allow null for OAuth users
        this.name, 
        this.role, 
        this.isActive,
        this.emailVerified, 
        this.lastLoginAt?.toISOString(), 
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
      updatedAt: new Date(row.updated_at)
    });
  }

  // Convert to JSON (exclude password)
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
      updatedAt: this.updatedAt
    };
  }

  // Convert to safe JSON for public use
  toSafeJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      emailVerified: this.emailVerified
    };
  }
}

module.exports = User;