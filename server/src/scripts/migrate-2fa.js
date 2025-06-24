const { getDatabase } = require('../config/database');

async function migrate2FA() {
  console.log('🔐 Starting 2FA migration...');
  
  const db = getDatabase();
  
  try {
    // Check if 2FA columns already exist
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const columnNames = tableInfo.map(col => col.name);
    
    const requiredColumns = [
      'two_factor_enabled',
      'two_factor_secret', 
      'two_factor_backup_codes',
      'two_factor_last_used'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ 2FA columns already exist, skipping migration');
      return;
    }
    
    console.log(`📝 Adding missing columns: ${missingColumns.join(', ')}`);
    
    // Add 2FA columns
    if (missingColumns.includes('two_factor_enabled')) {
      await db.run('ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0');
      console.log('✅ Added two_factor_enabled column');
    }
    
    if (missingColumns.includes('two_factor_secret')) {
      await db.run('ALTER TABLE users ADD COLUMN two_factor_secret TEXT');
      console.log('✅ Added two_factor_secret column');
    }
    
    if (missingColumns.includes('two_factor_backup_codes')) {
      await db.run('ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT');
      console.log('✅ Added two_factor_backup_codes column');
    }
    
    if (missingColumns.includes('two_factor_last_used')) {
      await db.run('ALTER TABLE users ADD COLUMN two_factor_last_used TEXT');
      console.log('✅ Added two_factor_last_used column');
    }
    
    console.log('🎉 2FA migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate2FA()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate2FA };