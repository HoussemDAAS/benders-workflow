/* TODO: Team routes temporarily commented out for user authentication implementation
 * Team members will be replaced with authenticated users
 */

/*
const express = require('express');
const { body, validationResult } = require('express-validator');
const TeamMember = require('../models/TeamMember');
const router = express.Router();

// Validation middleware
const validateTeamMember = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').trim().notEmpty().withMessage('Role is required'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
];

// GET /api/team - Get all team members
router.get('/', async (req, res) => {
  try {
    const { includeInactive, role } = req.query;
    
    let teamMembers;
    if (role) {
      teamMembers = await TeamMember.findByRole(role);
    } else {
      const includeInactiveFlag = includeInactive === 'true';
      teamMembers = await TeamMember.findAll(includeInactiveFlag);
    }
    
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// GET /api/team/:id - Get team member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error('Error fetching team member:', error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
});

// GET /api/team/:id/workload - Get team member workload
router.get('/:id/workload', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const workload = await member.getWorkload();
    res.json(workload);
  } catch (error) {
    console.error('Error fetching team member workload:', error);
    res.status(500).json({ error: 'Failed to fetch team member workload' });
  }
});

// GET /api/team/:id/assignments - Get team member assignments
router.get('/:id/assignments', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const [steps, tasks, meetings] = await Promise.all([
      member.getAssignedSteps(),
      member.getAssignedTasks(),
      member.getMeetings()
    ]);
    
    res.json({
      steps,
      tasks,
      meetings
    });
  } catch (error) {
    console.error('Error fetching team member assignments:', error);
    res.status(500).json({ error: 'Failed to fetch team member assignments' });
  }
});

// GET /api/team/:id/steps - Get team member assigned steps
router.get('/:id/steps', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const steps = await member.getAssignedSteps();
    res.json(steps);
  } catch (error) {
    console.error('Error fetching team member steps:', error);
    res.status(500).json({ error: 'Failed to fetch team member steps' });
  }
});

// GET /api/team/:id/tasks - Get team member assigned tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const tasks = await member.getAssignedTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching team member tasks:', error);
    res.status(500).json({ error: 'Failed to fetch team member tasks' });
  }
});

// GET /api/team/:id/meetings - Get team member meetings
router.get('/:id/meetings', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const meetings = await member.getMeetings();
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching team member meetings:', error);
    res.status(500).json({ error: 'Failed to fetch team member meetings' });
  }
});

// POST /api/team - Create new team member
router.post('/', validateTeamMember, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if email already exists
    const existingMember = await TeamMember.findByEmail(req.body.email);
    if (existingMember) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const member = new TeamMember({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      skills: req.body.skills || [],
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });

    await member.save(req.body.performedBy);
    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

// PUT /api/team/:id - Update team member
router.put('/:id', validateTeamMember, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Check if email is being changed and if it already exists
    if (req.body.email !== member.email) {
      const existingMember = await TeamMember.findByEmail(req.body.email);
      if (existingMember) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    member.name = req.body.name;
    member.email = req.body.email;
    member.role = req.body.role;
    member.skills = req.body.skills || member.skills;
    if (req.body.isActive !== undefined) {
      member.isActive = req.body.isActive;
    }

    await member.save(req.body.performedBy);
    res.json(member);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// PATCH /api/team/:id/status - Update team member status
router.patch('/:id/status', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    member.isActive = req.body.isActive;
    await member.save(req.body.performedBy);
    res.json(member);
  } catch (error) {
    console.error('Error updating team member status:', error);
    res.status(500).json({ error: 'Failed to update team member status' });
  }
});

// PATCH /api/team/:id/skills - Update team member skills
router.patch('/:id/skills', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array' });
    }

    member.skills = skills;
    await member.save(req.body.performedBy);
    res.json(member);
  } catch (error) {
    console.error('Error updating team member skills:', error);
    res.status(500).json({ error: 'Failed to update team member skills' });
  }
});

// DELETE /api/team/:id - Delete team member
router.delete('/:id', async (req, res) => {
  try {
    const { db } = require('../config/database');
    const { id } = req.params;
    
    // Check if team member exists
    const member = db.prepare('SELECT id FROM team_members WHERE id = ?').get(id);
    
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    // Start transaction to remove all assignments and delete member
    const deleteTransaction = db.transaction(() => {
      // Remove task assignments
      db.prepare('DELETE FROM task_assignments WHERE memberId = ?').run(id);
      
      // Remove workflow step assignments (if any)
      db.prepare(`
        UPDATE workflow_steps 
        SET assignedMembers = REPLACE(assignedMembers, ?, '') 
        WHERE assignedMembers LIKE ?
      `).run(id, `%${id}%`);
      
      // Delete the team member
      db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
    });
    
    deleteTransaction();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

module.exports = router;
*/

// TODO: Export empty router until user authentication is implemented
module.exports = require('express').Router();