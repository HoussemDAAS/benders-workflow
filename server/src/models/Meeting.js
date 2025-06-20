const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('./ActivityLogger');

class Meeting {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.clientId = data.clientId;
    this.title = data.title;
    this.description = data.description;
    this.meetingDate = data.meetingDate;
    this.durationMinutes = data.durationMinutes || 60;
    this.location = data.location;
    this.meetingType = data.meetingType || 'in-person';
    this.status = data.status || 'scheduled';
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findAll() {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT cm.*, c.name as client_name, c.company as client_company
      FROM client_meetings cm
      LEFT JOIN clients c ON cm.client_id = c.id
      ORDER BY cm.meeting_date ASC
    `);
    return rows.map(row => Meeting.fromDatabase(row));
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get(`
      SELECT cm.*, c.name as client_name, c.company as client_company
      FROM client_meetings cm
      LEFT JOIN clients c ON cm.client_id = c.id
      WHERE cm.id = ?
    `, [id]);
    return row ? Meeting.fromDatabase(row) : null;
  }

  static async findByClientId(clientId) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT cm.*, c.name as client_name, c.company as client_company
      FROM client_meetings cm
      LEFT JOIN clients c ON cm.client_id = c.id
      WHERE cm.client_id = ?
      ORDER BY cm.meeting_date ASC
    `, [clientId]);
    return rows.map(row => Meeting.fromDatabase(row));
  }

  static async findUpcoming(days = 7) {
    const db = getDatabase();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const rows = await db.all(`
      SELECT cm.*, c.name as client_name, c.company as client_company
      FROM client_meetings cm
      LEFT JOIN clients c ON cm.client_id = c.id
      WHERE cm.meeting_date BETWEEN ? AND ? AND cm.status = 'scheduled'
      ORDER BY cm.meeting_date ASC
    `, [new Date().toISOString(), futureDate.toISOString()]);
    
    return rows.map(row => Meeting.fromDatabase(row));
  }

  static async findByDateRange(startDate, endDate) {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT cm.*, c.name as client_name, c.company as client_company
      FROM client_meetings cm
      LEFT JOIN clients c ON cm.client_id = c.id
      WHERE cm.meeting_date BETWEEN ? AND ?
      ORDER BY cm.meeting_date ASC
    `, [startDate.toISOString(), endDate.toISOString()]);
    
    return rows.map(row => Meeting.fromDatabase(row));
  }

  async save(performedBy = null) {
    const db = getDatabase();
    const isNew = !(await Meeting.findById(this.id));
    
    if (isNew) {
      await db.run(`
        INSERT INTO client_meetings (
          id, client_id, title, description, meeting_date, duration_minutes,
          location, meeting_type, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.id, this.clientId, this.title, this.description,
        this.meetingDate.toISOString(), this.durationMinutes,
        this.location, this.meetingType, this.status, this.notes,
        this.createdAt.toISOString(), this.updatedAt.toISOString()
      ]);

      await ActivityLogger.log('meeting', this.id, 'created', performedBy, {
        title: this.title,
        clientId: this.clientId,
        meetingDate: this.meetingDate,
        status: this.status
      });
    } else {
      this.updatedAt = new Date();
      await db.run(`
        UPDATE client_meetings 
        SET client_id = ?, title = ?, description = ?, meeting_date = ?,
            duration_minutes = ?, location = ?, meeting_type = ?, status = ?,
            notes = ?, updated_at = ?
        WHERE id = ?
      `, [
        this.clientId, this.title, this.description, this.meetingDate.toISOString(),
        this.durationMinutes, this.location, this.meetingType, this.status,
        this.notes, this.updatedAt.toISOString(), this.id
      ]);

      await ActivityLogger.log('meeting', this.id, 'updated', performedBy, {
        title: this.title,
        status: this.status
      });
    }

    return this;
  }

  async delete(performedBy = null) {
    const db = getDatabase();
    await db.run('DELETE FROM client_meetings WHERE id = ?', [this.id]);
    
    await ActivityLogger.log('meeting', this.id, 'deleted', performedBy, {
      title: this.title
    });
  }

  async addAttendee(memberId, attendanceStatus = 'invited') {
    const db = getDatabase();
    const attendeeId = uuidv4();
    
    await db.run(`
      INSERT OR REPLACE INTO meeting_attendees (id, meeting_id, member_id, attendance_status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [attendeeId, this.id, memberId, attendanceStatus, new Date().toISOString()]);
    
    return attendeeId;
  }

  async removeAttendee(memberId) {
    const db = getDatabase();
    await db.run('DELETE FROM meeting_attendees WHERE meeting_id = ? AND member_id = ?', [this.id, memberId]);
  }

  async updateAttendeeStatus(memberId, attendanceStatus) {
    const db = getDatabase();
    await db.run(`
      UPDATE meeting_attendees 
      SET attendance_status = ?
      WHERE meeting_id = ? AND member_id = ?
    `, [attendanceStatus, this.id, memberId]);
  }

  async getAttendees() {
    const db = getDatabase();
    return await db.all(`
      SELECT ma.*, tm.name, tm.email, tm.role
      FROM meeting_attendees ma
      JOIN team_members tm ON ma.member_id = tm.id
      WHERE ma.meeting_id = ?
      ORDER BY tm.name
    `, [this.id]);
  }

  static fromDatabase(row) {
    const meeting = new Meeting({
      id: row.id,
      clientId: row.client_id,
      title: row.title,
      description: row.description,
      meetingDate: new Date(row.meeting_date),
      durationMinutes: row.duration_minutes,
      location: row.location,
      meetingType: row.meeting_type,
      status: row.status,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });

    // Add client information if available
    if (row.client_name) {
      meeting.client = {
        name: row.client_name,
        company: row.client_company
      };
    }

    return meeting;
  }

  toJSON() {
    return {
      id: this.id,
      clientId: this.clientId,
      title: this.title,
      description: this.description,
      meetingDate: this.meetingDate,
      durationMinutes: this.durationMinutes,
      location: this.location,
      meetingType: this.meetingType,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      client: this.client
    };
  }
}

module.exports = Meeting; 