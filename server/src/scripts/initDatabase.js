require('dotenv').config();
const { getDatabase } = require('../config/database');

const createTables = async () => {
  const db = getDatabase();

  try {
    console.log('Creating database tables...');

    // Users table for authentication with 2FA support
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT, -- Allow NULL for OAuth users
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
        skills TEXT, -- JSON array as string (moved from team_members)
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        last_login_at DATETIME,
        two_factor_enabled BOOLEAN DEFAULT 0,
        two_factor_secret TEXT,
        two_factor_backup_codes TEXT,
        two_factor_last_used DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we need to add skills column to existing users table
    const userColumnInfo = await db.all("PRAGMA table_info(users)");
    const userColumnNames = userColumnInfo.map(col => col.name);
    
    if (!userColumnNames.includes('skills')) {
      console.log('🔧 Adding skills column to users table...');
      await db.run('ALTER TABLE users ADD COLUMN skills TEXT');
    }

    // Check if we need to add 2FA columns to existing users table
    const requiredColumns = [
      'two_factor_enabled',
      'two_factor_secret', 
      'two_factor_backup_codes',
      'two_factor_last_used'
    ];
    
    const missingColumns = requiredColumns.filter(col => !userColumnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`🔐 Adding 2FA columns: ${missingColumns.join(', ')}`);
      
      for (const column of missingColumns) {
        if (column === 'two_factor_enabled') {
          await db.run('ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0');
        } else if (column === 'two_factor_secret') {
          await db.run('ALTER TABLE users ADD COLUMN two_factor_secret TEXT');
        } else if (column === 'two_factor_backup_codes') {
          await db.run('ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT');
        } else if (column === 'two_factor_last_used') {
          await db.run('ALTER TABLE users ADD COLUMN two_factor_last_used DATETIME');
        }
      }
      
      console.log('✅ 2FA columns added successfully');
    }

    // Check if password column needs to be updated to allow NULL
    const passwordColumn = userColumnInfo.find(col => col.name === 'password');
    
    if (passwordColumn && passwordColumn.notnull === 1) {
      console.log('🔧 Updating users table to allow NULL passwords for OAuth users...');
      
      // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
      await db.run(`
        CREATE TABLE users_new (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT, -- Allow NULL for OAuth users
          name TEXT NOT NULL,
          role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
          skills TEXT, -- JSON array as string (moved from team_members)
          is_active BOOLEAN DEFAULT 1,
          email_verified BOOLEAN DEFAULT 0,
          last_login_at DATETIME,
          two_factor_enabled BOOLEAN DEFAULT 0,
          two_factor_secret TEXT,
          two_factor_backup_codes TEXT,
          two_factor_last_used DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Copy existing data
      await db.run(`
        INSERT INTO users_new 
        SELECT id, email, password, name, role, is_active, email_verified, last_login_at,
               COALESCE(two_factor_enabled, 0), two_factor_secret, two_factor_backup_codes, two_factor_last_used,
               created_at, updated_at
        FROM users
      `);
      
      // Drop old table and rename new one
      await db.run('DROP TABLE users');
      await db.run('ALTER TABLE users_new RENAME TO users');
      
      console.log('✅ Users table updated successfully');
    }

    // Clients table
    await db.run(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Workflows table
    await db.run(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        client_id TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        start_date DATETIME,
        expected_end_date DATETIME,
        actual_end_date DATETIME,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
      )
    `);

    // --- Remove legacy workflow_steps tables (step assign/dependency/connection) ---
    await db.run('DROP TABLE IF EXISTS workflow_connections');
    await db.run('DROP TABLE IF EXISTS step_dependencies');
    await db.run('DROP TABLE IF EXISTS step_assignments');
    await db.run('DROP TABLE IF EXISTS workflow_steps');

    // Kanban columns table
    await db.run(`
      CREATE TABLE IF NOT EXISTS kanban_columns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        color TEXT DEFAULT '#64748b',
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Kanban tasks table
    await db.run(`
      CREATE TABLE IF NOT EXISTS kanban_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        workflow_id TEXT,
        step_id TEXT, -- legacy field, no longer constrained
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT NOT NULL, -- references kanban_columns.id
        tags TEXT, -- JSON array as string
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE SET NULL,
        FOREIGN KEY (status) REFERENCES kanban_columns (id)
      )
    `);

    // Task assignments table (many-to-many: tasks <-> team_members)
    await db.run(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(task_id, member_id)
      )
    `);

    // Client meetings table
    await db.run(`
      CREATE TABLE IF NOT EXISTS client_meetings (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        meeting_date DATETIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        location TEXT,
        meeting_type TEXT DEFAULT 'in-person' CHECK (meeting_type IN ('in-person', 'video', 'phone')),
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
      )
    `);

    // Meeting attendees table
    await db.run(`
      CREATE TABLE IF NOT EXISTS meeting_attendees (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        attendance_status TEXT DEFAULT 'invited' CHECK (attendance_status IN ('invited', 'accepted', 'declined', 'attended', 'no-show')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES client_meetings (id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(meeting_id, member_id)
      )
    `);

    // Activity log table for audit trail - NO FOREIGN KEY CONSTRAINTS
    await db.run(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL, -- 'client', 'workflow', 'task', etc.
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL, -- 'created', 'updated', 'deleted', etc.
        performed_by TEXT, -- user id (no foreign key constraint)
        details TEXT, -- JSON object as string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Task resources table
    await db.run(`
      CREATE TABLE IF NOT EXISTS task_resources (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('document', 'link', 'image', 'file')),
        title TEXT NOT NULL,
        content TEXT, -- For documents, this stores HTML content
        url TEXT, -- For links and files
        file_name TEXT, -- Original file name
        file_size INTEGER, -- File size in bytes
        mime_type TEXT, -- File MIME type
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
      )
    `);

    // Workspaces table
    await db.run(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Workspace members table (many-to-many: workspaces <-> users)
    await db.run(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        added_by TEXT,
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE(workspace_id, user_id)
      )
    `);

    // Add workspace_id column to existing tables
    const tablesToUpdate = [
      'clients',
      'workflows', 
      'kanban_tasks',
      'client_meetings'
    ];

    for (const tableName of tablesToUpdate) {
      const columnInfo = await db.all(`PRAGMA table_info(${tableName})`);
      const columnNames = columnInfo.map(col => col.name);
      
      if (!columnNames.includes('workspace_id')) {
        console.log(`🔧 Adding workspace_id column to ${tableName} table...`);
        await db.run(`ALTER TABLE ${tableName} ADD COLUMN workspace_id TEXT`);
        
        // Add foreign key constraint in a separate step
        await db.run(`
          UPDATE ${tableName} SET workspace_id = 'default-workspace' WHERE workspace_id IS NULL
        `);
      }
    }

    // Insert default kanban columns
    const defaultColumns = [
      { id: 'todo', title: 'To Do', color: '#64748b', order_index: 1 },
      { id: 'in-progress', title: 'In Progress', color: '#3b82f6', order_index: 2 },
      { id: 'review', title: 'Review', color: '#f59e0b', order_index: 3 },
      { id: 'done', title: 'Done', color: '#10b981', order_index: 4 }
    ];

    for (const column of defaultColumns) {
      await db.run(`
        INSERT OR IGNORE INTO kanban_columns (id, title, color, order_index)
        VALUES (?, ?, ?, ?)
      `, [column.id, column.title, column.color, column.order_index]);
    }

    console.log('Database tables created successfully!');
    
    // Create default workspace if none exists
    const existingWorkspaces = await db.all('SELECT COUNT(*) as count FROM workspaces');
    if (existingWorkspaces[0].count === 0) {
      console.log('🏢 Creating default workspace...');
      
      const { v4: uuidv4 } = require('uuid');
      const defaultWorkspaceId = 'default-workspace';
      
      // Create default admin user if none exists
      const existingUsers = await db.all('SELECT * FROM users LIMIT 1');
      let adminUserId;
      
      if (existingUsers.length === 0) {
        adminUserId = uuidv4();
        await db.run(`
          INSERT INTO users (id, email, name, role, is_active, email_verified)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [adminUserId, 'admin@bendersworkflow.com', 'Default Admin', 'admin', 1, 1]);
        console.log('👤 Created default admin user');
      } else {
        adminUserId = existingUsers[0].id;
      }
      
      // Create default workspace
      await db.run(`
        INSERT INTO workspaces (id, name, description, owner_id, invite_code, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        defaultWorkspaceId,
        'Default Workspace',
        'Your default workspace for getting started',
        adminUserId,
        'default-invite',
        1
      ]);
      
      // Add admin user to workspace
      await db.run(`
        INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [uuidv4(), defaultWorkspaceId, adminUserId, 'admin']);
      
      console.log('✅ Default workspace created successfully!');
    }
    
    // Add all existing users to the default workspace if they're not members of any workspace
    const defaultWorkspace = await db.get('SELECT id FROM workspaces WHERE id = ?', ['default-workspace']);
    if (defaultWorkspace) {
      const usersWithoutWorkspace = await db.all(`
        SELECT u.id, u.email, u.name 
        FROM users u 
        WHERE u.is_active = 1 
        AND NOT EXISTS (
          SELECT 1 FROM workspace_members wm 
          WHERE wm.user_id = u.id
        )
      `);
      
      if (usersWithoutWorkspace.length > 0) {
        console.log(`🏢 Adding ${usersWithoutWorkspace.length} users to default workspace...`);
        
        for (const user of usersWithoutWorkspace) {
          await db.run(`
            INSERT OR IGNORE INTO workspace_members (id, workspace_id, user_id, role, joined_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [require('uuid').v4(), 'default-workspace', user.id, 'member']);
        }
        
        console.log('✅ Users added to default workspace successfully!');
      }
    }
    
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  createTables().then(() => {
    console.log('Database initialization completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
}

module.exports = { createTables };