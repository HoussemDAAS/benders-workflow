// Load environment variables from config.env
require('dotenv').config({ path: require('path').resolve(__dirname, '../../config.env') });

const { getDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function seedTimeData() {
  const db = getDatabase();
  
  try {
    console.log('⏰ Starting time tracking and calendar data seeding...');
    
    // Get existing users and workspaces
    let users, workspaces, tasks;
    
    try {
      users = await db.all('SELECT * FROM users WHERE is_active = 1 LIMIT 1');
      workspaces = await db.all('SELECT * FROM workspaces LIMIT 1');
      tasks = await db.all('SELECT * FROM kanban_tasks LIMIT 5');
    } catch (error) {
      console.log('❌ Database tables not found. Running basic test data seeding first...');
      
      // Run the basic seeding script first
      const { seedTestData } = require('./seedTestData');
      await seedTestData();
      
      // Now try again
      users = await db.all('SELECT * FROM users WHERE is_active = 1 LIMIT 1');
      workspaces = await db.all('SELECT * FROM workspaces LIMIT 1');
      tasks = await db.all('SELECT * FROM kanban_tasks LIMIT 5');
    }
    
    if (users.length === 0 || workspaces.length === 0) {
      console.log('❌ No users or workspaces found even after seeding. Check database setup.');
      return;
    }
    
    const user = users[0];
    const workspace = workspaces[0];
    
    console.log(`👤 Using user: ${user.email}`);
    console.log(`🏢 Using workspace: ${workspace.name}`);
    
    // Clear existing time data for clean test
    await db.run('DELETE FROM time_entries WHERE user_id = ?', [user.id]);
    await db.run('DELETE FROM calendar_events WHERE user_id = ?', [user.id]);
    await db.run('DELETE FROM activity_log WHERE performed_by = ? AND entity_type = "timer"', [user.id]);
    
    console.log('🧹 Cleared existing time data for fresh start');
    
    // Create time entries for the last 7 days
    const timeEntries = [];
    const now = new Date();
    
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      
      // Create 2-4 time entries per day
      const entriesPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < entriesPerDay; i++) {
        const taskIndex = Math.floor(Math.random() * Math.min(tasks.length, 3));
        const task = tasks[taskIndex];
        
        // Random start time between 9 AM and 4 PM
        const startHour = 9 + Math.floor(Math.random() * 7);
        const startMinute = Math.floor(Math.random() * 60);
        const startTime = new Date(date);
        startTime.setHours(startHour, startMinute, 0, 0);
        
        // Duration between 30 minutes and 3 hours
        const durationMinutes = 30 + Math.floor(Math.random() * 150);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        
        const isBreak = Math.random() < 0.2; // 20% chance of break
        
        const entryId = uuidv4();
        const entry = {
          id: entryId,
          user_id: user.id,
          workspace_id: workspace.id,
          task_id: isBreak ? null : task?.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_seconds: Math.floor(durationMinutes * 60),
          status: 'completed',
          description: isBreak ? 'Coffee break' : `Working on ${task?.title || 'development tasks'}`,
          is_break: isBreak ? 1 : 0
        };
        
        timeEntries.push(entry);
        
        await db.run(`
          INSERT INTO time_entries (
            id, user_id, workspace_id, task_id, start_time, end_time, 
            duration_seconds, status, description, is_break, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          entry.id, entry.user_id, entry.workspace_id, entry.task_id,
          entry.start_time, entry.end_time, entry.duration_seconds,
          entry.status, entry.description, entry.is_break
        ]);
        
        // Create activity log entries for this timer session
        const timerId = uuidv4();
        
        // Start activity
        await db.run(`
          INSERT INTO activity_log (
            id, entity_type, entity_id, action, performed_by, details, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), 'timer', timerId, 'started', user.id,
          JSON.stringify({
            taskId: entry.task_id,
            description: entry.description,
            isBreak: Boolean(entry.is_break),
            startTime: entry.start_time,
            workspaceId: entry.workspace_id
          }),
          entry.start_time
        ]);
        
        // Maybe add a pause/resume cycle (30% chance)
        if (Math.random() < 0.3 && durationMinutes > 60) {
          const pauseTime = new Date(startTime.getTime() + (durationMinutes * 0.4 * 60000));
          const resumeTime = new Date(pauseTime.getTime() + 5 * 60000); // 5 min break
          
          await db.run(`
            INSERT INTO activity_log (
              id, entity_type, entity_id, action, performed_by, details, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(), 'timer', timerId, 'paused', user.id,
            JSON.stringify({
              reason: 'Quick break',
              pausedAt: pauseTime.toISOString(),
              workspaceId: entry.workspace_id
            }),
            pauseTime.toISOString()
          ]);
          
          await db.run(`
            INSERT INTO activity_log (
              id, entity_type, entity_id, action, performed_by, details, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(), 'timer', timerId, 'resumed', user.id,
            JSON.stringify({
              pausedDuration: 300, // 5 minutes
              totalPausedDuration: 300,
              workspaceId: entry.workspace_id
            }),
            resumeTime.toISOString()
          ]);
        }
        
        // Stop activity
        await db.run(`
          INSERT INTO activity_log (
            id, entity_type, entity_id, action, performed_by, details, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), 'timer', timerId, 'stopped', user.id,
          JSON.stringify({
            totalDuration: entry.duration_seconds,
            pausedDuration: 0,
            timeEntryId: entry.id,
            taskId: entry.task_id,
            workspaceId: entry.workspace_id
          }),
          entry.end_time
        ]);
      }
    }
    
    // Create calendar events for the next 7 days
    const calendarEvents = [];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      
      // Skip weekends for some events
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Create 1-3 calendar events per weekday
      const eventsPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < eventsPerDay; i++) {
        const eventTypes = ['task', 'meeting', 'break'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        const startHour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
        const startTime = new Date(date);
        startTime.setHours(startHour, 0, 0, 0);
        
        const durationHours = eventType === 'break' ? 0.5 : (1 + Math.random() * 2); // 30min to 3 hours
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
        
        const titles = {
          task: ['Code Review', 'Development Sprint', 'Bug Fixing', 'Feature Implementation'],
          meeting: ['Team Standup', 'Client Call', 'Project Review', 'Planning Meeting'],
          break: ['Lunch Break', 'Coffee Break', 'Quick Break']
        };
        
        const eventTitle = titles[eventType][Math.floor(Math.random() * titles[eventType].length)];
        
        const event = {
          id: uuidv4(),
          user_id: user.id,
          workspace_id: workspace.id,
          title: eventTitle,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          all_day: false,
          task_id: (eventType === 'task' && tasks.length > 0) ? tasks[Math.floor(Math.random() * tasks.length)].id : null,
          description: `Scheduled ${eventType} for ${eventTitle.toLowerCase()}`,
          event_type: eventType,
          color: eventType === 'task' ? '#3b82f6' : eventType === 'meeting' ? '#f59e0b' : '#ef4444'
        };
        
        calendarEvents.push(event);
        
        await db.run(`
          INSERT INTO calendar_events (
            id, user_id, workspace_id, title, start_time, end_time, all_day,
            task_id, description, event_type, color, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          event.id, event.user_id, event.workspace_id, event.title,
          event.start_time, event.end_time, event.all_day,
          event.task_id, event.description, event.event_type, event.color
        ]);
      }
    }
    
    console.log('✅ Time tracking and calendar data seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${timeEntries.length} time entries created`);
    console.log(`   - ${calendarEvents.length} calendar events created`);
    console.log(`   - Activity logs created for all timer sessions`);
    console.log(`🎉 Calendar and time tracking now have realistic data!`);
    
  } catch (error) {
    console.error('❌ Error during time data seeding:', error);
    throw error;
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  async function runSeeding() {
    try {
      await seedTimeData();
      console.log('🌟 Time data seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Time data seeding failed:', error);
      process.exit(1);
    }
  }
  
  runSeeding();
}

module.exports = { seedTimeData }; 