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

// GET /api/time-entries - Get time entries with filters
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
      start_date,
      end_date,
      task_id,
      category_id,
      is_break,
      limit = 50,
      offset = 0
    } = req.query;

    // Build query with filters
    let query = `
      SELECT 
        te.*,
        kt.title as task_title,
        kt.priority as task_priority,
        wf.id as workflow_id,
        wf.name as workflow_name,
        c.id as client_id,
        c.name as client_name,
        tc.name as category_name,
        tc.color as category_color,
        tc.is_billable as category_billable
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE te.user_id = ? AND te.workspace_id = ?
    `;
    
    const params = [userId, workspaceId];

    if (start_date) {
      query += ` AND date(te.start_time) >= date(?)`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND date(te.start_time) <= date(?)`;
      params.push(end_date);
    }

    if (task_id) {
      query += ` AND te.task_id = ?`;
      params.push(task_id);
    }

    if (category_id) {
      query += ` AND te.category_id = ?`;
      params.push(category_id);
    }

    if (is_break !== undefined) {
      query += ` AND te.is_break = ?`;
      params.push(is_break === 'true' ? 1 : 0);
    }

    query += ` ORDER BY te.start_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const timeEntries = await db.all(query, params);

    // Format response
    const formattedEntries = timeEntries.map(entry => ({
      id: entry.id,
      taskId: entry.task_id,
      taskTitle: entry.task_title,
      taskPriority: entry.task_priority,
      workflowId: entry.workflow_id,
      workflowName: entry.workflow_name,
      clientId: entry.client_id,
      clientName: entry.client_name,
      categoryId: entry.category_id,
      categoryName: entry.category_name,
      categoryColor: entry.category_color,
      categoryBillable: entry.category_billable,
      startTime: entry.start_time,
      endTime: entry.end_time,
      duration: entry.duration_seconds,
      description: entry.description,
      isBreak: Boolean(entry.is_break),
      status: entry.status,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at
    }));

    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// GET /api/time-entries/stats - Get time tracking statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    const { start_date, end_date } = req.query;

    // Default to current month if no dates provided
    const defaultStartDate = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const defaultEndDate = end_date || new Date().toISOString();

    // Get time entries for the period
    const timeEntries = await db.all(`
      SELECT 
        te.*,
        kt.title as task_title,
        wf.name as workflow_name,
        c.name as client_name,
        tc.name as category_name
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE te.user_id = ? AND te.workspace_id = ?
        AND te.start_time >= ? AND te.start_time <= ?
      ORDER BY te.start_time DESC
    `, [userId, workspaceId, defaultStartDate, defaultEndDate]);

    // Calculate total time
    const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    const totalHours = totalSeconds / 3600;
    const totalMinutes = totalSeconds / 60;

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = timeEntries.filter(entry => 
      entry.start_time.split('T')[0] === today
    );
    const todaySeconds = todayEntries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    const todayHours = todaySeconds / 3600;

    // This week's stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEntries = timeEntries.filter(entry => 
      new Date(entry.start_time) >= weekStart
    );
    const weekSeconds = weekEntries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    const weekHours = weekSeconds / 3600;

    // Task breakdown
    const taskMap = new Map();
    timeEntries.forEach(entry => {
      if (entry.task_id && entry.task_title) {
        const existing = taskMap.get(entry.task_id) || { 
          taskId: entry.task_id, 
          taskTitle: entry.task_title, 
          seconds: 0 
        };
        existing.seconds += entry.duration_seconds || 0;
        taskMap.set(entry.task_id, existing);
      }
    });

    const taskBreakdown = Array.from(taskMap.values())
      .map(task => ({
        taskId: task.taskId,
        taskTitle: task.taskTitle,
        hours: task.seconds / 3600,
        percentage: totalSeconds > 0 ? Math.round((task.seconds / totalSeconds) * 100) : 0
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Top 10 tasks

    // Category breakdown
    const categoryMap = new Map();
    timeEntries.forEach(entry => {
      const categoryName = entry.category_name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { 
        categoryName, 
        seconds: 0 
      };
      existing.seconds += entry.duration_seconds || 0;
      categoryMap.set(categoryName, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map(category => ({
        categoryName: category.categoryName,
        hours: category.seconds / 3600,
        percentage: totalSeconds > 0 ? Math.round((category.seconds / totalSeconds) * 100) : 0
      }))
      .sort((a, b) => b.hours - a.hours);

    // Daily trend for the period (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = timeEntries.filter(entry => 
        entry.start_time.split('T')[0] === dateStr
      );
      const daySeconds = dayEntries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
      
      last7Days.push({
        date: dateStr,
        hours: daySeconds / 3600
      });
    }

    // Calculate daily average
    const daysInPeriod = Math.max(1, Math.ceil((new Date(defaultEndDate) - new Date(defaultStartDate)) / (1000 * 60 * 60 * 24)));
    const dailyAverage = totalHours / daysInPeriod;

    res.json({
      totalHours: Math.round(totalHours * 100) / 100,
      totalMinutes: Math.round(totalMinutes),
      todayHours: Math.round(todayHours * 100) / 100,
      weekHours: Math.round(weekHours * 100) / 100,
      monthHours: Math.round(totalHours * 100) / 100, // Same as total for the queried period
      taskBreakdown,
      categoryBreakdown,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      weeklyTrend: last7Days,
      summary: {
        totalEntries: timeEntries.length,
        period: {
          start: defaultStartDate,
          end: defaultEndDate
        },
        productivity: {
          averageSessionLength: timeEntries.length > 0 ? Math.round((totalMinutes / timeEntries.length) * 100) / 100 : 0,
          longestSession: Math.max(...timeEntries.map(e => (e.duration_seconds || 0) / 60), 0),
          shortestSession: timeEntries.length > 0 ? Math.min(...timeEntries.map(e => (e.duration_seconds || 0) / 60)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error calculating time stats:', error);
    res.status(500).json({ error: 'Failed to calculate time statistics' });
  }
});

// GET /api/time-entries/activities - Get timer activity log for time breakdown
router.get('/activities', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    const { start_date, end_date, limit = 100 } = req.query;

    // Default to today if no dates provided
    const defaultStartDate = start_date || new Date().toISOString().split('T')[0];
    const defaultEndDate = end_date || new Date().toISOString().split('T')[0];

    console.log(`🔍 Fetching timer activities for user ${userId} from ${defaultStartDate} to ${defaultEndDate}`);

    // Get timer activities from activity_log
    const activities = await db.all(`
      SELECT 
        al.*,
        u.name as performed_by_name
      FROM activity_log al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE al.entity_type = 'timer' 
        AND al.performed_by = ?
        AND date(al.created_at) >= date(?)
        AND date(al.created_at) <= date(?)
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [userId, defaultStartDate, defaultEndDate, parseInt(limit)]);

    console.log(`📋 Found ${activities.length} timer activities`);

    // Get related time entries for context
    const timeEntries = await db.all(`
      SELECT 
        te.*,
        kt.title as task_title,
        tc.name as category_name,
        tc.color as category_color
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE te.user_id = ? AND te.workspace_id = ?
        AND date(te.start_time) >= date(?)
        AND date(te.start_time) <= date(?)
      ORDER BY te.start_time DESC
    `, [userId, workspaceId, defaultStartDate, defaultEndDate]);

    console.log(`⏱️ Found ${timeEntries.length} time entries`);

    // Format activities with details
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      entityType: activity.entity_type,
      entityId: activity.entity_id,
      action: activity.action,
      performedBy: activity.performed_by,
      performedByName: activity.performed_by_name,
      details: JSON.parse(activity.details || '{}'),
      createdAt: activity.created_at
    }));

    // Group activities by session/timer
    const sessionMap = new Map();
    formattedActivities.forEach(activity => {
      const timerId = activity.entityId;
      if (!sessionMap.has(timerId)) {
        sessionMap.set(timerId, {
          timerId,
          activities: [],
          timeEntry: null
        });
      }
      sessionMap.get(timerId).activities.push(activity);
    });

    // Add time entries to sessions
    timeEntries.forEach(entry => {
      // Find corresponding activities by looking for stop activity with this time entry ID
      const stopActivity = formattedActivities.find(act => 
        act.action === 'stopped' && act.details.timeEntryId === entry.id
      );
      
      if (stopActivity) {
        const session = sessionMap.get(stopActivity.entityId);
        if (session) {
          session.timeEntry = {
            id: entry.id,
            taskId: entry.task_id,
            taskTitle: entry.task_title,
            categoryName: entry.category_name,
            categoryColor: entry.category_color,
            startTime: entry.start_time,
            endTime: entry.end_time,
            duration: entry.duration_seconds,
            description: entry.description,
            isBreak: Boolean(entry.is_break)
          };
        }
      }
    });

    // Convert map to array and sort by latest activity
    const sessions = Array.from(sessionMap.values()).sort((a, b) => {
      const latestA = Math.max(...a.activities.map(act => new Date(act.createdAt).getTime()));
      const latestB = Math.max(...b.activities.map(act => new Date(act.createdAt).getTime()));
      return latestB - latestA;
    });

    console.log(`🎯 Returning ${sessions.length} sessions`);

    res.json({
      activities: formattedActivities,
      sessions: sessions,
      timeEntries: timeEntries.map(entry => ({
        id: entry.id,
        taskId: entry.task_id,
        taskTitle: entry.task_title,
        categoryName: entry.category_name,
        categoryColor: entry.category_color,
        startTime: entry.start_time,
        endTime: entry.end_time,
        duration: entry.duration_seconds,
        description: entry.description,
        isBreak: Boolean(entry.is_break)
      })),
      dateRange: { startDate: defaultStartDate, endDate: defaultEndDate }
    });
  } catch (error) {
    console.error('Error fetching timer activities:', error);
    res.status(500).json({ error: 'Failed to fetch timer activities' });
  }
});

// GET /api/time-entries/:id - Get specific time entry
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const entryId = req.params.id;
    
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    const timeEntry = await db.get(`
      SELECT 
        te.*,
        kt.title as task_title,
        wf.name as workflow_name,
        c.name as client_name,
        tc.name as category_name,
        tc.color as category_color
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE te.id = ? AND te.user_id = ? AND te.workspace_id = ?
    `, [entryId, userId, workspaceId]);

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    res.json({
      id: timeEntry.id,
      taskId: timeEntry.task_id,
      taskTitle: timeEntry.task_title,
      workflowName: timeEntry.workflow_name,
      clientName: timeEntry.client_name,
      categoryId: timeEntry.category_id,
      categoryName: timeEntry.category_name,
      categoryColor: timeEntry.category_color,
      startTime: timeEntry.start_time,
      endTime: timeEntry.end_time,
      duration: timeEntry.duration_seconds,
      description: timeEntry.description,
      isBreak: Boolean(timeEntry.is_break),
      status: timeEntry.status,
      createdAt: timeEntry.created_at,
      updatedAt: timeEntry.updated_at
    });
  } catch (error) {
    console.error('Error fetching time entry:', error);
    res.status(500).json({ error: 'Failed to fetch time entry' });
  }
});

// POST /api/time-entries - Create manual time entry
router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    const {
      taskId,
      categoryId,
      startTime,
      endTime,
      description,
      isBreak = false
    } = req.body;

    // Validate required fields
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const duration = Math.floor((end - start) / 1000);

    // Validate task if provided
    if (taskId) {
      const task = await db.get(`
        SELECT id FROM kanban_tasks WHERE id = ? AND workspace_id = ?
      `, [taskId, workspaceId]);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }

    // Create time entry
    const timeEntryId = uuidv4();
    await db.run(`
      INSERT INTO time_entries (
        id, user_id, workspace_id, task_id, category_id, start_time, end_time,
        duration_seconds, status, description, is_break
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      timeEntryId, userId, workspaceId, taskId, categoryId,
      start.toISOString(), end.toISOString(), duration, 'completed',
      description, isBreak
    ]);

    // Return created entry with related data
    const createdEntry = await db.get(`
      SELECT 
        te.*,
        kt.title as task_title,
        wf.name as workflow_name,
        c.name as client_name,
        tc.name as category_name,
        tc.color as category_color
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE te.id = ?
    `, [timeEntryId]);

    res.status(201).json({
      message: 'Time entry created successfully',
      timeEntry: {
        id: createdEntry.id,
        taskId: createdEntry.task_id,
        taskTitle: createdEntry.task_title,
        workflowName: createdEntry.workflow_name,
        clientName: createdEntry.client_name,
        categoryId: createdEntry.category_id,
        categoryName: createdEntry.category_name,
        categoryColor: createdEntry.category_color,
        startTime: createdEntry.start_time,
        endTime: createdEntry.end_time,
        duration: createdEntry.duration_seconds,
        description: createdEntry.description,
        isBreak: Boolean(createdEntry.is_break),
        status: createdEntry.status
      }
    });
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// PUT /api/time-entries/:id - Update time entry
router.put('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const entryId = req.params.id;
    
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    // Check if entry exists and belongs to user
    const existingEntry = await db.get(`
      SELECT * FROM time_entries 
      WHERE id = ? AND user_id = ? AND workspace_id = ?
    `, [entryId, userId, workspaceId]);

    if (!existingEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    const {
      taskId,
      categoryId,
      startTime,
      endTime,
      description,
      isBreak
    } = req.body;

    // Validate dates if provided
    let duration = existingEntry.duration_seconds;
    let newStartTime = existingEntry.start_time;
    let newEndTime = existingEntry.end_time;

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      if (end <= start) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      duration = Math.floor((end - start) / 1000);
      newStartTime = start.toISOString();
      newEndTime = end.toISOString();
    }

    // Update entry
    await db.run(`
      UPDATE time_entries 
      SET 
        task_id = COALESCE(?, task_id),
        category_id = COALESCE(?, category_id),
        start_time = ?,
        end_time = ?,
        duration_seconds = ?,
        description = COALESCE(?, description),
        is_break = COALESCE(?, is_break),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      taskId, categoryId, newStartTime, newEndTime, duration,
      description, isBreak, entryId
    ]);

    // Return updated entry
    const updatedEntry = await db.get(`
      SELECT 
        te.*,
        kt.title as task_title,
        wf.name as workflow_name,
        c.name as client_name,
        tc.name as category_name,
        tc.color as category_color
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE te.id = ?
    `, [entryId]);

    res.json({
      message: 'Time entry updated successfully',
      timeEntry: {
        id: updatedEntry.id,
        taskId: updatedEntry.task_id,
        taskTitle: updatedEntry.task_title,
        workflowName: updatedEntry.workflow_name,
        clientName: updatedEntry.client_name,
        categoryId: updatedEntry.category_id,
        categoryName: updatedEntry.category_name,
        categoryColor: updatedEntry.category_color,
        startTime: updatedEntry.start_time,
        endTime: updatedEntry.end_time,
        duration: updatedEntry.duration_seconds,
        description: updatedEntry.description,
        isBreak: Boolean(updatedEntry.is_break),
        status: updatedEntry.status
      }
    });
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// DELETE /api/time-entries/:id - Delete time entry
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const entryId = req.params.id;
    
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    // Check if entry exists and belongs to user
    const existingEntry = await db.get(`
      SELECT * FROM time_entries 
      WHERE id = ? AND user_id = ? AND workspace_id = ?
    `, [entryId, userId, workspaceId]);

    if (!existingEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    // Delete entry
    await db.run(`
      DELETE FROM time_entries WHERE id = ?
    `, [entryId]);

    res.json({ 
      message: 'Time entry deleted successfully',
      deletedEntry: {
        id: existingEntry.id,
        duration: existingEntry.duration_seconds
      }
    });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

module.exports = router;