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

// POST /api/time-tracker/stop - Stop current timer and create time entry
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
      SELECT * FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    const now = new Date();
    const startTime = new Date(activeTimer.start_time);
    
    // Calculate total duration
    let totalDuration = Math.floor((now - startTime) / 1000);
    
    // Subtract any current pause duration if paused
    if (activeTimer.last_pause_time) {
      const pauseStart = new Date(activeTimer.last_pause_time);
      const currentPauseDuration = Math.floor((now - pauseStart) / 1000);
      totalDuration = totalDuration - (activeTimer.total_paused_duration || 0) - currentPauseDuration;
    } else {
      totalDuration = totalDuration - (activeTimer.total_paused_duration || 0);
    }

    // Ensure minimum duration of 1 second
    totalDuration = Math.max(1, totalDuration);

    // Get or create default categories
    let categoryId = null;
    if (activeTimer.is_break) {
      // Find or create break category
      let breakCategory = await db.get(`
        SELECT id FROM time_categories WHERE workspace_id = ? AND name = 'Break'
      `, [workspaceId]);
      
      if (!breakCategory) {
        const breakCategoryId = uuidv4();
        await db.run(`
          INSERT INTO time_categories (id, workspace_id, name, description, color, is_billable)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [breakCategoryId, workspaceId, 'Break', 'Break and rest time', '#ef4444', 0]);
        categoryId = breakCategoryId;
      } else {
        categoryId = breakCategory.id;
      }
    } else if (activeTimer.task_id) {
      // Find or create development category
      let devCategory = await db.get(`
        SELECT id FROM time_categories WHERE workspace_id = ? AND name = 'Development'
      `, [workspaceId]);
      
      if (!devCategory) {
        const devCategoryId = uuidv4();
        await db.run(`
          INSERT INTO time_categories (id, workspace_id, name, description, color, is_billable)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [devCategoryId, workspaceId, 'Development', 'Software development and coding', '#3b82f6', 1]);
        categoryId = devCategoryId;
      } else {
        categoryId = devCategory.id;
      }
    } else {
      // Find or create work category for general work
      let workCategory = await db.get(`
        SELECT id FROM time_categories WHERE workspace_id = ? AND name = 'Work'
      `, [workspaceId]);
      
      if (!workCategory) {
        const workCategoryId = uuidv4();
        await db.run(`
          INSERT INTO time_categories (id, workspace_id, name, description, color, is_billable)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [workCategoryId, workspaceId, 'Work', 'General work and tasks', '#10b981', 1]);
        categoryId = workCategoryId;
      } else {
        categoryId = workCategory.id;
      }
    }

    // Create time entry
    const timeEntryId = uuidv4();
    await db.run(`
      INSERT INTO time_entries (
        id, user_id, workspace_id, task_id, category_id, start_time, end_time,
        duration_seconds, status, description, is_break
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      timeEntryId, userId, workspaceId, activeTimer.task_id, categoryId,
      activeTimer.start_time, now.toISOString(), totalDuration, 'completed',
      activeTimer.description, activeTimer.is_break
    ]);

    // Remove active timer
    await db.run(`
      DELETE FROM active_timers WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);

    // Get the created time entry with full details
    const timeEntry = await db.get(`
      SELECT 
        te.*,
        kt.title as task_title,
        kt.priority as task_priority,
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
      message: 'Timer stopped and time entry created successfully',
      timeEntry: {
        id: timeEntry.id,
        taskId: timeEntry.task_id,
        taskTitle: timeEntry.task_title,
        taskPriority: timeEntry.task_priority,
        workflowName: timeEntry.workflow_name,
        clientName: timeEntry.client_name,
        categoryId: timeEntry.category_id,
        categoryName: timeEntry.category_name,
        categoryColor: timeEntry.category_color,
        startTime: timeEntry.start_time,
        endTime: timeEntry.end_time,
        duration: timeEntry.duration_seconds,
        description: timeEntry.description,
        isBreak: Boolean(timeEntry.is_break),
        status: timeEntry.status,
        totalPausedDuration: activeTimer.total_paused_duration || 0,
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