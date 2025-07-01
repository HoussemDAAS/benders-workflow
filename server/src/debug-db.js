require('dotenv').config();
const { getDatabase } = require('./config/database');

async function checkDatabase() {
  try {
    const db = getDatabase();
    
    console.log('=== Checking Time Entries ===');
    const timeEntries = await db.all('SELECT * FROM time_entries ORDER BY created_at DESC LIMIT 5');
    console.log('Recent time entries:', timeEntries.length);
    timeEntries.forEach(entry => {
      console.log(`- Entry: ${entry.id}, Category: ${entry.category_id}, Duration: ${entry.duration_seconds}s`);
    });
    
    console.log('\n=== Checking Time Categories ===');
    const categories = await db.all('SELECT * FROM time_categories');
    console.log('Available categories:', categories.length);
    categories.forEach(cat => {
      console.log(`- Category: ${cat.name} (${cat.id})`);
    });
    
    console.log('\n=== Checking Active Timers ===');
    const activeTimers = await db.all('SELECT * FROM active_timers');
    console.log('Active timers:', activeTimers.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
  }
}

checkDatabase();