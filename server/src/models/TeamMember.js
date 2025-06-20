const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class TeamMember {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.skills = data.skills || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findAll(includeInactive = false) {
    const db = getDatabase();
    const sql = includeInactive 
      ? 'SELECT * FROM team_members ORDER BY name ASC'
      : 'SELECT * FROM team_members WHERE is_active = 1 ORDER BY name ASC';
    
    const rows = await db.all(sql);
    return rows.map(row => TeamMember.fromDatabase(row));
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM team_members WHERE id = ?', [id]);
    return row ? TeamMember.fromDatabase(row) : null;
  }

  static async findByEmail(email) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM team_members WHERE email = ?', [email]);
    return row ? TeamMember.fromDatabase(row) : null;
  }

  static async findByRole(role) {
    const db = getDatabase();
    const rows = await db.all('SELECT * FROM team_members WHERE role = ? AND is_active = 1 ORDER BY name', [role]);
    return rows.map(row => TeamMember.fromDatabase(row));
  }

  async save(performedBy = null) {
    const db = getDatabase();
    const isNew = !(await TeamMember.findById(this.id));
    
    const skillsJson = JSON.stringify(this.skills);
    
    if (isNew) {
      await db.run(`
        INSERT INTO team_members (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, this.name, this.email, this.role, skillsJson,
        this.isActive, this.createdAt.toISOString(), this.updatedAt.toISOString()
      ]);

      await ActivityLogger.log('team_member', this.id, 'created', performedBy, {
        name: this.name,
        email: this.email,
        role: this.role
      });
    } else {
      this.updatedAt = new Date();
      await db.run(`
        UPDATE team_members 
        SET name = ?, email = ?, role = ?, skills = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.name, this.email, this.role, skillsJson,
        this.isActive, this.updatedAt.toISOString(), this.id
      ]);

      await ActivityLogger.log('team_member', this.id, 'updated', performedBy, {
        name: this.name,
        role: this.role
      });
    }

    return this;
  }

  async delete(performedBy = null) {
    const db = getDatabase();
    await db.run('DELETE FROM team_members WHERE id = ?', [this.id]);
    
    await ActivityLogger.log('team_member', this.id, 'deleted', performedBy, {
      name: this.name,
      role: this.role
    });
  }

  async getAssignedSteps() {
    const db = getDatabase();
    return await db.all(`
      SELECT ws.*, w.name as workflow_name, c.name as client_name
      FROM workflow_steps ws
      JOIN step_assignments sa ON ws.id = sa.step_id
      JOIN workflows w ON ws.workflow_id = w.id
      JOIN clients c ON w.client_id = c.id
      WHERE sa.member_id = ?
      ORDER BY ws.created_at DESC
    `, [this.id]);
  }

  async getAssignedTasks() {
    const db = getDatabase();
    return await db.all(`
      SELECT kt.*, w.name as workflow_name, c.name as client_name
      FROM kanban_tasks kt
      JOIN task_assignments ta ON kt.id = ta.task_id
      LEFT JOIN workflows w ON kt.workflow_id = w.id
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE ta.member_id = ?
      ORDER BY kt.created_at DESC
    `, [this.id]);
  }

  async getMeetings() {
    const db = getDatabase();
    return await db.all(`
      SELECT cm.*, ma.attendance_status, c.name as client_name
      FROM client_meetings cm
      JOIN meeting_attendees ma ON cm.id = ma.meeting_id
      JOIN clients c ON cm.client_id = c.id
      WHERE ma.member_id = ?
      ORDER BY cm.meeting_date ASC
    `, [this.id]);
  }

  async getWorkload() {
    const [assignedSteps, assignedTasks] = await Promise.all([
      this.getAssignedSteps(),
      this.getAssignedTasks()
    ]);

    const activeSteps = assignedSteps.filter(step => step.status !== 'completed');
    const activeTasks = assignedTasks.filter(task => task.status !== 'done');

    return {
      totalSteps: assignedSteps.length,
      activeSteps: activeSteps.length,
      totalTasks: assignedTasks.length,
      activeTasks: activeTasks.length,
      overallLoad: activeSteps.length + activeTasks.length
    };
  }

  static fromDatabase(row) {
    return new TeamMember({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      skills: JSON.parse(row.skills || '[]'),
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      skills: this.skills,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TeamMember; 