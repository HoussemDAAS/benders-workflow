const express = require('express');
const { body, validationResult } = require('express-validator');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Validation middleware
const validateCreateWorkspace = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Workspace name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
];

const validateJoinWorkspace = [
  body('inviteCode').trim().isLength({ min: 6, max: 6 }).withMessage('Invite code must be 6 characters'),
];

const validateUpdateWorkspace = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Workspace name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
];

// GET /workspaces - Get user's workspaces
router.get('/', authenticate, async (req, res) => {
  try {
    const workspaces = await Workspace.findForUser(req.user.id);
    res.json(workspaces);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// GET /workspaces/:id - Get workspace details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is a member of this workspace
    const isMember = await Workspace.isUserMember(req.user.id, workspace.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get workspace members
    const members = await workspace.getMembers();
    const userRole = await Workspace.getUserRole(req.user.id, workspace.id);

    res.json({
      ...workspace.toJSON(),
      members,
      userRole
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

// POST /workspaces - Create new workspace
router.post('/', authenticate, validateCreateWorkspace, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const workspace = new Workspace({
      name,
      description,
      ownerId: req.user.id
    });

    await workspace.save();

    res.status(201).json(workspace.toJSON());
  } catch (error) {
    console.error('Create workspace error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno
    });
    res.status(500).json({ 
      error: 'Failed to create workspace',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /workspaces/join - Join workspace by invite code
router.post('/join', authenticate, validateJoinWorkspace, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inviteCode } = req.body;

    const workspace = await Workspace.findByInviteCode(inviteCode);
    if (!workspace) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if user is already a member
    const isMember = await Workspace.isUserMember(req.user.id, workspace.id);
    if (isMember) {
      return res.status(400).json({ error: 'You are already a member of this workspace' });
    }

    // Add user to workspace
    await workspace.addMember(req.user.id, 'member', req.user.id);

    res.json({
      message: 'Successfully joined workspace',
      workspace: workspace.toJSON()
    });
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ error: 'Failed to join workspace' });
  }
});

// PUT /workspaces/:id - Update workspace
router.put('/:id', authenticate, validateUpdateWorkspace, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is admin of this workspace
    const userRole = await Workspace.getUserRole(req.user.id, workspace.id);
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can update workspace details' });
    }

    const { name, description } = req.body;
    
    if (name !== undefined) workspace.name = name;
    if (description !== undefined) workspace.description = description;

    await workspace.save();

    res.json(workspace.toJSON());
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// POST /workspaces/:id/regenerate-invite - Regenerate invite code
router.post('/:id/regenerate-invite', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is admin of this workspace
    const userRole = await Workspace.getUserRole(req.user.id, workspace.id);
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can regenerate invite codes' });
    }

    const newInviteCode = await workspace.regenerateInviteCode(req.user.id);

    res.json({
      message: 'Invite code regenerated successfully',
      inviteCode: newInviteCode
    });
  } catch (error) {
    console.error('Regenerate invite code error:', error);
    res.status(500).json({ error: 'Failed to regenerate invite code' });
  }
});

// POST /workspaces/:id/members - Add member to workspace
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is admin of this workspace
    const userRole = await Workspace.getUserRole(req.user.id, workspace.id);
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can add members' });
    }

    // Find user by email
    const userToAdd = await User.findByEmail(email);
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add user to workspace
    await workspace.addMember(userToAdd.id, role, req.user.id);

    res.json({
      message: 'Member added successfully',
      member: {
        id: userToAdd.id,
        email: userToAdd.email,
        name: userToAdd.name,
        role
      }
    });
  } catch (error) {
    if (error.message === 'User is already a member of this workspace') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE /workspaces/:id/members/:userId - Remove member from workspace
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is admin of this workspace
    const userRole = await Workspace.getUserRole(req.user.id, workspace.id);
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can remove members' });
    }

    // Can't remove the workspace owner
    if (req.params.userId === workspace.ownerId) {
      return res.status(400).json({ error: 'Cannot remove workspace owner' });
    }

    await workspace.removeMember(req.params.userId, req.user.id);

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// PUT /workspaces/:id/members/:userId/role - Update member role
router.put('/:id/members/:userId/role', authenticate, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (admin or member)' });
    }

    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is admin of this workspace
    const userRole = await Workspace.getUserRole(req.user.id, workspace.id);
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can update member roles' });
    }

    // Can't change the workspace owner's role
    if (req.params.userId === workspace.ownerId) {
      return res.status(400).json({ error: 'Cannot change workspace owner role' });
    }

    await workspace.updateMemberRole(req.params.userId, role, req.user.id);

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// DELETE /workspaces/:id - Delete workspace (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Only owner can delete workspace
    if (workspace.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only workspace owner can delete the workspace' });
    }

    await workspace.deactivate(req.user.id);

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

module.exports = router; 