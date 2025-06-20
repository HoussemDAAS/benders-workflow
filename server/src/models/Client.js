const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class Client {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.company = data.company;
    this.email = data.email;
    this.phone = data.phone;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findAll(includeInactive = false) {
    const db = getDatabase();
    const sql = includeInactive 
      ? 'SELECT * FROM clients ORDER BY created_at DESC'
      : 'SELECT * FROM clients WHERE is_active = 1 ORDER BY created_at DESC';
    
    const rows = await db.all(sql);
    return rows.map(row => Client.fromDatabase(row));
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM clients WHERE id = ?', [id]);
    return row ? Client.fromDatabase(row) : null;
  }

  static async findByEmail(email) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM clients WHERE email = ?', [email]);
    return row ? Client.fromDatabase(row) : null;
  }

  async save(performedBy = null) {
    const db = getDatabase();
    const isNew = !(await Client.findById(this.id));
    
    if (isNew) {
      await db.run(`
        INSERT INTO clients (id, name, company, email, phone, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, this.name, this.company, this.email, this.phone,
        this.isActive, this.createdAt.toISOString(), this.updatedAt.toISOString()
      ]);

      // Auto-create default workflow for new client
      await this.createDefaultWorkflow();

      // Log activity
      await ActivityLogger.log('client', this.id, 'created', performedBy, {
        name: this.name,
        company: this.company,
        email: this.email
      });
    } else {
      this.updatedAt = new Date();
      await db.run(`
        UPDATE clients 
        SET name = ?, company = ?, email = ?, phone = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.name, this.company, this.email, this.phone,
        this.isActive, this.updatedAt.toISOString(), this.id
      ]);

      // Log activity
      await ActivityLogger.log('client', this.id, 'updated', performedBy, {
        name: this.name,
        company: this.company,
        email: this.email
      });
    }

    return this;
  }

  async delete(performedBy = null) {
    const db = getDatabase();
    await db.run('DELETE FROM clients WHERE id = ?', [this.id]);
    
    // Log activity
    await ActivityLogger.log('client', this.id, 'deleted', performedBy, {
      name: this.name,
      company: this.company
    });
  }

  async createDefaultWorkflow() {
    const Workflow = require('./Workflow');
    
    // Create a default workflow template for the client
    const defaultWorkflow = new Workflow({
      name: `${this.name} - Default Workflow`,
      description: `Auto-generated workflow for ${this.name} based on kanban board`,
      clientId: this.id,
      status: 'active',
      startDate: new Date(),
      expectedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await defaultWorkflow.save();

    // Create default workflow steps
    const WorkflowStep = require('./WorkflowStep');
    
    const steps = [
      {
        name: 'Project Initiation',
        description: 'Initial project setup and planning',
        type: 'start-end',
        position: { x: 100, y: 100 }
      },
      {
        name: 'Requirements Gathering',
        description: 'Collect and document project requirements',
        type: 'process',
        position: { x: 100, y: 200 }
      },
      {
        name: 'Planning & Design',
        description: 'Create project plan and design documents',
        type: 'process',
        position: { x: 100, y: 300 }
      },
      {
        name: 'Implementation',
        description: 'Execute the project deliverables',
        type: 'process',
        position: { x: 100, y: 400 }
      },
      {
        name: 'Quality Review',
        description: 'Review and test deliverables',
        type: 'decision',
        position: { x: 100, y: 500 }
      },
      {
        name: 'Project Completion',
        description: 'Finalize and deliver project',
        type: 'start-end',
        position: { x: 100, y: 600 }
      }
    ];

    let previousStepId = null;
    for (const stepData of steps) {
      const step = new WorkflowStep({
        workflowId: defaultWorkflow.id,
        name: stepData.name,
        description: stepData.description,
        type: stepData.type,
        positionX: stepData.position.x,
        positionY: stepData.position.y
      });

      await step.save();

      // Create connection from previous step
      if (previousStepId) {
        await defaultWorkflow.addConnection(previousStepId, step.id);
      }

      previousStepId = step.id;
    }

    return defaultWorkflow;
  }

  async getWorkflows() {
    const Workflow = require('./Workflow');
    return await Workflow.findByClientId(this.id);
  }

  async getMeetings() {
    const Meeting = require('./Meeting');
    return await Meeting.findByClientId(this.id);
  }

  async getTasks() {
    const db = getDatabase();
    const sql = `
      SELECT kt.* FROM kanban_tasks kt
      JOIN workflows w ON kt.workflow_id = w.id
      WHERE w.client_id = ?
      ORDER BY kt.created_at DESC
    `;
    return await db.all(sql, [this.id]);
  }

  static fromDatabase(row) {
    return new Client({
      id: row.id,
      name: row.name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      company: this.company,
      email: this.email,
      phone: this.phone,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Client; 