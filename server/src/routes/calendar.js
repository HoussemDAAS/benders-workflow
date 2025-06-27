const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const Workspace = require('../models/Workspace');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Helper function to get user's workspace ID
const getUserWorkspaceId = async (req) => {
  let workspaceId = req.headers['x-workspace-id'] || req.query.workspace_id;
  
  if (workspaceId) {
    const isMember = await Workspace.isUserMember(req.user.id, workspaceId);
    if (isMember) {
      return workspaceId;
    }
  }
  
  const userWorkspaces = await Workspace.findForUser(req.user.id);
  if (userWorkspaces.length > 0) {
    return userWorkspaces[0].id;
  }
  
  throw new Error('No accessible workspace found for user');
};

// ===============================
// CALENDAR EVENTS CRUD ENDPOINTS
// ===============================

// GET /api/calendar - Get calendar events with filters
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    // Get user's workspace ID
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }
    
    const {
      startDate,
      endDate,
      eventType,
      taskId,
      view = 'month', // month, week, day
      limit = 100,
      offset = 0
    } = req.query;

    let whereConditions = ['ce.user_id = ?', 'ce.workspace_id = ?'];
    let params = [userId, workspaceId];

    // Add date filters based on view
    if (startDate && endDate) {
      whereConditions.push('(ce.start_time <= ? AND ce.end_time >= ?)');
      params.push(endDate, startDate);
    } else if (view === 'day' && startDate) {
      whereConditions.push('DATE(ce.start_time) = ?');
      params.push(startDate);
    } else if (view === 'week' && startDate) {
      whereConditions.push('DATE(ce.start_time) BETWEEN ? AND DATE(?, "+6 days")');
      params.push(startDate, startDate);
    } else if (view === 'month' && startDate) {
      // Get first and last day of month
      whereConditions.push('strftime("%Y-%m", ce.start_time) = strftime("%Y-%m", ?)');
      params.push(startDate);
    }

    if (eventType) {
      whereConditions.push('ce.event_type = ?');
      params.push(eventType);
    }

    if (taskId) {
      whereConditions.push('ce.task_id = ?');
      params.push(taskId);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get calendar events with task info
    const events = await db.all(`
      SELECT 
        ce.*,
        kt.title as task_title,
        kt.description as task_description,
        kt.priority as task_priority
      FROM calendar_events ce
      LEFT JOIN kanban_tasks kt ON ce.task_id = kt.id
      WHERE ${whereClause}
      ORDER BY ce.start_time ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count for pagination
    const totalResult = await db.get(`
      SELECT COUNT(*) as total
      FROM calendar_events ce
      WHERE ${whereConditions.join(' AND ')}
    `, params.slice(0, -2)); // Remove limit/offset params

    res.json({
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        allDay: event.all_day,
        taskId: event.task_id,
        taskTitle: event.task_title,
        taskPriority: event.task_priority,
        description: event.description,
        eventType: event.event_type,
        color: event.color,
        createdAt: event.created_at,
        updatedAt: event.updated_at
      })),
      pagination: {
        total: events.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: false
      },
      view,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// GET /api/calendar/upcoming - Get upcoming events (next 7 days)
router.get('/upcoming', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const workspaceId = req.user.workspaceId || 'default-workspace';
    
    const { limit = 10 } = req.query;

    const events = await db.all(`
      SELECT 
        ce.*,
        kt.title as task_title,
        kt.priority as task_priority
      FROM calendar_events ce
      LEFT JOIN kanban_tasks kt ON ce.task_id = kt.id
      WHERE ce.user_id = ? AND ce.workspace_id = ? 
        AND datetime(ce.start_time) >= datetime('now')
        AND datetime(ce.start_time) <= datetime('now', '+7 days')
      ORDER BY ce.start_time ASC
      LIMIT ?
    `, [userId, workspaceId, parseInt(limit)]);

    res.json({
      upcomingEvents: events.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        allDay: event.all_day,
        taskId: event.task_id,
        taskTitle: event.task_title,
        taskPriority: event.task_priority,
        eventType: event.event_type,
        color: event.color
      }))
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// POST /api/calendar - Create new calendar event
router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const workspaceId = req.user.workspaceId || 'default-workspace';
    
    const {
      title,
      startTime,
      endTime,
      allDay = false,
      taskId,
      description,
      eventType = 'task',
      color = '#3b82f6'
    } = req.body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Title, start time, and end time are required' 
      });
    }

    // Validate event type
    const validEventTypes = ['task', 'meeting', 'break', 'personal'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({ 
        error: 'Invalid event type. Must be one of: task, meeting, break, personal' 
      });
    }

    // Validate date range
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ 
        error: 'End time must be after start time' 
      });
    }

    // Validate task exists if provided
    if (taskId) {
      const task = await db.get(`
        SELECT id FROM kanban_tasks WHERE id = ? AND workspace_id = ?
      `, [taskId, workspaceId]);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }

    // Check for conflicting events (optional - could be configurable)
    const conflictingEvents = await db.all(`
      SELECT id, title FROM calendar_events
      WHERE user_id = ? AND workspace_id = ?
        AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
        AND event_type != 'personal'
    `, [userId, workspaceId, startTime, startTime, endTime, endTime]);

    // Create calendar event
    const eventId = uuidv4();
    await db.run(`
      INSERT INTO calendar_events (
        id, user_id, workspace_id, title, start_time, end_time, all_day,
        task_id, description, event_type, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId, userId, workspaceId, title, startTime, endTime, allDay,
      taskId, description, eventType, color
    ]);

    // Get the created event with task info
    const newEvent = await db.get(`
      SELECT 
        ce.*,
        kt.title as task_title,
        kt.priority as task_priority
      FROM calendar_events ce
      LEFT JOIN kanban_tasks kt ON ce.task_id = kt.id
      WHERE ce.id = ?
    `, [eventId]);

    res.status(201).json({
      message: 'Calendar event created successfully',
      event: {
        id: newEvent.id,
        title: newEvent.title,
        startTime: newEvent.start_time,
        endTime: newEvent.end_time,
        allDay: newEvent.all_day,
        taskId: newEvent.task_id,
        taskTitle: newEvent.task_title,
        taskPriority: newEvent.task_priority,
        description: newEvent.description,
        eventType: newEvent.event_type,
        color: newEvent.color
      },
      conflicts: conflictingEvents.length > 0 ? {
        hasConflicts: true,
        conflictingEvents: conflictingEvents.map(e => ({
          id: e.id,
          title: e.title
        }))
      } : { hasConflicts: false }
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/calendar/:id - Update calendar event
router.put('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const workspaceId = req.user.workspaceId || 'default-workspace';
    const { id } = req.params;
    
    const {
      title,
      startTime,
      endTime,
      allDay,
      taskId,
      description,
      eventType,
      color
    } = req.body;

    // Check if event exists and belongs to user
    const existingEvent = await db.get(`
      SELECT * FROM calendar_events WHERE id = ? AND user_id = ? AND workspace_id = ?
    `, [id, userId, workspaceId]);

    if (!existingEvent) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    // Validate date range if both times provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        return res.status(400).json({ 
          error: 'End time must be after start time' 
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }

    if (startTime) {
      updates.push('start_time = ?');
      params.push(startTime);
    }

    if (endTime) {
      updates.push('end_time = ?');
      params.push(endTime);
    }

    if (allDay !== undefined) {
      updates.push('all_day = ?');
      params.push(allDay);
    }

    if (taskId !== undefined) {
      if (taskId) {
        // Validate task exists
        const task = await db.get(`
          SELECT id FROM kanban_tasks WHERE id = ? AND workspace_id = ?
        `, [taskId, workspaceId]);
        
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
      }
      updates.push('task_id = ?');
      params.push(taskId);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (eventType) {
      const validEventTypes = ['task', 'meeting', 'break', 'personal'];
      if (!validEventTypes.includes(eventType)) {
        return res.status(400).json({ 
          error: 'Invalid event type. Must be one of: task, meeting, break, personal' 
        });
      }
      updates.push('event_type = ?');
      params.push(eventType);
    }

    if (color) {
      updates.push('color = ?');
      params.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, userId, workspaceId);

    await db.run(`
      UPDATE calendar_events 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ? AND workspace_id = ?
    `, params);

    // Get updated event
    const updatedEvent = await db.get(`
      SELECT 
        ce.*,
        kt.title as task_title,
        kt.priority as task_priority
      FROM calendar_events ce
      LEFT JOIN kanban_tasks kt ON ce.task_id = kt.id
      WHERE ce.id = ?
    `, [id]);

    res.json({
      message: 'Calendar event updated successfully',
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        startTime: updatedEvent.start_time,
        endTime: updatedEvent.end_time,
        allDay: updatedEvent.all_day,
        taskId: updatedEvent.task_id,
        taskTitle: updatedEvent.task_title,
        taskPriority: updatedEvent.task_priority,
        description: updatedEvent.description,
        eventType: updatedEvent.event_type,
        color: updatedEvent.color
      }
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// DELETE /api/calendar/:id - Delete calendar event
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const workspaceId = req.user.workspaceId || 'default-workspace';
    const { id } = req.params;

    // Check if event exists and belongs to user
    const existingEvent = await db.get(`
      SELECT * FROM calendar_events WHERE id = ? AND user_id = ? AND workspace_id = ?
    `, [id, userId, workspaceId]);

    if (!existingEvent) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    await db.run(`
      DELETE FROM calendar_events WHERE id = ? AND user_id = ? AND workspace_id = ?
    `, [id, userId, workspaceId]);

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// POST /api/calendar/bulk-create - Create multiple events (e.g., recurring events)
router.post('/bulk-create', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const workspaceId = req.user.workspaceId || 'default-workspace';
    
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    if (events.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 events can be created at once' });
    }

    const createdEvents = [];
    const errors = [];

    // Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      try {
        const {
          title,
          startTime,
          endTime,
          allDay = false,
          taskId,
          description,
          eventType = 'task',
          color = '#3b82f6'
        } = event;

        // Validate required fields
        if (!title || !startTime || !endTime) {
          errors.push({
            index: i,
            error: 'Title, start time, and end time are required'
          });
          continue;
        }

        // Validate task exists if provided
        if (taskId) {
          const task = await db.get(`
            SELECT id FROM kanban_tasks WHERE id = ? AND workspace_id = ?
          `, [taskId, workspaceId]);
          
          if (!task) {
            errors.push({
              index: i,
              error: 'Task not found'
            });
            continue;
          }
        }

        // Create calendar event
        const eventId = uuidv4();
        await db.run(`
          INSERT INTO calendar_events (
            id, user_id, workspace_id, title, start_time, end_time, all_day,
            task_id, description, event_type, color
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          eventId, userId, workspaceId, title, startTime, endTime, allDay,
          taskId, description, eventType, color
        ]);

        createdEvents.push({
          id: eventId,
          title,
          startTime,
          endTime,
          allDay,
          taskId,
          description,
          eventType,
          color
        });
      } catch (eventError) {
        errors.push({
          index: i,
          error: eventError.message
        });
      }
    }

    res.status(201).json({
      message: `Successfully created ${createdEvents.length} events`,
      createdEvents,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: events.length,
        created: createdEvents.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk creating calendar events:', error);
    res.status(500).json({ error: 'Failed to create calendar events' });
  }
});

module.exports = router;