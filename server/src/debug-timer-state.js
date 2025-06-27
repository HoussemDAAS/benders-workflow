require('dotenv').config();
const { getDatabase } = require('./config/database');

async function checkTimerState() {
  try {
    const db = getDatabase();
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`🗓️ Checking for date: ${today}`);
    
    console.log('\n=== Active Timers ===');
    const activeTimers = await db.all(`
      SELECT 
        at.*,
        kt.title as task_title
      FROM active_timers at
      LEFT JOIN kanban_tasks kt ON at.task_id = kt.id
    `);
    
    if (activeTimers.length > 0) {
      activeTimers.forEach(timer => {
        const startTime = new Date(timer.start_time);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        
        console.log(`🟢 ACTIVE TIMER FOUND:`);
        console.log(`   - ID: ${timer.id}`);
        console.log(`   - Task: ${timer.task_title || 'No task'}`);
        console.log(`   - Started: ${timer.start_time}`);
        console.log(`   - Elapsed: ${hours}h ${minutes}m ${seconds}s`);
        console.log(`   - Paused Duration: ${timer.total_paused_duration || 0}s`);
        console.log(`   - Is Break: ${timer.is_break}`);
      });
    } else {
      console.log('❌ No active timers found');
    }
    
    console.log('\n=== Today\'s Time Entries ===');
    const todayEntries = await db.all(`
      SELECT 
        te.*,
        kt.title as task_title,
        tc.name as category_name
      FROM time_entries te
      LEFT JOIN kanban_tasks kt ON te.task_id = kt.id
      LEFT JOIN time_categories tc ON te.category_id = tc.id
      WHERE date(te.start_time) = date('now', 'localtime')
      ORDER BY te.start_time DESC
    `);
    
    console.log(`📊 Found ${todayEntries.length} time entries for today:`);
    let totalSeconds = 0;
    
    todayEntries.forEach(entry => {
      totalSeconds += entry.duration_seconds;
      const hours = Math.floor(entry.duration_seconds / 3600);
      const minutes = Math.floor((entry.duration_seconds % 3600) / 60);
      const secs = entry.duration_seconds % 60;
      
      console.log(`   - ${entry.task_title || 'No task'} (${entry.category_name || 'No category'})`);
      console.log(`     Duration: ${hours}h ${minutes}m ${secs}s`);
      console.log(`     Period: ${entry.start_time} to ${entry.end_time}`);
    });
    
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    console.log(`\n🎯 TOTAL TIME IN ENTRIES: ${totalHours}h ${totalMinutes}m (${totalSeconds}s)`);
    
    console.log('\n=== Today\'s Timer Activities ===');
    const activities = await db.all(`
      SELECT 
        al.*
      FROM activity_log al
      WHERE al.entity_type = 'timer' 
        AND date(al.created_at) = date('now', 'localtime')
      ORDER BY al.created_at DESC
      LIMIT 20
    `);
    
    console.log(`📋 Found ${activities.length} timer activities for today:`);
    activities.forEach(activity => {
      const details = JSON.parse(activity.details || '{}');
      console.log(`   - ${activity.action} at ${activity.created_at}`);
      if (details.reason) console.log(`     Reason: ${details.reason}`);
      if (details.totalDuration) console.log(`     Total Duration: ${details.totalDuration}s`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Timer state check failed:', error);
    process.exit(1);
  }
}

checkTimerState(); 