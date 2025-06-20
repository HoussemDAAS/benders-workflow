const express = require('express');
const { body, validationResult } = require('express-validator');
const Client = require('../models/Client');
const router = express.Router();

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
    const clients = await Client.findAll(includeInactive);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
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
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const workflows = await client.getWorkflows();
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching client workflows:', error);
    res.status(500).json({ error: 'Failed to fetch client workflows' });
  }
});

// GET /api/clients/:id/meetings - Get client meetings
router.get('/:id/meetings', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const meetings = await client.getMeetings();
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching client meetings:', error);
    res.status(500).json({ error: 'Failed to fetch client meetings' });
  }
});

// GET /api/clients/:id/tasks - Get client tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const tasks = await client.getTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching client tasks:', error);
    res.status(500).json({ error: 'Failed to fetch client tasks' });
  }
});

// POST /api/clients - Create new client
router.post('/', validateClient, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if email already exists
    const existingClient = await Client.findByEmail(req.body.email);
    if (existingClient) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const client = new Client({
      name: req.body.name,
      company: req.body.company,
      email: req.body.email,
      phone: req.body.phone,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });

    await client.save(req.body.performedBy);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', validateClient, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if email is being changed and if it already exists
    if (req.body.email !== client.email) {
      const existingClient = await Client.findByEmail(req.body.email);
      if (existingClient) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    client.name = req.body.name;
    client.company = req.body.company;
    client.email = req.body.email;
    client.phone = req.body.phone;
    if (req.body.isActive !== undefined) {
      client.isActive = req.body.isActive;
    }

    await client.save(req.body.performedBy);
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// PATCH /api/clients/:id/status - Update client status
router.patch('/:id/status', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    client.isActive = req.body.isActive;
    await client.save(req.body.performedBy);
    res.json(client);
  } catch (error) {
    console.error('Error updating client status:', error);
    res.status(500).json({ error: 'Failed to update client status' });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.delete(req.body.performedBy);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router; 