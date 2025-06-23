const Workspace = require('../models/Workspace');

// Middleware to require workspace context
const requireWorkspace = async (req, res, next) => {
  try {
    // Get workspace ID from header or query parameter
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspace_id;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // Verify workspace exists and user has access
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is a member of this workspace
    const isMember = await Workspace.isUserMember(req.user.id, workspaceId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Add workspace to request object
    req.workspace = workspace;
    req.workspaceId = workspaceId;
    next();
  } catch (error) {
    console.error('Workspace middleware error:', error);
    res.status(500).json({ error: 'Failed to verify workspace access' });
  }
};

// Optional workspace middleware - adds workspace context if provided
const optionalWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspace_id;
    
    if (workspaceId && req.user) {
      const workspace = await Workspace.findById(workspaceId);
      if (workspace) {
        const isMember = await Workspace.isUserMember(req.user.id, workspaceId);
        if (isMember) {
          req.workspace = workspace;
          req.workspaceId = workspaceId;
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional workspace errors, just proceed without workspace context
    next();
  }
};

module.exports = {
  requireWorkspace,
  optionalWorkspace
}; 