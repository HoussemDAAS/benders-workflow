const express = require('express');
const { body, validationResult } = require('express-validator');
const KanbanTask = require('../models/KanbanTask');
const TaskResource = require('../models/TaskResource');
const Workflow = require('../models/Workflow');
const Client = require('../models/Client');
const { authenticate } = require('../middleware/auth');
const { requireWorkspace } = require('../middleware/workspace');
const { getDatabase } = require('../config/database');
const router = express.Router();
const ActivityLogger = require('../models/ActivityLogger');

// Validation middleware
const validateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status').notEmpty().withMessage('Status is required'),
  body('description').optional().trim(),
  body('workflowId').optional(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601(),
  body('clientId').optional(), // Add clientId for auto-workflow creation
];

// Helper function to create auto workflow for client
async function createAutoWorkflow(clientId, taskTitle) {
  try {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Check if client already has an active workflow
    const existingWorkflows = await Workflow.findByClientId(clientId);
    const activeWorkflow = existingWorkflows.find(w => w.status === 'active');
    
    if (activeWorkflow) {
      return activeWorkflow;
    }

    // Create new workflow for client
    const workflow = new Workflow({
      name: `${client.company || client.name} - Project Workflow`,
      description: `Auto-generated workflow for ${client.company || client.name} based on task: ${taskTitle}`,
      clientId: clientId,
      status: 'active',
      startDate: new Date(),
      expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    });

    await workflow.save();
    return workflow;
  } catch (error) {
    console.error('Error creating auto workflow:', error);
    throw error;
  }
}

// GET /api/tasks - Get all tasks (optionally filtered by workflow)
router.get('/', async (req, res) => {
  try {
    const { status, workflowId, overdue, priority, clientId } = req.query;
    
    let tasks;
    if (overdue === 'true') {
      tasks = await KanbanTask.findOverdue();
    } else if (status) {
      tasks = await KanbanTask.findByStatus(status);
    } else if (workflowId) {
      tasks = await KanbanTask.findByWorkflowId(workflowId);
    } else {
      tasks = await KanbanTask.findAll();
    }
    
    // Filter by priority if specified
    if (priority) {
      tasks = tasks.filter(task => task.priority === priority);
    }

    // Filter by client if specified
    if (clientId) {
      const clientWorkflows = await Workflow.findByClientId(clientId);
      const workflowIds = clientWorkflows.map(w => w.id);
      tasks = tasks.filter(task => workflowIds.includes(task.workflowId));
    }
    
    // Add assigned members to each task
    const tasksWithMembers = await Promise.all(
      tasks.map(async (task) => {
        const assignedMembers = await task.getAssignedMembers();
        return {
          ...task.toJSON(),
          assignedMembers: assignedMembers.map(member => member.id) || []
        };
      })
    );
    
    res.json(tasksWithMembers);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/by-workflow/:workflowId - Get tasks for specific workflow
router.get('/by-workflow/:workflowId', async (req, res) => {
  try {
    const tasks = await KanbanTask.findByWorkflowId(req.params.workflowId);
    
    // Add assigned members to each task
    const tasksWithMembers = await Promise.all(
      tasks.map(async (task) => {
        const assignedMembers = await task.getAssignedMembers();
        return {
          ...task.toJSON(),
          assignedMembers: assignedMembers.map(member => member.id) || []
        };
      })
    );
    
    res.json(tasksWithMembers);
  } catch (error) {
    console.error('Error fetching workflow tasks:', error);
    res.status(500).json({ error: 'Failed to fetch workflow tasks' });
  }
});

// GET /api/tasks/by-client/:clientId - Get tasks for specific client (across all their workflows)
router.get('/by-client/:clientId', async (req, res) => {
  try {
    const clientWorkflows = await Workflow.findByClientId(req.params.clientId);
    const workflowIds = clientWorkflows.map(w => w.id);
    
    let allTasks = [];
    for (const workflowId of workflowIds) {
      const tasks = await KanbanTask.findByWorkflowId(workflowId);
      allTasks = allTasks.concat(tasks);
    }
    
    // Add assigned members to each task
    const tasksWithMembers = await Promise.all(
      allTasks.map(async (task) => {
        const assignedMembers = await task.getAssignedMembers();
        return {
          ...task.toJSON(),
          assignedMembers: assignedMembers.map(member => member.id) || []
        };
      })
    );
    
    res.json(tasksWithMembers);
  } catch (error) {
    console.error('Error fetching client tasks:', error);
    res.status(500).json({ error: 'Failed to fetch client tasks' });
  }
});

// GET /api/tasks/columns - Get kanban columns for workspace
router.get('/columns', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    // Remove workspace filtering since kanban_columns doesn't have workspace_id column
    const columns = await db.all('SELECT * FROM kanban_columns ORDER BY order_index');
    res.json(columns);
  } catch (error) {
    console.error('Error fetching kanban columns:', error);
    res.status(500).json({ error: 'Failed to fetch kanban columns' });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Add assigned members to the task
    const assignedMembers = await task.getAssignedMembers();
    const taskWithMembers = {
      ...task.toJSON(),
      assignedMembers: assignedMembers.map(member => member.id) || []
    };
    
    res.json(taskWithMembers);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// GET /api/tasks/:id/assigned-members - Get task assigned members
router.get('/:id/assigned-members', async (req, res) => {
  try {
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const members = await task.getAssignedMembers();
    res.json(members);
  } catch (error) {
    console.error('Error fetching task assigned members:', error);
    res.status(500).json({ error: 'Failed to fetch task assigned members' });
  }
});

// POST /api/tasks - Create new task (with auto-workflow creation)
router.post('/', validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let workflowId = req.body.workflowId;
    
    // Auto-create workflow if clientId provided but no workflowId
    if (!workflowId && req.body.clientId) {
      const autoWorkflow = await createAutoWorkflow(req.body.clientId, req.body.title);
      workflowId = autoWorkflow.id;
    }

    if (!workflowId) {
      return res.status(400).json({ error: 'Either workflowId or clientId must be provided' });
    }

    const task = new KanbanTask({
      title: req.body.title,
      description: req.body.description,
      workflowId: workflowId,
      priority: req.body.priority || 'medium',
      status: req.body.status,
      tags: req.body.tags || [],
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null
    });

    await task.save(req.body.performedBy);
    
    // Assign members if provided
    if (req.body.assignedMembers && Array.isArray(req.body.assignedMembers)) {
      for (const memberId of req.body.assignedMembers) {
        await task.assignMember(memberId);
      }
    }
    
    // Return task with assigned members
    const assignedMembers = await task.getAssignedMembers();
    const taskWithMembers = {
      ...task.toJSON(),
      assignedMembers: assignedMembers.map(member => member.id) || []
    };
    
    res.status(201).json(taskWithMembers);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// POST /api/tasks/:id/assign - Assign member to task
router.post('/:id/assign', async (req, res) => {
  try {
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    const assignmentId = await task.assignMember(memberId);
    res.status(201).json({ id: assignmentId, memberId });
  } catch (error) {
    console.error('Error assigning task member:', error);
    res.status(500).json({ error: 'Failed to assign task member' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.title = req.body.title;
    task.description = req.body.description;
    task.workflowId = req.body.workflowId || task.workflowId;
    task.priority = req.body.priority || task.priority;
    task.status = req.body.status;
    task.tags = req.body.tags || task.tags;
    task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate;

    await task.save(req.body.performedBy);
    
    // Return task with assigned members
    const assignedMembers = await task.getAssignedMembers();
    const taskWithMembers = {
      ...task.toJSON(),
      assignedMembers: assignedMembers.map(member => member.id) || []
    };
    
    res.json(taskWithMembers);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/move - Move task to different status
router.patch('/:id/move', async (req, res) => {
  try {
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await task.moveToStatus(status, req.body.performedBy);
    
    // Return task with assigned members
    const assignedMembers = await task.getAssignedMembers();
    const taskWithMembers = {
      ...task.toJSON(),
      assignedMembers: assignedMembers.map(member => member.id) || []
    };
    
    res.json(taskWithMembers);
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

// PATCH /api/tasks/:id/priority - Update task priority
router.patch('/:id/priority', async (req, res) => {
  try {
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { priority } = req.body;
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    task.priority = priority;
    await task.save(req.body.performedBy);
    res.json(task);
  } catch (error) {
    console.error('Error updating task priority:', error);
    res.status(500).json({ error: 'Failed to update task priority' });
  }
});

// POST /api/tasks/columns - Create new kanban column
router.post('/columns', async (req, res) => {
  try {
    const { id, title, color, orderIndex } = req.body;
    
    if (!id || !title) {
      return res.status(400).json({ error: 'ID and title are required' });
    }

    const db = getDatabase();
    await db.run(`
      INSERT INTO kanban_columns (id, title, color, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      title,
      color || '#64748b',
      orderIndex || 99,
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    res.status(201).json({ id, title, color: color || '#64748b', orderIndex: orderIndex || 99 });
  } catch (error) {
    console.error('Error creating kanban column:', error);
    res.status(500).json({ error: 'Failed to create kanban column' });
  }
});

// PUT /api/tasks/columns/:id - Update kanban column
router.put('/columns/:id', async (req, res) => {
  try {
    const { title, color, orderIndex } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const db = getDatabase();
    const result = await db.run(`
      UPDATE kanban_columns 
      SET title = ?, color = ?, order_index = ?, updated_at = ?
      WHERE id = ?
    `, [title, color, orderIndex, new Date().toISOString(), req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }

    res.json({ id: req.params.id, title, color, orderIndex });
  } catch (error) {
    console.error('Error updating kanban column:', error);
    res.status(500).json({ error: 'Failed to update kanban column' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.delete(req.body.performedBy);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// DELETE /api/tasks/:id/assign/:memberId - Unassign member from task
router.delete('/:id/assign/:memberId', async (req, res) => {
  try {
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.unassignMember(req.params.memberId);
    res.status(204).send();
  } catch (error) {
    console.error('Error unassigning task member:', error);
    res.status(500).json({ error: 'Failed to unassign task member' });
  }
});

// DELETE /api/tasks/columns/:id - Delete kanban column
router.delete('/columns/:id', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Check if column has tasks
    const tasksCount = await db.get('SELECT COUNT(*) as count FROM kanban_tasks WHERE status = ?', [req.params.id]);
    if (tasksCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete column with tasks. Move tasks to another column first.' });
    }

    const result = await db.run('DELETE FROM kanban_columns WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting kanban column:', error);
    res.status(500).json({ error: 'Failed to delete kanban column' });
  }
});

// Legacy move-to-step endpoint removed
router.patch('/:id/move-to-step', (req, res) => res.status(410).json({ error: 'Workflow steps feature removed' }));

// =============================================================================
// TASK RESOURCES ENDPOINTS
// =============================================================================

// Validation middleware for resources
const validateResource = [
  body('type').isIn(['document', 'link', 'image', 'file']).withMessage('Invalid resource type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').optional().trim(),
  body('url').optional().trim(),
  body('fileName').optional().trim(),
  body('fileSize').optional().isInt({ min: 0 }),
  body('mimeType').optional().trim(),
];

// GET /api/tasks/:id/resources - Get all resources for a task
router.get('/:id/resources', async (req, res) => {
  try {
    // Verify task exists
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const resources = await TaskResource.findByTaskId(req.params.id);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching task resources:', error);
    res.status(500).json({ error: 'Failed to fetch task resources' });
  }
});

// POST /api/tasks/:id/resources - Create a new resource for a task
router.post('/:id/resources', validateResource, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify task exists
    const task = await KanbanTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const resource = new TaskResource({
      taskId: req.params.id,
      type: req.body.type,
      title: req.body.title,
      content: req.body.content,
      url: req.body.url,
      fileName: req.body.fileName,
      fileSize: req.body.fileSize,
      mimeType: req.body.mimeType
    });

    await resource.save(req.body.performedBy);
    res.status(201).json(resource.toJSON());
  } catch (error) {
    console.error('Error creating task resource:', error);
    res.status(500).json({ error: 'Failed to create task resource' });
  }
});

// GET /api/tasks/:taskId/resources/:resourceId - Get a specific resource
router.get('/:taskId/resources/:resourceId', async (req, res) => {
  try {
    const resource = await TaskResource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Verify resource belongs to the task
    if (resource.taskId !== req.params.taskId) {
      return res.status(404).json({ error: 'Resource not found for this task' });
    }

    res.json(resource.toJSON());
  } catch (error) {
    console.error('Error fetching task resource:', error);
    res.status(500).json({ error: 'Failed to fetch task resource' });
  }
});

// PUT /api/tasks/:taskId/resources/:resourceId - Update a resource
router.put('/:taskId/resources/:resourceId', validateResource, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const resource = await TaskResource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Verify resource belongs to the task
    if (resource.taskId !== req.params.taskId) {
      return res.status(404).json({ error: 'Resource not found for this task' });
    }

    // Update resource properties
    resource.type = req.body.type;
    resource.title = req.body.title;
    resource.content = req.body.content;
    resource.url = req.body.url;
    resource.fileName = req.body.fileName;
    resource.fileSize = req.body.fileSize;
    resource.mimeType = req.body.mimeType;

    await resource.save(req.body.performedBy);
    res.json(resource.toJSON());
  } catch (error) {
    console.error('Error updating task resource:', error);
    res.status(500).json({ error: 'Failed to update task resource' });
  }
});

// DELETE /api/tasks/:taskId/resources/:resourceId - Delete a resource
router.delete('/:taskId/resources/:resourceId', async (req, res) => {
  try {
    const resource = await TaskResource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Verify resource belongs to the task
    if (resource.taskId !== req.params.taskId) {
      return res.status(404).json({ error: 'Resource not found for this task' });
    }

    await resource.delete(req.body.performedBy);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task resource:', error);
    res.status(500).json({ error: 'Failed to delete task resource' });
  }
});

// =============================================================================
// SMART TASK SELECTION FOR TIME TRACKING
// =============================================================================

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

// GET /api/tasks/for-tracking - Get tasks optimized for time tracking selection
router.get('/for-tracking', async (req, res) => {
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
      status = 'active', 
      priority,
      recent_only = 'false',
      include_completed = 'false' 
    } = req.query;

    // Get recently tracked tasks first (last 30 days)
    const recentlyTrackedTasks = await db.all(`
      SELECT DISTINCT te.task_id
      FROM time_entries te
      WHERE te.user_id = ? AND te.workspace_id = ?
        AND te.task_id IS NOT NULL
        AND te.start_time >= datetime('now', '-30 days')
      ORDER BY te.start_time DESC
    `, [userId, workspaceId]);

    const recentTaskIds = recentlyTrackedTasks.map(row => row.task_id);

    // Build main query
    let query = `
      SELECT 
        kt.id,
        kt.title,
        kt.description,
        kt.priority,
        kt.status,
        kt.estimated_hours,
        kt.actual_hours,
        kt.due_date,
        kt.created_at,
        wf.id as workflow_id,
        wf.name as workflow_name,
        wf.status as workflow_status,
        c.id as client_id,
        c.name as client_name,
        c.company as client_company,
        -- Calculate total time spent on this task
        COALESCE(
          (SELECT SUM(te.duration_seconds) 
           FROM time_entries te 
           WHERE te.task_id = kt.id AND te.user_id = ?), 
          0
        ) as total_time_seconds,
        -- Get last time this task was tracked
        (SELECT MAX(te.start_time) 
         FROM time_entries te 
         WHERE te.task_id = kt.id AND te.user_id = ?) as last_tracked_at,
        -- Count of time entries for this task
        (SELECT COUNT(*) 
         FROM time_entries te 
         WHERE te.task_id = kt.id AND te.user_id = ?) as tracking_count
      FROM kanban_tasks kt
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      WHERE kt.workspace_id = ?
    `;

    const params = [userId, userId, userId, workspaceId];

    // Add filters
    if (status && status !== 'all') {
      query += ` AND kt.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND kt.priority = ?`;
      params.push(priority);
    }

    if (include_completed === 'false') {
      query += ` AND kt.status != 'done'`;
    }

    // Order by: recently tracked first, then by priority and due date
    query += `
      ORDER BY 
        CASE WHEN kt.id IN (${recentTaskIds.map(() => '?').join(',')}) THEN 0 ELSE 1 END,
        CASE kt.priority 
          WHEN 'high' THEN 0 
          WHEN 'medium' THEN 1 
          WHEN 'low' THEN 2 
          ELSE 3 
        END,
        CASE WHEN kt.due_date IS NOT NULL THEN 0 ELSE 1 END,
        kt.due_date ASC,
        kt.created_at DESC
    `;

    // Add recent task IDs to params for the IN clause
    params.push(...recentTaskIds);

    const tasks = await db.all(query, params);

    // If recent_only is true, limit to recently tracked + high priority
    let filteredTasks = tasks;
    if (recent_only === 'true') {
      filteredTasks = tasks.filter(task => 
        recentTaskIds.includes(task.id) || 
        task.priority === 'high' ||
        (task.due_date && new Date(task.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // Due within 7 days
      );
    }

    // Group by client and workflow
    const groupedTasks = {};

    filteredTasks.forEach(task => {
      const clientKey = task.client_id || 'no-client';
      const workflowKey = task.workflow_id || 'no-workflow';
      
      if (!groupedTasks[clientKey]) {
        groupedTasks[clientKey] = {
          client: {
            id: task.client_id,
            name: task.client_name || 'No Client',
            company: task.client_company
          },
          workflows: {}
        };
      }

      if (!groupedTasks[clientKey].workflows[workflowKey]) {
        groupedTasks[clientKey].workflows[workflowKey] = {
          workflow: {
            id: task.workflow_id,
            name: task.workflow_name || 'No Workflow',
            status: task.workflow_status
          },
          tasks: []
        };
      }

      // Calculate progress and time info
      const totalTimeHours = task.total_time_seconds / 3600;
      const estimatedHours = task.estimated_hours || 0;
      const progressPercentage = estimatedHours > 0 ? Math.min(100, Math.round((totalTimeHours / estimatedHours) * 100)) : 0;

      groupedTasks[clientKey].workflows[workflowKey].tasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        dueDate: task.due_date,
        totalTimeSpent: {
          seconds: task.total_time_seconds,
          hours: Math.round(totalTimeHours * 100) / 100,
          formatted: formatDuration(task.total_time_seconds)
        },
        lastTrackedAt: task.last_tracked_at,
        trackingCount: task.tracking_count,
        progress: {
          percentage: progressPercentage,
          isOvertime: totalTimeHours > estimatedHours && estimatedHours > 0
        },
        isRecentlyTracked: recentTaskIds.includes(task.id),
        urgency: calculateUrgency(task)
      });
    });

    // Convert to array format with totals
    const result = Object.values(groupedTasks).map(clientGroup => ({
      client: clientGroup.client,
      workflows: Object.values(clientGroup.workflows).map(workflowGroup => ({
        workflow: workflowGroup.workflow,
        tasks: workflowGroup.tasks,
        totalTasks: workflowGroup.tasks.length,
        totalTimeSpent: workflowGroup.tasks.reduce((sum, task) => sum + task.totalTimeSpent.hours, 0)
      })),
      totalTasks: Object.values(clientGroup.workflows).reduce((sum, wf) => sum + wf.tasks.length, 0)
    }));

    // Add summary statistics
    const summary = {
      totalTasks: filteredTasks.length,
      recentlyTrackedTasks: filteredTasks.filter(task => recentTaskIds.includes(task.id)).length,
      highPriorityTasks: filteredTasks.filter(task => task.priority === 'high').length,
      overdueTasks: filteredTasks.filter(task => task.due_date && new Date(task.due_date) < new Date()).length,
      totalClients: Object.keys(groupedTasks).length,
      totalWorkflows: Object.values(groupedTasks).reduce((sum, client) => sum + Object.keys(client.workflows).length, 0)
    };

    res.json({
      tasks: result,
      summary,
      meta: {
        workspaceId,
        userId,
        filters: { status, priority, recent_only, include_completed },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching tasks for tracking:', error);
    res.status(500).json({ error: 'Failed to fetch tasks for tracking' });
  }
});

// GET /api/tasks/recent-tracking - Get recently tracked tasks for quick start
router.get('/recent-tracking', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    let workspaceId;
    try {
      workspaceId = await getUserWorkspaceId(req);
    } catch (error) {
      return res.status(400).json({ error: 'No accessible workspace found. Please select a workspace first.' });
    }

    const { limit = 10 } = req.query;

    const recentTasks = await db.all(`
      SELECT DISTINCT
        kt.id,
        kt.title,
        kt.priority,
        kt.status,
        wf.name as workflow_name,
        c.name as client_name,
        MAX(te.start_time) as last_tracked_at,
        COUNT(te.id) as session_count,
        SUM(te.duration_seconds) as total_seconds,
        AVG(te.duration_seconds) as avg_session_seconds
      FROM time_entries te
      JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN workflows wf ON kt.workflow_id = wf.id
      LEFT JOIN clients c ON wf.client_id = c.id
      WHERE te.user_id = ? AND te.workspace_id = ?
        AND te.start_time >= datetime('now', '-14 days')
      GROUP BY kt.id
      ORDER BY MAX(te.start_time) DESC
      LIMIT ?
    `, [userId, workspaceId, parseInt(limit)]);

    const formattedTasks = recentTasks.map(task => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      workflowName: task.workflow_name,
      clientName: task.client_name,
      lastTrackedAt: task.last_tracked_at,
      sessionCount: task.session_count,
      totalTime: {
        seconds: task.total_seconds,
        formatted: formatDuration(task.total_seconds)
      },
      averageSession: {
        seconds: task.avg_session_seconds,
        formatted: formatDuration(task.avg_session_seconds)
      }
    }));

    res.json(formattedTasks);

  } catch (error) {
    console.error('Error fetching recent tracking:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracking data' });
  }
});

// Helper functions
function formatDuration(seconds) {
  if (!seconds) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

function calculateUrgency(task) {
  let urgencyScore = 0;
  
  // Priority weight
  const priorityWeights = { high: 3, medium: 2, low: 1 };
  urgencyScore += priorityWeights[task.priority] || 0;
  
  // Due date weight
  if (task.due_date) {
    const daysUntilDue = Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) urgencyScore += 5; // Overdue
    else if (daysUntilDue <= 1) urgencyScore += 4; // Due today/tomorrow
    else if (daysUntilDue <= 3) urgencyScore += 3; // Due this week
    else if (daysUntilDue <= 7) urgencyScore += 2; // Due next week
  }
  
  // Status weight
  if (task.status === 'in-progress') urgencyScore += 2;
  else if (task.status === 'review') urgencyScore += 1;
  
  if (urgencyScore >= 7) return 'critical';
  if (urgencyScore >= 5) return 'high';
  if (urgencyScore >= 3) return 'medium';
  return 'low';
}

module.exports = router;