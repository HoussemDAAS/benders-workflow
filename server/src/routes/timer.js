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
// ACTIVE TIMER MANAGEMENT ENDPOINTS
// ===============================

// GET /api/timer - Get current active timer for user
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

    // Get active timer with task, workflow, and category info
    const activeTimer = await db.get(`
      SELECT 
        at.*,
        kt.title as task_title,
        kt.description as task_description,
        kt.priority as task_priority,
        wf.name as workflow_name,
        c.name as client_name,
        tc.name as category_name,
        tc.color as category_color,
        tc.is_billable as category_billable
      FROM active_timers at
      LEFT JOIN kanban_tasks kt ON at.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      LEFT JOIN time_categories tc ON at.category_id = tc.id
      WHERE at.user_id = ? AND at.workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.json({
        isActive: false,
        activeTimer: null
      });
    }

    // Calculate current duration
    const startTime = new Date(activeTimer.start_time);
    const now = new Date();
    const currentDuration = Math.floor((now - startTime) / 1000);

    res.json({
      isActive: true,
      activeTimer: {
        id: activeTimer.id,
        taskId: activeTimer.task_id,
        taskTitle: activeTimer.task_title,
        taskPriority: activeTimer.task_priority,
        workflowName: activeTimer.workflow_name,
        clientName: activeTimer.client_name,
        categoryId: activeTimer.category_id,
        categoryName: activeTimer.category_name,
        categoryColor: activeTimer.category_color,
        categoryBillable: activeTimer.category_billable,
        startTime: activeTimer.start_time,
        description: activeTimer.description,
        isBreak: activeTimer.is_break,
        status: activeTimer.status,
        currentDuration,
        createdAt: activeTimer.created_at
      }
    });
  } catch (error) {
    console.error('Error getting active timer:', error);
    res.status(500).json({ error: 'Failed to get active timer' });
  }
});

// POST /api/timer/start - Start a new timer
router.post('/start', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    const {
      taskId,
      categoryId,
      description,
      isBreak = false
    } = req.body;

    // Get user's workspace ID
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    // Check if user already has an active timer
    const existingTimer = await db.get(`
      SELECT id FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (existingTimer) {
      return res.status(400).json({ 
        error: 'Timer already active. Stop current timer before starting a new one.',
        activeTimerId: existingTimer.id
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

    // Validate category exists if provided
    if (categoryId) {
      const category = await db.get(`
        SELECT id FROM time_categories WHERE id = ? AND workspace_id = ?
      `, [categoryId, workspaceId]);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    // Create active timer
    const timerId = uuidv4();
    const startTime = new Date().toISOString();

    await db.run(`
      INSERT INTO active_timers (
        id, user_id, workspace_id, task_id, category_id, start_time,
        description, is_break, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      timerId, userId, workspaceId, taskId, categoryId, startTime,
      description, isBreak, 'running'
    ]);

    // Get the created timer with related data
    const newTimer = await db.get(`
      SELECT 
        at.*,
        kt.title as task_title,
        kt.priority as task_priority,
        wf.name as workflow_name,
        c.name as client_name,
        tc.name as category_name,
        tc.color as category_color
      FROM active_timers at
      LEFT JOIN kanban_tasks kt ON at.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      LEFT JOIN time_categories tc ON at.category_id = tc.id
      WHERE at.id = ?
    `, [timerId]);

    res.status(201).json({
      message: 'Timer started successfully',
      activeTimer: {
        id: newTimer.id,
        taskId: newTimer.task_id,
        taskTitle: newTimer.task_title,
        taskPriority: newTimer.task_priority,
        workflowName: newTimer.workflow_name,
        clientName: newTimer.client_name,
        categoryId: newTimer.category_id,
        categoryName: newTimer.category_name,
        categoryColor: newTimer.category_color,
        startTime: newTimer.start_time,
        description: newTimer.description,
        isBreak: newTimer.is_break,
        status: newTimer.status,
        currentDuration: 0
      }
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// POST /api/timer/pause - Pause current timer
router.post('/pause', async (req, res) => {
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

    // Get current active timer
    const activeTimer = await db.get(`
      SELECT * FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    if (activeTimer.status === 'paused') {
      return res.status(400).json({ error: 'Timer is already paused' });
    }

    // Update timer status to paused
    await db.run(`
      UPDATE active_timers 
      SET status = 'paused', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [activeTimer.id]);

    // Calculate current duration
    const startTime = new Date(activeTimer.start_time);
    const now = new Date();
    const currentDuration = Math.floor((now - startTime) / 1000);

    res.json({
      message: 'Timer paused successfully',
      activeTimer: {
        id: activeTimer.id,
        status: 'paused',
        currentDuration
      }
    });
  } catch (error) {
    console.error('Error pausing timer:', error);
    res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// POST /api/timer/resume - Resume paused timer
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

    // Get current active timer
    const activeTimer = await db.get(`
      SELECT * FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    if (activeTimer.status === 'running') {
      return res.status(400).json({ error: 'Timer is already running' });
    }

    // Update timer status to running
    await db.run(`
      UPDATE active_timers 
      SET status = 'running', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [activeTimer.id]);

    res.json({
      message: 'Timer resumed successfully',
      activeTimer: {
        id: activeTimer.id,
        status: 'running'
      }
    });
  } catch (error) {
    console.error('Error resuming timer:', error);
    res.status(500).json({ error: 'Failed to resume timer' });
  }
});

// POST /api/timer/stop - Stop current timer and create time entry
router.post('/stop', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    const { description: finalDescription } = req.body;

    // Get user's workspace ID
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    // Get current active timer
    const activeTimer = await db.get(`
      SELECT * FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    // Calculate final duration
    const startTime = new Date(activeTimer.start_time);
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / 1000);

    if (duration < 1) {
      return res.status(400).json({ 
        error: 'Timer must run for at least 1 second before stopping' 
      });
    }

    // Create time entry
    const timeEntryId = uuidv4();
    await db.run(`
      INSERT INTO time_entries (
        id, user_id, workspace_id, task_id, category_id, start_time, end_time,
        duration_seconds, status, description, is_break
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      timeEntryId, userId, workspaceId, activeTimer.task_id, activeTimer.category_id,
      activeTimer.start_time, endTime.toISOString(), duration, 'completed',
      finalDescription || activeTimer.description, activeTimer.is_break
    ]);

    // Delete active timer
    await db.run(`
      DELETE FROM active_timers WHERE id = ?
    `, [activeTimer.id]);

    // Get the created time entry with related data including workflow and client
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
      WHERE te.id = ?
    `, [timeEntryId]);

    res.json({
      message: 'Timer stopped successfully',
      timeEntry: {
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
        isBreak: timeEntry.is_break,
        status: timeEntry.status
      },
      summary: {
        durationMinutes: Math.round(duration / 60),
        durationHours: Math.round(duration / 36) / 100
      }
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// DELETE /api/timer - Cancel/delete current timer without creating time entry
router.delete('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const workspaceId = req.user.workspaceId || 'default-workspace';

    // Get current active timer
    const activeTimer = await db.get(`
      SELECT * FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    // Delete active timer without creating time entry
    await db.run(`
      DELETE FROM active_timers WHERE id = ?
    `, [activeTimer.id]);

    res.json({ 
      message: 'Timer cancelled successfully',
      cancelledTimer: {
        id: activeTimer.id,
        startTime: activeTimer.start_time,
        taskId: activeTimer.task_id
      }
    });
  } catch (error) {
    console.error('Error cancelling timer:', error);
    res.status(500).json({ error: 'Failed to cancel timer' });
  }
});

// GET /api/timer/categories - Get time tracking categories
router.get('/categories', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get user's workspace ID  
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    const categories = await db.all(`
      SELECT * FROM time_categories 
      WHERE workspace_id = ? 
      ORDER BY name ASC
    `, [workspaceId]);

    res.json({
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        color: category.color,
        isBillable: category.is_billable,
        isDefault: category.is_default
      }))
    });
  } catch (error) {
    console.error('Error fetching time categories:', error);
    res.status(500).json({ error: 'Failed to fetch time categories' });
  }
});

// POST /api/timer/categories - Create new time category
router.post('/categories', async (req, res) => {
  try {
    const db = getDatabase();
    const workspaceId = req.user.workspaceId || 'default-workspace';
    
    const { name, color = '#64748b', isBillable = false } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category with same name already exists
    const existingCategory = await db.get(`
      SELECT id FROM time_categories WHERE name = ? AND workspace_id = ?
    `, [name.trim(), workspaceId]);

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    // Create new category
    const categoryId = uuidv4();
    await db.run(`
      INSERT INTO time_categories (id, workspace_id, name, color, is_billable, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [categoryId, workspaceId, name.trim(), color, isBillable, false]);

    res.status(201).json({
      message: 'Time category created successfully',
      category: {
        id: categoryId,
        name: name.trim(),
        color,
        isBillable,
        isDefault: false
      }
    });
  } catch (error) {
    console.error('Error creating time category:', error);
    res.status(500).json({ error: 'Failed to create time category' });
  }
});

module.exports = router;