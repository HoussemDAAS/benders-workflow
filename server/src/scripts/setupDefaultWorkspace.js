require('dotenv').config();
const { getDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function setupDefaultWorkspace() {
  const db = getDatabase();
  
  try {
    console.log('🏢 Setting up default workspace...');
    
    // Check if default workspace exists
    let defaultWorkspace = await db.get(`
      SELECT * FROM workspaces WHERE id = 'default-workspace'
    `);
    
    if (!defaultWorkspace) {
      console.log('📝 Creating default workspace...');
      await db.run(`
        INSERT INTO workspaces (id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `, ['default-workspace', 'Default Workspace', 'Default workspace for all users']);
      
      defaultWorkspace = await db.get(`
        SELECT * FROM workspaces WHERE id = 'default-workspace'
      `);
    }
    
    console.log('✅ Default workspace exists:', defaultWorkspace.name);
    
    // Get all users
    const users = await db.all('SELECT id, name, email FROM users WHERE is_active = 1');
    console.log(`👥 Found ${users.length} active users`);
    
    // Add all users to default workspace if they're not already members
    for (const user of users) {
      const membership = await db.get(`
        SELECT * FROM workspace_members 
        WHERE workspace_id = 'default-workspace' AND user_id = ?
      `, [user.id]);
      
      if (!membership) {
        console.log(`➕ Adding ${user.name} to default workspace`);
        await db.run(`
          INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `, [uuidv4(), 'default-workspace', user.id, 'member']);
      } else {
        console.log(`✓ ${user.name} already in default workspace`);
      }
    }
    
    // Update any time entries without workspace_id to use default workspace
    const orphanedEntries = await db.get(`
      SELECT COUNT(*) as count FROM time_entries WHERE workspace_id IS NULL
    `);
    
    if (orphanedEntries.count > 0) {
      console.log(`🔧 Fixing ${orphanedEntries.count} time entries without workspace_id`);
      await db.run(`
        UPDATE time_entries SET workspace_id = 'default-workspace' WHERE workspace_id IS NULL
      `);
    }
    
    // Show final stats
    const workspaceMembers = await db.all(`
      SELECT u.name, u.email, wm.role
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = 'default-workspace'
    `);
    
    console.log('\n📊 Default workspace members:');
    workspaceMembers.forEach(member => {
      console.log(`  - ${member.name} (${member.email}) - ${member.role}`);
    });
    
    const timeEntriesCount = await db.get(`
      SELECT COUNT(*) as count FROM time_entries WHERE workspace_id = 'default-workspace'
    `);
    
    console.log(`\n⏱️ Time entries in default workspace: ${timeEntriesCount.count}`);
    
    console.log('\n✅ Default workspace setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up default workspace:', error);
  }
}

setupDefaultWorkspace(); 