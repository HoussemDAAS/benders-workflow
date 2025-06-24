const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');

class ActivityLogger {
  static async log(entityType, entityId, action, performedBy = null, details = {}) {
    const db = getDatabase();
    
    const id = uuidv4();
    const detailsJson = JSON.stringify(details);
    
    await db.run(`
      INSERT INTO activity_log (id, entity_type, entity_id, action, performed_by, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      entityType,
      entityId,
      action,
      performedBy,
      detailsJson,
      new Date().toISOString()
    ]);
    
    return id;
  }

  static async getActivities(entityType = null, entityId = null, limit = 100, offset = 0) {
    const db = getDatabase();
    let sql = `
      SELECT al.*, u.name as performed_by_name
      FROM activity_log al
      LEFT JOIN users u ON al.performed_by = u.id
    `;
    const params = [];

    const conditions = [];
    if (entityType) {
      conditions.push('al.entity_type = ?');
      params.push(entityType);
    }
    if (entityId) {
      conditions.push('al.entity_id = ?');
      params.push(entityId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await db.all(sql, params);
    return rows.map(row => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      performedBy: row.performed_by,
      performedByName: row.performed_by_name,
      details: JSON.parse(row.details || '{}'),
      createdAt: new Date(row.created_at)
    }));
  }

  static async getEntityHistory(entityType, entityId) {
    return await this.getActivities(entityType, entityId);
  }

  static async getRecentActivities(limit = 50) {
    return await this.getActivities(null, null, limit);
  }
}

module.exports = ActivityLogger;