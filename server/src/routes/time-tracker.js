const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const ActivityLogger = require('../models/ActivityLogger');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Helper function to get user's workspace ID
const getUserWorkspaceId = async (req) => {
  // First try to get workspace from header (preferred method)
  let workspaceId = req.headers['x-workspace-id'] || req.query.workspace_id;
  
  if (workspaceId) {
    // Verify user has access to this workspace
    const isMember = await Workspace.isUserMember(req.user.id, workspaceId);
    if (isMember) {
      return workspaceId;
    }
  }
  
  // Fall back to user's first available workspace
  const userWorkspaces = await Workspace.findForUser(req.user.id);
  if (userWorkspaces.length > 0) {
    return userWorkspaces[0].id;
  }
  
  // If no workspaces found, throw error
  throw new Error('No accessible workspace found for user');
};

// ===============================
// TIMER CONTROL ENDPOINTS
// ===============================

// POST /api/time-tracker/start - Start new timer
router.post('/start', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { taskId, description, isBreak = false } = req.body;

    // Get user's workspace ID
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    // Check if user already has an active timer
    const existingTimer = await db.get(`
      SELECT id FROM active_timers WHERE user_id = ?
    `, [userId]);

    if (existingTimer) {
      return res.status(400).json({ error: 'You already have an active timer. Please stop it first.' });
    }

    // Validate task exists if taskId provided
    if (taskId) {
      const task = await db.get(`
        SELECT id FROM kanban_tasks WHERE id = ? AND workspace_id = ?
      `, [taskId, workspaceId]);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }

    // Create new active timer
    const timerId = uuidv4();
    const startTime = new Date().toISOString();

    await db.run(`
      INSERT INTO active_timers (id, user_id, workspace_id, task_id, start_time, description, is_break)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [timerId, userId, workspaceId, taskId, startTime, description, isBreak]);

    // Log timer start activity
    await ActivityLogger.log('timer', timerId, 'started', userId, {
      taskId: taskId,
      description: description,
      isBreak: isBreak,
      startTime: startTime,
      workspaceId: workspaceId
    });

    // Get the created timer with task info
    const newTimer = await db.get(`
      SELECT at.*, kt.title as task_title
      FROM active_timers at
      LEFT JOIN kanban_tasks kt ON at.task_id = kt.id
      WHERE at.id = ?
    `, [timerId]);

    res.status(201).json({
      message: 'Timer started successfully',
      timer: {
        id: newTimer.id,
        taskId: newTimer.task_id,
        taskTitle: newTimer.task_title,
        startTime: newTimer.start_time,
        description: newTimer.description,
        isBreak: newTimer.is_break,
        elapsedSeconds: 0,
        totalPausedDuration: 0,
        isPaused: false
      }
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// POST /api/time-tracker/pause - Pause current timer
router.post('/pause', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { reason } = req.body;

    // Get user's workspace ID
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    const activeTimer = await db.get(`
      SELECT * FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    if (activeTimer.last_pause_time) {
      return res.status(400).json({ error: 'Timer is already paused' });
    }

    // Update timer to paused state with timestamp and reason
    const pauseTime = new Date().toISOString();
    await db.run(`
      UPDATE active_timers 
      SET last_pause_time = ?, pause_reason = ?
      WHERE user_id = ? AND workspace_id = ?
    `, [pauseTime, reason || 'No reason provided', userId, workspaceId]);

    // Log timer pause activity
    await ActivityLogger.log('timer', activeTimer.id, 'paused', userId, {
      reason: reason || 'No reason provided',
      pausedAt: pauseTime,
      workspaceId: workspaceId
    });

    res.json({ 
      message: 'Timer paused successfully',
      pausedAt: pauseTime,
      reason: reason || 'No reason provided'
    });
  } catch (error) {
    console.error('Error pausing timer:', error);
    res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// POST /api/time-tracker/resume - Resume paused timer
router.post('/resume', async (req, res) => {
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

    const activeTimer = await db.get(`
      SELECT * FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    if (!activeTimer.last_pause_time) {
      return res.status(400).json({ error: 'Timer is not paused' });
    }

    // Calculate paused duration and add to total
    const pauseStart = new Date(activeTimer.last_pause_time);
    const now = new Date();
    const pausedDuration = Math.floor((now - pauseStart) / 1000);
    const newTotalPausedDuration = (activeTimer.total_paused_duration || 0) + pausedDuration;

    // Update timer to active state and clear pause info
    await db.run(`
      UPDATE active_timers 
      SET last_pause_time = NULL, total_paused_duration = ?, pause_reason = NULL
      WHERE user_id = ? AND workspace_id = ?
    `, [newTotalPausedDuration, userId, workspaceId]);

    // Log timer resume activity
    await ActivityLogger.log('timer', activeTimer.id, 'resumed', userId, {
      pausedDuration: pausedDuration,
      totalPausedDuration: newTotalPausedDuration,
      workspaceId: workspaceId
    });

    res.json({ 
      message: 'Timer resumed successfully',
      pausedDuration: pausedDuration,
      totalPausedDuration: newTotalPausedDuration
    });
  } catch (error) {
    console.error('Error resuming timer:', error);
    res.status(500).json({ error: 'Failed to resume timer' });
  }
});

// POST /api/time-tracker/stop - Stop and save timer
router.post('/stop', async (req, res) => {
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

    const activeTimer = await db.get(`
      SELECT * FROM active_timers WHERE user_id = ?
    `, [userId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    const endTime = new Date();
    const startTime = new Date(activeTimer.start_time);
    
    // Calculate total duration
    let totalDuration = Math.floor((endTime - startTime) / 1000);
    
    // If currently paused, add the current pause duration
    if (activeTimer.last_pause_time) {
      const pauseStart = new Date(activeTimer.last_pause_time);
      const currentPauseDuration = Math.floor((endTime - pauseStart) / 1000);
      totalDuration -= ((activeTimer.total_paused_duration || 0) + currentPauseDuration);
    } else {
      totalDuration -= (activeTimer.total_paused_duration || 0);
    }

    // Ensure minimum duration of 1 second
    totalDuration = Math.max(1, totalDuration);

    // Auto-assign category based on task or type
    let categoryId = null;
    if (activeTimer.is_break) {
      // Assign break category
      const breakCategory = await db.get(`
        SELECT id FROM time_categories WHERE workspace_id = ? AND name = 'Break'
      `, [workspaceId]);
      categoryId = breakCategory?.id || 'break';
    } else if (activeTimer.task_id) {
      // Assign development category for tasks
      const devCategory = await db.get(`
        SELECT id FROM time_categories WHERE workspace_id = ? AND name = 'Development'
      `, [workspaceId]);
      categoryId = devCategory?.id || 'dev-work';
    } else {
      // Default to administrative
      const adminCategory = await db.get(`
        SELECT id FROM time_categories WHERE workspace_id = ? AND name = 'Administrative'
      `, [workspaceId]);
      categoryId = adminCategory?.id || 'admin';
    }

    console.log(`Creating time entry with category: ${categoryId} for duration: ${totalDuration}s`);

    // Create time entry
    const timeEntryId = uuidv4();
    await db.run(`
      INSERT INTO time_entries (
        id, user_id, workspace_id, task_id, category_id, start_time, end_time, 
        duration_seconds, status, description, is_break
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      timeEntryId,
      userId,
      workspaceId,
      activeTimer.task_id,
      categoryId,
      activeTimer.start_time,
      endTime.toISOString(),
      totalDuration,
      'completed',
      activeTimer.description,
      activeTimer.is_break
    ]);

    // Log timer stop activity
    await ActivityLogger.log('timer', activeTimer.id, 'stopped', userId, {
      totalDuration: totalDuration,
      pausedDuration: activeTimer.total_paused_duration || 0,
      timeEntryId: timeEntryId,
      taskId: activeTimer.task_id,
      workspaceId: workspaceId
    });

    // Delete active timer
    await db.run(`DELETE FROM active_timers WHERE user_id = ?`, [userId]);

    // Get the created time entry with task and category info
    const timeEntry = await db.get(`
      SELECT 
        te.*, 
        kt.title as task_title,
        tc.name as category_name,
        tc.color as category_color
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE te.id = ?
    `, [timeEntryId]);

    console.log(`Time entry created: ${timeEntry.id} with category: ${timeEntry.category_name}`);

    res.json({
      message: 'Timer stopped and time entry created',
      timeEntry: {
        id: timeEntry.id,
        taskId: timeEntry.task_id,
        taskTitle: timeEntry.task_title,
        categoryId: timeEntry.category_id,
        categoryName: timeEntry.category_name,
        startTime: timeEntry.start_time,
        endTime: timeEntry.end_time,
        duration: timeEntry.duration_seconds,
        description: timeEntry.description,
        isBreak: timeEntry.is_break,
        sessionSummary: {
          totalDuration: totalDuration,
          pausedDuration: activeTimer.total_paused_duration || 0,
          activeDuration: totalDuration
        }
      }
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// GET /api/time-tracker/status - Get current timer status
router.get('/status', async (req, res) => {
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

    // Get active timer with task, workflow, and category info
    const activeTimer = await db.get(`
      SELECT 
        at.*,
        kt.title as task_title,
        kt.description as task_description,
        kt.priority as task_priority,
        wf.name as workflow_name,
        c.name as client_name
      FROM active_timers at
      LEFT JOIN kanban_tasks kt ON at.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      WHERE at.user_id = ? AND at.workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.json({
        hasActiveTimer: false,
        timer: null
      });
    }

    // Calculate current duration and pause info
    const startTime = new Date(activeTimer.start_time);
    const now = new Date();
    const totalDuration = Math.floor((now - startTime) / 1000);
    
    let currentPauseDuration = 0;
    if (activeTimer.last_pause_time) {
      const pauseStart = new Date(activeTimer.last_pause_time);
      currentPauseDuration = Math.floor((now - pauseStart) / 1000);
    }
    
    const totalPausedDuration = (activeTimer.total_paused_duration || 0) + currentPauseDuration;
    const activeDuration = Math.max(0, totalDuration - totalPausedDuration);

    res.json({
      hasActiveTimer: true,
      timer: {
        id: activeTimer.id,
        taskId: activeTimer.task_id,
        taskTitle: activeTimer.task_title,
        taskPriority: activeTimer.task_priority,
        workflowName: activeTimer.workflow_name,
        clientName: activeTimer.client_name,
        startTime: activeTimer.start_time,
        description: activeTimer.description,
        isBreak: activeTimer.is_break,
        elapsedSeconds: activeDuration,
        totalPausedDuration: totalPausedDuration,
        isPaused: activeTimer.last_pause_time !== null,
        pauseReason: activeTimer.pause_reason,
        pausedAt: activeTimer.last_pause_time,
        currentPauseDuration: currentPauseDuration,
        createdAt: activeTimer.created_at
      }
    });
  } catch (error) {
    console.error('Error getting timer status:', error);
    res.status(500).json({ error: 'Failed to get timer status' });
  }
});

module.exports = router;