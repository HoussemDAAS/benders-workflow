const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class KanbanTask {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.description = data.description;
    this.workflowId = data.workflowId;
    this.stepId = data.stepId;
    this.priority = data.priority || 'medium';
    this.status = data.status;
    this.tags = data.tags || [];
    this.dueDate = data.dueDate;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findAll() {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT kt.*, w.name as workflow_name, c.name as client_name, c.company as client_company
      FROM kanban_tasks kt
      LEFT JOIN workflows w ON kt.workflow_id = w.id
      LEFT JOIN clients c ON w.client_id = c.id
      ORDER BY kt.created_at DESC
    `);
    return rows.map(row => KanbanTask.fromDatabase(row));
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get(`
      SELECT kt.*, w.name as workflow_name, c.name as client_name, c.company as client_company
      FROM kanban_tasks kt
      LEFT JOIN workflows w ON kt.workflow_id = w.id
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE kt.id = ?
    `, [id]);
    return row ? KanbanTask.fromDatabase(row) : null;
  }

  static async findByStatus(status) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT kt.*, w.name as workflow_name, c.name as client_name, c.company as client_company
      FROM kanban_tasks kt
      LEFT JOIN workflows w ON kt.workflow_id = w.id
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE kt.status = ?
      ORDER BY kt.created_at DESC
    `, [status]);
    return rows.map(row => KanbanTask.fromDatabase(row));
  }

  static async findByWorkflowId(workflowId) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT kt.*, w.name as workflow_name, c.name as client_name, c.company as client_company
      FROM kanban_tasks kt
      LEFT JOIN workflows w ON kt.workflow_id = w.id
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE kt.workflow_id = ?
      ORDER BY kt.created_at DESC
    `, [workflowId]);
    return rows.map(row => KanbanTask.fromDatabase(row));
  }

  static async findOverdue() {
    const db = getDatabase();
    const now = new Date().toISOString();
    const rows = await db.all(`
      SELECT kt.*, w.name as workflow_name, c.name as client_name, c.company as client_company
      FROM kanban_tasks kt
      LEFT JOIN workflows w ON kt.workflow_id = w.id
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE kt.due_date < ? AND kt.status != 'done'
      ORDER BY kt.due_date ASC
    `, [now]);
    return rows.map(row => KanbanTask.fromDatabase(row));
  }

  async save(performedBy = null) {
    const db = getDatabase();
    const isNew = !(await KanbanTask.findById(this.id));
    
    const tagsJson = JSON.stringify(this.tags);
    
    if (isNew) {
      await db.run(`
        INSERT INTO kanban_tasks (
          id, title, description, workflow_id, step_id, priority, status,
          tags, due_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, this.title, this.description, this.workflowId, this.stepId,
        this.priority, this.status, tagsJson, 
        this.dueDate?.toISOString(), this.createdAt.toISOString(), this.updatedAt.toISOString()
      ]);

      await ActivityLogger.log('kanban_task', this.id, 'created', performedBy, {
        title: this.title,
        workflowId: this.workflowId,
        status: this.status
      });
    } else {
      this.updatedAt = new Date();
      await db.run(`
        UPDATE kanban_tasks 
        SET title = ?, description = ?, workflow_id = ?, step_id = ?, priority = ?,
            status = ?, tags = ?, due_date = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.title, this.description, this.workflowId, this.stepId, this.priority,
        this.status, tagsJson, this.dueDate?.toISOString(), this.updatedAt.toISOString(), this.id
      ]);

      await ActivityLogger.log('kanban_task', this.id, 'updated', performedBy, {
        title: this.title,
        status: this.status
      });
    }

    return this;
  }

  async delete(performedBy = null) {
    const db = getDatabase();
    await db.run('DELETE FROM kanban_tasks WHERE id = ?', [this.id]);
    
    await ActivityLogger.log('kanban_task', this.id, 'deleted', performedBy, {
      title: this.title
    });
  }

  async assignMember(memberId) {
    const db = getDatabase();
    const assignmentId = uuidv4();
    
    await db.run(`
      INSERT OR IGNORE INTO task_assignments (id, task_id, member_id, created_at)
      VALUES (?, ?, ?, ?)
    `, [assignmentId, this.id, memberId, new Date().toISOString()]);
    
    return assignmentId;
  }

  async unassignMember(memberId) {
    const db = getDatabase();
    await db.run('DELETE FROM task_assignments WHERE task_id = ? AND member_id = ?', [this.id, memberId]);
  }

  async getAssignedMembers() {
    const db = getDatabase();
    return await db.all(`
      SELECT tm.*, ta.created_at as assigned_at
      FROM team_members tm
      JOIN task_assignments ta ON tm.id = ta.member_id
      WHERE ta.task_id = ?
      ORDER BY tm.name
    `, [this.id]);
  }

  async moveToStatus(newStatus, performedBy = null) {
    const oldStatus = this.status;
    this.status = newStatus;
    await this.save(performedBy);

    await ActivityLogger.log('kanban_task', this.id, 'moved', performedBy, {
      title: this.title,
      fromStatus: oldStatus,
      toStatus: newStatus
    });
  }

  isOverdue() {
    return this.dueDate && new Date() > this.dueDate && this.status !== 'done';
  }

  static fromDatabase(row) {
    const task = new KanbanTask({
      id: row.id,
      title: row.title,
      description: row.description,
      workflowId: row.workflow_id,
      stepId: row.step_id,
      priority: row.priority,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      dueDate: row.due_date ? new Date(row.due_date) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });

    // Add workflow and client information if available
    if (row.workflow_name) {
      task.workflow = {
        name: row.workflow_name
      };
    }
    if (row.client_name) {
      task.client = {
        name: row.client_name,
        company: row.client_company
      };
    }

    return task;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      workflowId: this.workflowId,
      stepId: this.stepId,
      priority: this.priority,
      status: this.status,
      tags: this.tags,
      dueDate: this.dueDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      workflow: this.workflow,
      client: this.client
    };
  }
}

module.exports = KanbanTask; 