require('dotenv').config();
const { getDatabase } = require('./src/config/database');

async function testTimerActivities() {
  console.log('🔍 Testing Timer Activities Database...\n');
  
  try {
    const db = getDatabase();
    
    // Test 1: Check activity_log table
    console.log('📊 Activity Log Table:');
    const activityCount = await db.get('SELECT COUNT(*) as count FROM activity_log');
    console.log(`  - Total activities: ${activityCount.count}`);
    
    const timerActivities = await db.get('SELECT COUNT(*) as count FROM activity_log WHERE entity_type = "timer"');
    console.log(`  - Timer activities: ${timerActivities.count}`);
    
    // Test 2: Check time_entries table
    console.log('\n⏱️ Time Entries Table:');
    const timeEntryCount = await db.get('SELECT COUNT(*) as count FROM time_entries');
    console.log(`  - Total time entries: ${timeEntryCount.count}`);
    
    // Test 3: Check active_timers table
    console.log('\n🏃 Active Timers Table:');
    const activeTimerCount = await db.get('SELECT COUNT(*) as count FROM active_timers');
    console.log(`  - Active timers: ${activeTimerCount.count}`);
    
    // Test 4: Show recent timer activities
    if (timerActivities.count > 0) {
      console.log('\n📋 Recent Timer Activities:');
      const recentActivities = await db.all(`
        SELECT action, entity_id, created_at, details
        FROM activity_log 
        WHERE entity_type = "timer" 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      recentActivities.forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.action} - ${activity.created_at}`);
        const details = JSON.parse(activity.details || '{}');
        if (details.reason) console.log(`     Reason: ${details.reason}`);
        if (details.pausedDuration) console.log(`     Paused for: ${details.pausedDuration}s`);
      });
    }
    
    // Test 5: Show recent time entries
    if (timeEntryCount.count > 0) {
      console.log('\n📝 Recent Time Entries:');
      const recentEntries = await db.all(`
        SELECT id, start_time, end_time, duration_seconds, description
        FROM time_entries 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      recentEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. Duration: ${entry.duration_seconds}s - ${entry.description || 'No description'}`);
        console.log(`     ${entry.start_time} → ${entry.end_time}`);
      });
    }
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
  
  process.exit(0);
}

testTimerActivities(); 