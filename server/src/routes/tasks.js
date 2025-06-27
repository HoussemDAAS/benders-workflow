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

module.exports = router;