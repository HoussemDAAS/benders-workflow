const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class TaskResource {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.taskId = data.taskId;
    this.type = data.type; // 'document', 'link', 'image', 'file'
    this.title = data.title;
    this.content = data.content; // HTML content for documents
    this.url = data.url; // URL for links or file URLs
    this.fileName = data.fileName;
    this.fileSize = data.fileSize;
    this.mimeType = data.mimeType;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findAll() {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT tr.*, kt.title as task_title
      FROM task_resources tr
      LEFT JOIN kanban_tasks kt ON tr.task_id = kt.id
      ORDER BY tr.created_at DESC
    `);
    return rows.map(row => TaskResource.fromDatabase(row));
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get(`
      SELECT tr.*, kt.title as task_title
      FROM task_resources tr
      LEFT JOIN kanban_tasks kt ON tr.task_id = kt.id
      WHERE tr.id = ?
    `, [id]);
    return row ? TaskResource.fromDatabase(row) : null;
  }

  static async findByTaskId(taskId) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT tr.*, kt.title as task_title
      FROM task_resources tr
      LEFT JOIN kanban_tasks kt ON tr.task_id = kt.id
      WHERE tr.task_id = ?
      ORDER BY tr.created_at DESC
    `, [taskId]);
    return rows.map(row => TaskResource.fromDatabase(row));
  }

  static async findByType(type) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT tr.*, kt.title as task_title
      FROM task_resources tr
      LEFT JOIN kanban_tasks kt ON tr.task_id = kt.id
      WHERE tr.type = ?
      ORDER BY tr.created_at DESC
    `, [type]);
    return rows.map(row => TaskResource.fromDatabase(row));
  }

  async save(performedBy = null) {
    const db = getDatabase();
    const isNew = !(await TaskResource.findById(this.id));
    
    if (isNew) {
      await db.run(`
        INSERT INTO task_resources (
          id, task_id, type, title, content, url, file_name, file_size, mime_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, this.taskId, this.type, this.title, this.content, this.url,
        this.fileName, this.fileSize, this.mimeType,
        this.createdAt.toISOString(), this.updatedAt.toISOString()
      ]);

      await ActivityLogger.log('task_resource', this.id, 'created', performedBy, {
        title: this.title,
        type: this.type,
        taskId: this.taskId
      });
    } else {
      this.updatedAt = new Date();
      await db.run(`
        UPDATE task_resources 
        SET task_id = ?, type = ?, title = ?, content = ?, url = ?, 
            file_name = ?, file_size = ?, mime_type = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.taskId, this.type, this.title, this.content, this.url,
        this.fileName, this.fileSize, this.mimeType, this.updatedAt.toISOString(), this.id
      ]);

      await ActivityLogger.log('task_resource', this.id, 'updated', performedBy, {
        title: this.title,
        type: this.type
      });
    }

    return this;
  }

  async delete(performedBy = null) {
    const db = getDatabase();
    await db.run('DELETE FROM task_resources WHERE id = ?', [this.id]);
    
    await ActivityLogger.log('task_resource', this.id, 'deleted', performedBy, {
      title: this.title,
      type: this.type,
      taskId: this.taskId
    });
  }

  static fromDatabase(row) {
    const resource = new TaskResource({
      id: row.id,
      taskId: row.task_id,
      type: row.type,
      title: row.title,
      content: row.content,
      url: row.url,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });

    // Add task information if available
    if (row.task_title) {
      resource.task = {
        title: row.task_title
      };
    }

    return resource;
  }

  toJSON() {
    return {
      id: this.id,
      taskId: this.taskId,
      type: this.type,
      title: this.title,
      content: this.content,
      url: this.url,
      fileName: this.fileName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      task: this.task
    };
  }
}

module.exports = TaskResource; 