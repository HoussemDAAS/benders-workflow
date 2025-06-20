const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class Workflow {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.clientId = data.clientId;
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.startDate = data.startDate;
    this.expectedEndDate = data.expectedEndDate;
    this.actualEndDate = data.actualEndDate;
  }

  static async findAll() {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT w.*, c.name as client_name, c.company as client_company
      FROM workflows w
      LEFT JOIN clients c ON w.client_id = c.id
      ORDER BY w.created_at DESC
    `);
    return rows.map(row => Workflow.fromDatabase(row));
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get(`
      SELECT w.*, c.name as client_name, c.company as client_company
      FROM workflows w
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE w.id = ?
    `, [id]);
    return row ? Workflow.fromDatabase(row) : null;
  }

  static async findByClientId(clientId) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT w.*, c.name as client_name, c.company as client_company
      FROM workflows w
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE w.client_id = ?
      ORDER BY w.created_at DESC
    `, [clientId]);
    return rows.map(row => Workflow.fromDatabase(row));
  }

  static async findByStatus(status) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT w.*, c.name as client_name, c.company as client_company
      FROM workflows w
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE w.status = ?
      ORDER BY w.created_at DESC
    `, [status]);
    return rows.map(row => Workflow.fromDatabase(row));
  }

  async save(performedBy = null) {
    const db = getDatabase();
    const isNew = !(await Workflow.findById(this.id));
    
    if (isNew) {
      await db.run(`
        INSERT INTO workflows (id, name, description, client_id, status, created_at, updated_at, start_date, expected_end_date, actual_end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, this.name, this.description, this.clientId, this.status,
        this.createdAt.toISOString(), this.updatedAt.toISOString(),
        this.startDate?.toISOString(), this.expectedEndDate?.toISOString(), this.actualEndDate?.toISOString()
      ]);

      await ActivityLogger.log('workflow', this.id, 'created', performedBy, {
        name: this.name,
        clientId: this.clientId,
        status: this.status
      });
    } else {
      this.updatedAt = new Date();
      await db.run(`
        UPDATE workflows 
        SET name = ?, description = ?, client_id = ?, status = ?, updated_at = ?, 
            start_date = ?, expected_end_date = ?, actual_end_date = ?
        WHERE id = ?
      `, [
        this.name, this.description, this.clientId, this.status, this.updatedAt.toISOString(),
        this.startDate?.toISOString(), this.expectedEndDate?.toISOString(), this.actualEndDate?.toISOString(),
        this.id
      ]);

      await ActivityLogger.log('workflow', this.id, 'updated', performedBy, {
        name: this.name,
        status: this.status
      });
    }

    return this;
  }

  async delete(performedBy = null) {
    const db = getDatabase();
    await db.run('DELETE FROM workflows WHERE id = ?', [this.id]);
    
    await ActivityLogger.log('workflow', this.id, 'deleted', performedBy, {
      name: this.name
    });
  }

  async getSteps() {
    const WorkflowStep = require('./WorkflowStep');
    return await WorkflowStep.findByWorkflowId(this.id);
  }

  async getConnections() {
    const db = getDatabase();
    return await db.all(`
      SELECT * FROM workflow_connections 
      WHERE workflow_id = ?
      ORDER BY created_at
    `, [this.id]);
  }

  async addConnection(sourceStepId, targetStepId) {
    const db = getDatabase();
    const connectionId = uuidv4();
    
    await db.run(`
      INSERT INTO workflow_connections (id, workflow_id, source_step_id, target_step_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [connectionId, this.id, sourceStepId, targetStepId, new Date().toISOString()]);
    
    return connectionId;
  }

  async removeConnection(connectionId) {
    const db = getDatabase();
    await db.run('DELETE FROM workflow_connections WHERE id = ?', [connectionId]);
  }

  async getTasks() {
    const db = getDatabase();
    return await db.all(`
      SELECT * FROM kanban_tasks
      WHERE workflow_id = ?
      ORDER BY created_at DESC
    `, [this.id]);
  }

  async getProgress() {
    const steps = await this.getSteps();
    const totalSteps = steps.length;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    
    return {
      totalSteps,
      completedSteps,
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
    };
  }

  static fromDatabase(row) {
    const workflow = new Workflow({
      id: row.id,
      name: row.name,
      description: row.description,
      clientId: row.client_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      startDate: row.start_date ? new Date(row.start_date) : null,
      expectedEndDate: row.expected_end_date ? new Date(row.expected_end_date) : null,
      actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : null
    });

    // Add client information if available
    if (row.client_name) {
      workflow.client = {
        name: row.client_name,
        company: row.client_company
      };
    }

    return workflow;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      clientId: this.clientId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      startDate: this.startDate,
      expectedEndDate: this.expectedEndDate,
      actualEndDate: this.actualEndDate,
      client: this.client
    };
  }
}

module.exports = Workflow; 