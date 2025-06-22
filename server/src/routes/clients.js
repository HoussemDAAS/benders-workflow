const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Client = require('../models/Client');
const router = express.Router();
const { getDatabase } = require('../config/database');

// Validation middleware
const validateClient = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('company').optional().trim(),
  body('phone').optional().trim(),
];

// GET /api/clients - Get all clients
router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    
    let query = `
      SELECT 
        id, name, company, email, phone, 
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM clients
    `;
    
    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const db = getDatabase();
    const clients = await db.all(query);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    const client = await db.get(`
      SELECT 
        id, name, company, email, phone, 
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM clients 
      WHERE id = ?
    `, [id]);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// GET /api/clients/:id/workflows - Get client workflows
router.get('/:id/workflows', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    const workflows = await db.all(`
      SELECT 
        id, name, description, 
        client_id as clientId, 
        status, 
        created_at as createdAt, 
        updated_at as updatedAt,
        start_date as startDate,
        expected_end_date as expectedEndDate,
        actual_end_date as actualEndDate
      FROM workflows 
      WHERE client_id = ? 
      ORDER BY created_at DESC
    `, [id]);
    
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching client workflows:', error);
    res.status(500).json({ error: 'Failed to fetch client workflows' });
  }
});

// GET /api/clients/:id/meetings - Get client meetings
router.get('/:id/meetings', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    const meetings = await db.all(`
      SELECT 
        id, 
        client_id as clientId,
        title, 
        description,
        meeting_date as meetingDate,
        duration_minutes as durationMinutes,
        location,
        meeting_type as meetingType,
        status,
        notes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM client_meetings 
      WHERE client_id = ? 
      ORDER BY meeting_date DESC
    `, [id]);
    
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching client meetings:', error);
    res.status(500).json({ error: 'Failed to fetch client meetings' });
  }
});

// GET /api/clients/:id/tasks - Get client tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    const tasks = await db.all(`
      SELECT 
        kt.id,
        kt.title,
        kt.description,
        kt.workflow_id as workflowId,
        kt.step_id as stepId,
        kt.priority,
        kt.status,
        kt.tags,
        kt.due_date as dueDate,
        kt.created_at as createdAt,
        kt.updated_at as updatedAt
      FROM kanban_tasks kt
      INNER JOIN workflows w ON kt.workflow_id = w.id
      WHERE w.client_id = ?
      ORDER BY kt.created_at DESC
    `, [id]);
    
    // Get assigned members for each task
    for (const task of tasks) {
      const assignments = await db.all(`
        SELECT member_id as memberId FROM task_assignments WHERE task_id = ?
      `, [task.id]);
      
      task.assignedMembers = assignments.map(a => a.memberId);
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching client tasks:', error);
    res.status(500).json({ error: 'Failed to fetch client tasks' });
  }
});

// POST /api/clients - Create new client
router.post('/', async (req, res) => {
  try {
    const { name, company, email, phone, isActive = true } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const clientId = crypto.randomUUID();
    
    const db = getDatabase();
    
    // Insert client
    await db.run(`
      INSERT INTO clients (id, name, company, email, phone, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [clientId, name, company || '', email, phone || null, isActive ? 1 : 0]);
    
    // Get the created client
    const client = await db.get(`
      SELECT 
        id, name, company, email, phone, 
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM clients 
      WHERE id = ?
    `, [clientId]);
    
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, email, phone, isActive } = req.body;
    
    const db = getDatabase();
    const result = await db.run(`
      UPDATE clients 
      SET name = ?, company = ?, email = ?, phone = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, company || '', email, phone || null, isActive ? 1 : 0, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Get the updated client
    const client = await db.get(`
      SELECT 
        id, name, company, email, phone, 
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM clients 
      WHERE id = ?
    `, [id]);
    
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// PATCH /api/clients/:id/status - Update client status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const db = getDatabase();
    const result = await db.run(`
      UPDATE clients 
      SET is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [isActive ? 1 : 0, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Get the updated client
    const client = await db.get(`
      SELECT 
        id, name, company, email, phone, 
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM clients 
      WHERE id = ?
    `, [id]);
    
    res.json(client);
  } catch (error) {
    console.error('Error updating client status:', error);
    res.status(500).json({ error: 'Failed to update client status' });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    // Check if client exists
    const client = await db.get('SELECT id FROM clients WHERE id = ?', [id]);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Start transaction to delete all related data
    await db.beginTransaction();
    
    try {
      // Delete task assignments for tasks in client workflows
      await db.run(`
        DELETE FROM task_assignments 
        WHERE task_id IN (
          SELECT kt.id FROM kanban_tasks kt
          INNER JOIN workflows w ON kt.workflow_id = w.id
          WHERE w.client_id = ?
        )
      `, [id]);
      
      // Delete tasks in client workflows
      await db.run(`
        DELETE FROM kanban_tasks 
        WHERE workflow_id IN (
          SELECT id FROM workflows WHERE client_id = ?
        )
      `, [id]);
      
      // Delete workflow connections for client workflows
      await db.run(`
        DELETE FROM workflow_connections 
        WHERE workflow_id IN (
          SELECT id FROM workflows WHERE client_id = ?
        )
      `, [id]);
      
      // Delete workflow steps for client workflows
      await db.run(`
        DELETE FROM workflow_steps 
        WHERE workflow_id IN (
          SELECT id FROM workflows WHERE client_id = ?
        )
      `, [id]);
      
      // Delete workflows for this client
      await db.run('DELETE FROM workflows WHERE client_id = ?', [id]);
      
      // Delete client meetings
      await db.run('DELETE FROM client_meetings WHERE client_id = ?', [id]);
      
      // Delete activity logs for this client
      await db.run('DELETE FROM activity_log WHERE entity_id = ?', [id]);
      
      // Finally delete the client
      await db.run('DELETE FROM clients WHERE id = ?', [id]);
      
      await db.commit();
      res.status(204).send();
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router; 