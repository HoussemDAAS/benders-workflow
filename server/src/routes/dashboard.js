const express = require('express');
const { getDatabase } = require('../config/database');
const ActivityLogger = require('../models/ActivityLogger');
const router = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get basic counts (removed team_members reference)
    const [
      clientsResult,
      workflowsResult,
      tasksResult,
      overdueResult,
      meetingsResult
    ] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM clients WHERE is_active = 1'),
      db.get('SELECT COUNT(*) as count FROM workflows WHERE status = "active"'),
      db.get('SELECT COUNT(*) as count FROM kanban_tasks WHERE status = "done"'),
      db.get(`SELECT COUNT(*) as count FROM kanban_tasks 
              WHERE due_date < datetime('now') AND status != 'done'`),
      db.get(`SELECT COUNT(*) as count FROM client_meetings 
              WHERE meeting_date >= datetime('now') AND meeting_date <= datetime('now', '+7 days') 
              AND status = 'scheduled'`)
    ]);

    const stats = {
      totalClients: clientsResult.count,
      activeWorkflows: workflowsResult.count,
      completedTasks: tasksResult.count,
      overdueItems: overdueResult.count,
      upcomingMeetings: meetingsResult.count
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/recent-activity - Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await ActivityLogger.getRecentActivities(limit);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// GET /api/dashboard/task-distribution - Get task distribution by status
router.get('/task-distribution', async (req, res) => {
  try {
    const db = getDatabase();
    const distribution = await db.all(`
      SELECT kc.title as status, kc.color, COUNT(kt.id) as count
      FROM kanban_columns kc
      LEFT JOIN kanban_tasks kt ON kc.id = kt.status
      GROUP BY kc.id, kc.title, kc.color
      ORDER BY kc.order_index
    `);
    
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching task distribution:', error);
    res.status(500).json({ error: 'Failed to fetch task distribution' });
  }
});

// GET /api/dashboard/workflow-progress - Get workflow progress overview
router.get('/workflow-progress', async (req, res) => {
  try {
    const db = getDatabase();
    const workflows = await db.all(`
      SELECT w.id, w.name, w.status, c.name as client_name,
             COUNT(ws.id) as total_steps,
             COUNT(CASE WHEN ws.status = 'completed' THEN 1 END) as completed_steps
      FROM workflows w
      LEFT JOIN clients c ON w.client_id = c.id
      LEFT JOIN workflow_steps ws ON w.id = ws.workflow_id
      WHERE w.status = 'active'
      GROUP BY w.id, w.name, w.status, c.name
      ORDER BY w.created_at DESC
      LIMIT 10
    `);

    const progress = workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      clientName: workflow.client_name,
      totalSteps: workflow.total_steps,
      completedSteps: workflow.completed_steps,
      percentage: workflow.total_steps > 0 
        ? Math.round((workflow.completed_steps / workflow.total_steps) * 100) 
        : 0
    }));

    res.json(progress);
  } catch (error) {
    console.error('Error fetching workflow progress:', error);
    res.status(500).json({ error: 'Failed to fetch workflow progress' });
  }
});

// GET /api/dashboard/upcoming-deadlines - Get upcoming task deadlines
router.get('/upcoming-deadlines', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const db = getDatabase();
    
    const deadlines = await db.all(`
      SELECT kt.id, kt.title, kt.due_date, kt.priority, kt.status,
             w.name as workflow_name, c.name as client_name
      FROM kanban_tasks kt
      LEFT JOIN workflows w ON kt.workflow_id = w.id
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE kt.due_date IS NOT NULL 
        AND kt.due_date BETWEEN datetime('now') AND datetime('now', '+' || ? || ' days')
        AND kt.status != 'done'
      ORDER BY kt.due_date ASC
      LIMIT 20
    `, [days]);

    const formattedDeadlines = deadlines.map(task => ({
      id: task.id,
      title: task.title,
      dueDate: new Date(task.due_date),
      priority: task.priority,
      status: task.status,
      workflowName: task.workflow_name,
      clientName: task.client_name,
      isOverdue: new Date(task.due_date) < new Date()
    }));

    res.json(formattedDeadlines);
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
  }
});

// GET /api/dashboard/client-activity - Get client activity summary
router.get('/client-activity', async (req, res) => {
  try {
    const db = getDatabase();
    const clientActivity = await db.all(`
      SELECT c.id, c.name, c.company,
             COUNT(DISTINCT w.id) as total_workflows,
             COUNT(DISTINCT CASE WHEN w.status = 'active' THEN w.id END) as active_workflows,
             COUNT(DISTINCT kt.id) as total_tasks,
             COUNT(DISTINCT CASE WHEN kt.status = 'done' THEN kt.id END) as completed_tasks,
             COUNT(DISTINCT cm.id) as total_meetings,
             MAX(cm.meeting_date) as last_meeting_date
      FROM clients c
      LEFT JOIN workflows w ON c.id = w.client_id
      LEFT JOIN kanban_tasks kt ON w.id = kt.workflow_id
      LEFT JOIN client_meetings cm ON c.id = cm.client_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.company
      ORDER BY active_workflows DESC, total_workflows DESC
      LIMIT 10
    `);

    const formattedActivity = clientActivity.map(client => ({
      id: client.id,
      name: client.name,
      company: client.company,
      totalWorkflows: client.total_workflows,
      activeWorkflows: client.active_workflows,
      totalTasks: client.total_tasks,
      completedTasks: client.completed_tasks,
      totalMeetings: client.total_meetings,
      lastMeetingDate: client.last_meeting_date ? new Date(client.last_meeting_date) : null
    }));

    res.json(formattedActivity);
  } catch (error) {
    console.error('Error fetching client activity:', error);
    res.status(500).json({ error: 'Failed to fetch client activity' });
  }
});

// GET /api/dashboard/performance-metrics - Get performance metrics
router.get('/performance-metrics', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Calculate various performance metrics
    const [
      avgWorkflowDuration,
      taskCompletionRate,
      meetingAttendanceRate,
      overdueTasksRate
    ] = await Promise.all([
      db.get(`
        SELECT AVG(julianday(actual_end_date) - julianday(start_date)) as avg_duration
        FROM workflows 
        WHERE status = 'completed' AND actual_end_date IS NOT NULL AND start_date IS NOT NULL
      `),
      db.get(`
        SELECT 
          COUNT(CASE WHEN status = 'done' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
        FROM kanban_tasks
        WHERE created_at >= datetime('now', '-30 days')
      `),
      db.get(`
        SELECT 
          COUNT(CASE WHEN attendance_status = 'attended' THEN 1 END) * 100.0 / COUNT(*) as attendance_rate
        FROM meeting_attendees ma
        JOIN client_meetings cm ON ma.meeting_id = cm.id
        WHERE cm.meeting_date >= datetime('now', '-30 days') AND cm.status = 'completed'
      `),
      db.get(`
        SELECT 
          COUNT(CASE WHEN due_date < datetime('now') THEN 1 END) * 100.0 / COUNT(*) as overdue_rate
        FROM kanban_tasks
        WHERE status != 'done' AND due_date IS NOT NULL
      `)
    ]);

    const metrics = {
      avgWorkflowDurationDays: avgWorkflowDuration.avg_duration || 0,
      taskCompletionRate: taskCompletionRate.completion_rate || 0,
      meetingAttendanceRate: meetingAttendanceRate.attendance_rate || 0,
      overdueTasksRate: overdueTasksRate.overdue_rate || 0
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

module.exports = router;