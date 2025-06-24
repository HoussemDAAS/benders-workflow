require('dotenv').config();
const { getDatabase } = require('../config/database');

const cleanupDatabase = async () => {
  const db = getDatabase();

  try {
    console.log('🧹 Starting database cleanup...');

    // Clear all existing data to start fresh
    console.log('🗑️  Clearing all existing data...');
    
    const clearQueries = [
      'DELETE FROM task_resources',
      'DELETE FROM task_assignments', 
      'DELETE FROM meeting_attendees',
      'DELETE FROM client_meetings',
      'DELETE FROM kanban_tasks',
      'DELETE FROM kanban_columns',
      'DELETE FROM workflows',
      'DELETE FROM team_members',
      'DELETE FROM clients',
      'DELETE FROM user_workspaces',
      'DELETE FROM workspaces',
      'DELETE FROM activity_log'
      // Note: Not clearing users table - preserve OAuth users
    ];
    
    for (const query of clearQueries) {
      try {
        await db.run(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        console.log(`⚠️  Warning: ${query} - ${error.message}`);
      }
    }

    console.log('✅ Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDatabase().then(() => {
    console.log('🎉 Database cleanup completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Database cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanupDatabase }; 