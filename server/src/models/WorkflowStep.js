const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class WorkflowStep {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.workflowId = data.workflowId;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.status = data.status || 'pending';
    this.positionX = data.positionX || 0;
    this.positionY = data.positionY || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findByWorkflowId(workflowId) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT * FROM workflow_steps
      WHERE workflow_id = ?
      ORDER BY created_at
    `, [workflowId]);
    return rows.map(row => WorkflowStep.fromDatabase(row));
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM workflow_steps WHERE id = ?', [id]);
    return row ? WorkflowStep.fromDatabase(row) : null;
  }

  async save(performedBy = null) {
    const db = getDatabase();
    const isNew = !(await WorkflowStep.findById(this.id));
    
    if (isNew) {
      await db.run(`
        INSERT INTO workflow_steps (
          id, workflow_id, name, description, type, status,
          position_x, position_y, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, this.workflowId, this.name, this.description, this.type,
        this.status, this.positionX, this.positionY,
        this.createdAt.toISOString(), this.updatedAt.toISOString()
      ]);

      await ActivityLogger.log('workflow_step', this.id, 'created', performedBy, {
        name: this.name,
        workflowId: this.workflowId,
        type: this.type
      });
    } else {
      this.updatedAt = new Date();
      await db.run(`
        UPDATE workflow_steps 
        SET workflow_id = ?, name = ?, description = ?, type = ?, status = ?,
            position_x = ?, position_y = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.workflowId, this.name, this.description, this.type, this.status,
        this.positionX, this.positionY, this.updatedAt.toISOString(), this.id
      ]);

      await ActivityLogger.log('workflow_step', this.id, 'updated', performedBy, {
        name: this.name,
        status: this.status
      });
    }

    return this;
  }

  async delete(performedBy = null) {
    const db = getDatabase();
    await db.run('DELETE FROM workflow_steps WHERE id = ?', [this.id]);
    
    await ActivityLogger.log('workflow_step', this.id, 'deleted', performedBy, {
      name: this.name
    });
  }

  async assignMember(memberId) {
    const db = getDatabase();
    const assignmentId = uuidv4();
    
    await db.run(`
      INSERT OR IGNORE INTO step_assignments (id, step_id, member_id, created_at)
      VALUES (?, ?, ?, ?)
    `, [assignmentId, this.id, memberId, new Date().toISOString()]);
    
    return assignmentId;
  }

  async unassignMember(memberId) {
    const db = getDatabase();
    await db.run('DELETE FROM step_assignments WHERE step_id = ? AND member_id = ?', [this.id, memberId]);
  }

  async getAssignedMembers() {
    const db = getDatabase();
    return await db.all(`
      SELECT tm.*, sa.created_at as assigned_at
      FROM team_members tm
      JOIN step_assignments sa ON tm.id = sa.member_id
      WHERE sa.step_id = ?
      ORDER BY tm.name
    `, [this.id]);
  }

  async addDependency(dependsOnStepId) {
    const db = getDatabase();
    const dependencyId = uuidv4();
    
    await db.run(`
      INSERT OR IGNORE INTO step_dependencies (id, step_id, depends_on_step_id, created_at)
      VALUES (?, ?, ?, ?)
    `, [dependencyId, this.id, dependsOnStepId, new Date().toISOString()]);
    
    return dependencyId;
  }

  async removeDependency(dependsOnStepId) {
    const db = getDatabase();
    await db.run('DELETE FROM step_dependencies WHERE step_id = ? AND depends_on_step_id = ?', [this.id, dependsOnStepId]);
  }

  async getDependencies() {
    const db = getDatabase();
    return await db.all(`
      SELECT ws.*, sd.created_at as dependency_created_at
      FROM workflow_steps ws
      JOIN step_dependencies sd ON ws.id = sd.depends_on_step_id
      WHERE sd.step_id = ?
      ORDER BY ws.name
    `, [this.id]);
  }

  async getDependents() {
    const db = getDatabase();
    return await db.all(`
      SELECT ws.*, sd.created_at as dependency_created_at
      FROM workflow_steps ws
      JOIN step_dependencies sd ON ws.id = sd.step_id
      WHERE sd.depends_on_step_id = ?
      ORDER BY ws.name
    `, [this.id]);
  }

  async canStart() {
    const dependencies = await this.getDependencies();
    return dependencies.every(dep => dep.status === 'completed');
  }

  static fromDatabase(row) {
    return new WorkflowStep({
      id: row.id,
      workflowId: row.workflow_id,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      positionX: row.position_x,
      positionY: row.position_y,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  toJSON() {
    return {
      id: this.id,
      workflowId: this.workflowId,
      name: this.name,
      description: this.description,
      type: this.type,
      status: this.status,
      positionX: this.positionX,
      positionY: this.positionY,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = WorkflowStep; 