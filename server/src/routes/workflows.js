const express = require('express');
const { body, validationResult } = require('express-validator');
const Workflow = require('../models/Workflow');
const WorkflowStep = require('../models/WorkflowStep');
const router = express.Router();

// Validation middleware
const validateWorkflow = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'paused', 'completed', 'cancelled']),
];

const validateStep = [
  body('name').trim().notEmpty().withMessage('Step name is required'),
  body('type').isIn(['start-end', 'process', 'decision', 'input-output']).withMessage('Valid step type is required'),
  body('description').optional().trim(),
];

// GET /api/workflows - Get all workflows
router.get('/', async (req, res) => {
  try {
    const { status, clientId } = req.query;
    
    let workflows;
    if (status) {
      workflows = await Workflow.findByStatus(status);
    } else if (clientId) {
      workflows = await Workflow.findByClientId(clientId);
    } else {
      workflows = await Workflow.findAll();
    }
    
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// GET /api/workflows/:id - Get workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// GET /api/workflows/:id/steps - Get workflow steps
router.get('/:id/steps', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const steps = await workflow.getSteps();
    res.json(steps);
  } catch (error) {
    console.error('Error fetching workflow steps:', error);
    res.status(500).json({ error: 'Failed to fetch workflow steps' });
  }
});

// GET /api/workflows/:id/connections - Get workflow connections
router.get('/:id/connections', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const connections = await workflow.getConnections();
    res.json(connections);
  } catch (error) {
    console.error('Error fetching workflow connections:', error);
    res.status(500).json({ error: 'Failed to fetch workflow connections' });
  }
});

// GET /api/workflows/:id/progress - Get workflow progress
router.get('/:id/progress', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const progress = await workflow.getProgress();
    res.json(progress);
  } catch (error) {
    console.error('Error fetching workflow progress:', error);
    res.status(500).json({ error: 'Failed to fetch workflow progress' });
  }
});

// POST /api/workflows - Create new workflow
router.post('/', validateWorkflow, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workflow = new Workflow({
      name: req.body.name,
      description: req.body.description,
      clientId: req.body.clientId,
      status: req.body.status || 'active',
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      expectedEndDate: req.body.expectedEndDate ? new Date(req.body.expectedEndDate) : null
    });

    await workflow.save(req.body.performedBy);
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// POST /api/workflows/:id/steps - Add step to workflow
router.post('/:id/steps', validateStep, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const step = new WorkflowStep({
      workflowId: workflow.id,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      status: req.body.status || 'pending',
      positionX: req.body.positionX || 0,
      positionY: req.body.positionY || 0
    });

    await step.save(req.body.performedBy);
    res.status(201).json(step);
  } catch (error) {
    console.error('Error creating workflow step:', error);
    res.status(500).json({ error: 'Failed to create workflow step' });
  }
});

// POST /api/workflows/:id/connections - Add connection between steps
router.post('/:id/connections', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { sourceStepId, targetStepId } = req.body;
    if (!sourceStepId || !targetStepId) {
      return res.status(400).json({ error: 'Source and target step IDs are required' });
    }

    const connectionId = await workflow.addConnection(sourceStepId, targetStepId);
    res.status(201).json({ id: connectionId, sourceStepId, targetStepId });
  } catch (error) {
    console.error('Error creating workflow connection:', error);
    res.status(500).json({ error: 'Failed to create workflow connection' });
  }
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', validateWorkflow, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.name = req.body.name;
    workflow.description = req.body.description;
    workflow.clientId = req.body.clientId;
    workflow.status = req.body.status || workflow.status;
    workflow.startDate = req.body.startDate ? new Date(req.body.startDate) : workflow.startDate;
    workflow.expectedEndDate = req.body.expectedEndDate ? new Date(req.body.expectedEndDate) : workflow.expectedEndDate;
    workflow.actualEndDate = req.body.actualEndDate ? new Date(req.body.actualEndDate) : workflow.actualEndDate;

    await workflow.save(req.body.performedBy);
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// PATCH /api/workflows/:id/status - Update workflow status
router.patch('/:id/status', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { status } = req.body;
    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    workflow.status = status;
    if (status === 'completed') {
      workflow.actualEndDate = new Date();
    }

    await workflow.save(req.body.performedBy);
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow status:', error);
    res.status(500).json({ error: 'Failed to update workflow status' });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const { db } = require('../config/database');
    const { id } = req.params;
    
    // Check if workflow exists
    const workflow = db.prepare('SELECT id FROM workflows WHERE id = ?').get(id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    // Start transaction to delete all related data
    const deleteTransaction = db.transaction(() => {
      // Delete task assignments for tasks in this workflow
      db.prepare(`
        DELETE FROM task_assignments 
        WHERE taskId IN (
          SELECT id FROM kanban_tasks WHERE workflowId = ?
        )
      `).run(id);
      
      // Delete tasks in this workflow
      db.prepare('DELETE FROM kanban_tasks WHERE workflowId = ?').run(id);
      
      // Delete workflow connections
      db.prepare('DELETE FROM workflow_connections WHERE workflowId = ?').run(id);
      
      // Delete workflow steps
      db.prepare('DELETE FROM workflow_steps WHERE workflowId = ?').run(id);
      
      // Delete activity logs for this workflow
      db.prepare('DELETE FROM activity_logs WHERE workflowId = ?').run(id);
      
      // Finally delete the workflow
      db.prepare('DELETE FROM workflows WHERE id = ?').run(id);
    });
    
    deleteTransaction();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// DELETE /api/workflows/:id/connections/:connectionId - Delete connection
router.delete('/:id/connections/:connectionId', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await workflow.removeConnection(req.params.connectionId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow connection:', error);
    res.status(500).json({ error: 'Failed to delete workflow connection' });
  }
});

module.exports = router; 