require('dotenv').config();
const { getDatabase } = require('../config/database');

const createTables = async () => {
  const db = getDatabase();

  try {
    console.log('Creating database tables...');

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

    // Team members table
    await db.run(`
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        skills TEXT, -- JSON array as string
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

    // Workflow steps table
    await db.run(`
      CREATE TABLE IF NOT EXISTS workflow_steps (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('start-end', 'process', 'decision', 'input-output')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE
      )
    `);

    // Step assignments table (many-to-many: steps <-> team_members)
    await db.run(`
      CREATE TABLE IF NOT EXISTS step_assignments (
        id TEXT PRIMARY KEY,
        step_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (step_id) REFERENCES workflow_steps (id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES team_members (id) ON DELETE CASCADE,
        UNIQUE(step_id, member_id)
      )
    `);

    // Step dependencies table
    await db.run(`
      CREATE TABLE IF NOT EXISTS step_dependencies (
        id TEXT PRIMARY KEY,
        step_id TEXT NOT NULL,
        depends_on_step_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (step_id) REFERENCES workflow_steps (id) ON DELETE CASCADE,
        FOREIGN KEY (depends_on_step_id) REFERENCES workflow_steps (id) ON DELETE CASCADE,
        UNIQUE(step_id, depends_on_step_id)
      )
    `);

    // Workflow connections table
    await db.run(`
      CREATE TABLE IF NOT EXISTS workflow_connections (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        source_step_id TEXT NOT NULL,
        target_step_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE,
        FOREIGN KEY (source_step_id) REFERENCES workflow_steps (id) ON DELETE CASCADE,
        FOREIGN KEY (target_step_id) REFERENCES workflow_steps (id) ON DELETE CASCADE
      )
    `);

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
        step_id TEXT,
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT NOT NULL, -- references kanban_columns.id
        tags TEXT, -- JSON array as string
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE SET NULL,
        FOREIGN KEY (step_id) REFERENCES workflow_steps (id) ON DELETE SET NULL,
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
        FOREIGN KEY (member_id) REFERENCES team_members (id) ON DELETE CASCADE,
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
        FOREIGN KEY (member_id) REFERENCES team_members (id) ON DELETE CASCADE,
        UNIQUE(meeting_id, member_id)
      )
    `);

    // Activity log table for audit trail
    await db.run(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL, -- 'client', 'workflow', 'task', etc.
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL, -- 'created', 'updated', 'deleted', etc.
        performed_by TEXT, -- team member id
        details TEXT, -- JSON object as string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (performed_by) REFERENCES team_members (id) ON DELETE SET NULL
      )
    `);

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
    
    // Create indexes for better performance
    await createIndexes(db);
    
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

const createIndexes = async (db) => {
  console.log('Creating database indexes...');
  
  try {
    // Indexes for better query performance
    await db.run('CREATE INDEX IF NOT EXISTS idx_workflows_client_id ON workflows (client_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps (workflow_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_kanban_tasks_workflow_id ON kanban_tasks (workflow_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON kanban_tasks (status)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_kanban_tasks_due_date ON kanban_tasks (due_date)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_client_meetings_client_id ON client_meetings (client_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_client_meetings_date ON client_meetings (meeting_date)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log (entity_type, entity_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at)');
    
    console.log('Database indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
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