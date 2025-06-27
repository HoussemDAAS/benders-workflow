const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class Workspace {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.ownerId = data.ownerId; // User who created the workspace
    this.inviteCode = data.inviteCode || this.generateInviteCode();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Generate a random invite code
  generateInviteCode() {
    // Generate 6 random alphanumeric characters
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Regenerate invite code
  async regenerateInviteCode(performedBy = null) {
    this.inviteCode = this.generateInviteCode();
    this.updatedAt = new Date();
    await this.save();

    await ActivityLogger.log('workspace', this.id, 'invite_code_regenerated', null, {
      newInviteCode: this.inviteCode,
      performedBy
    });

    return this.inviteCode;
  }

  // Find workspace by ID
  static async findById(id) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM workspaces WHERE id = ? AND is_active = 1', [id]);
    return row ? Workspace.fromDatabase(row) : null;
  }

  // Find workspace by invite code
  static async findByInviteCode(inviteCode) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM workspaces WHERE invite_code = ? AND is_active = 1', [inviteCode.toUpperCase()]);
    return row ? Workspace.fromDatabase(row) : null;
  }

  // Find all workspaces
  static async findAll(includeInactive = false) {
    const db = getDatabase();
    const sql = includeInactive 
      ? 'SELECT * FROM workspaces ORDER BY created_at DESC'
      : 'SELECT * FROM workspaces WHERE is_active = 1 ORDER BY created_at DESC';
    
    const rows = await db.all(sql);
    return rows.map(row => Workspace.fromDatabase(row));
  }

  // Find workspaces for a user
  static async findForUser(userId) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT w.* FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = ? AND w.is_active = 1
      ORDER BY w.created_at DESC
    `, [userId]);
    
    return rows.map(row => Workspace.fromDatabase(row));
  }

  // Get members of this workspace
  async getMembers() {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT u.id, u.email, u.name, u.role as user_role, wm.role as workspace_role, wm.joined_at
      FROM users u
      JOIN workspace_members wm ON u.id = wm.user_id
      WHERE wm.workspace_id = ? AND u.is_active = 1
      ORDER BY wm.joined_at DESC
    `, [this.id]);
    
    return rows;
  }

  // Add member to workspace
  async addMember(userId, role = 'member', performedBy = null) {
    const db = getDatabase();
    
    // Check if already a member
    const existing = await db.get(`
      SELECT * FROM workspace_members 
      WHERE user_id = ? AND workspace_id = ?
    `, [userId, this.id]);

    if (existing) {
      if (existing.added_by !== null) {
        throw new Error('User is already a member of this workspace');
      } else {
        // Update existing membership
        await db.run(`
          UPDATE workspace_members 
          SET role = ?, joined_at = CURRENT_TIMESTAMP, added_by = ?
          WHERE user_id = ? AND workspace_id = ?
        `, [role, performedBy, userId, this.id]);
      }
    } else {
      // Add new membership
      await db.run(`
        INSERT INTO workspace_members (id, user_id, workspace_id, role, joined_at, added_by)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `, [uuidv4(), userId, this.id, role, performedBy]);
    }

    // ActivityLogger expects team_member_id, but workspace operations use user_id
    // For now, skip activity logging for workspace operations to avoid foreign key constraints
    // TODO: Create workspace-specific activity logging that doesn't depend on team_members table
  }

  // Remove member from workspace
  async removeMember(userId, performedBy = null) {
    const db = getDatabase();
    
    await db.run(`
      DELETE FROM workspace_members 
      WHERE user_id = ? AND workspace_id = ?
    `, [userId, this.id]);

    // Skip activity logging for workspace operations (see above TODO)
  }

  // Update member role
  async updateMemberRole(userId, newRole, performedBy = null) {
    const db = getDatabase();
    
    await db.run(`
      UPDATE workspace_members 
      SET role = ?
      WHERE user_id = ? AND workspace_id = ?
    `, [newRole, userId, this.id]);

    // Skip activity logging for workspace operations (see above TODO)
  }

  // Check if user is member of workspace
  static async isUserMember(userId, workspaceId) {
    const db = getDatabase();
    const row = await db.get(`
      SELECT * FROM workspace_members 
      WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);
    
    return !!row;
  }

  // Get user's role in workspace
  static async getUserRole(userId, workspaceId) {
    const db = getDatabase();
    const row = await db.get(`
      SELECT role FROM workspace_members 
      WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);
    
    return row ? row.role : null;
  }

  // Save workspace
  async save() {
    const db = getDatabase();
    const isNew = !(await Workspace.findById(this.id));
    
    if (isNew) {
      // Ensure unique invite code
      let attempts = 0;
      while (attempts < 10) {
        try {
          await db.run(`
            INSERT INTO workspaces (id, name, description, owner_id, invite_code, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            this.id, 
            this.name, 
            this.description, 
            this.ownerId,
            this.inviteCode,
            this.isActive, 
            this.createdAt.toISOString(), 
            this.updatedAt.toISOString()
          ]);
          break; // Success, exit loop
        } catch (error) {
          if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('invite_code')) {
            // Generate new invite code and retry
            this.inviteCode = this.generateInviteCode();
            attempts++;
          } else {
            throw error; // Re-throw if it's not an invite code constraint
          }
        }
      }

      if (attempts >= 10) {
        throw new Error('Failed to generate unique invite code after 10 attempts');
      }

      // Add owner as admin
      await this.addMember(this.ownerId, 'admin', this.ownerId);

      // Skip activity logging for workspace operations (see above TODO)
    } else {
      this.updatedAt = new Date();
      
      await db.run(`
        UPDATE workspaces 
        SET name = ?, description = ?, invite_code = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.name, 
        this.description, 
        this.inviteCode,
        this.isActive,
        this.updatedAt.toISOString(), 
        this.id
      ]);

      // Skip activity logging for workspace operations (see above TODO)
    }

    return this;
  }

  // Deactivate workspace (soft delete)
  async deactivate(performedBy = null) {
    const db = getDatabase();
    this.isActive = false;
    this.updatedAt = new Date();
    
    await db.run('UPDATE workspaces SET is_active = 0, updated_at = ? WHERE id = ?', [
      this.updatedAt.toISOString(), this.id
    ]);
    
    // Skip activity logging for workspace operations (see above TODO)
  }

  // Create database row from result
  static fromDatabase(row) {
    return new Workspace({
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      inviteCode: row.invite_code,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      ownerId: this.ownerId,
      inviteCode: this.inviteCode,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Workspace;