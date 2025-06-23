const { getDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Workspace = require('../models/Workspace');

async function seedTestData() {
  const db = getDatabase();
  
  try {
    console.log('🌱 Starting workspace-aware database seeding...');
    
    // Check if we have any users to work with
    const users = await User.findAll(true); // include inactive
    let testUser;
    
    if (users.length === 0) {
      // Create a test user if none exist
      console.log('👤 Creating test user...');
      testUser = new User({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        emailVerified: true
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      testUser = users[0]; // Use the first user
      console.log(`👤 Using existing user: ${testUser.email}`);
    }

    // Create test workspaces
    console.log('🏢 Creating test workspaces...');
    
    const workspace1 = new Workspace({
      name: 'Acme Corporation',
      description: 'Main workspace for Acme Corporation projects',
      ownerId: testUser.id
    });
    await workspace1.save();
    
    const workspace2 = new Workspace({
      name: 'Digital Agency',
      description: 'Creative projects and client work',
      ownerId: testUser.id
    });
    await workspace2.save();

    console.log(`✅ Created workspaces: ${workspace1.name}, ${workspace2.name}`);
    
    // Seed Clients for workspace1
    console.log('👥 Seeding clients...');
    const clientsData = [
      {
        id: uuidv4(),
        name: 'John Smith',
        company: 'TechCorp Solutions',
        email: 'john.smith@techcorp.com',
        phone: '+1-555-0123',
        isActive: true,
        workspaceId: workspace1.id
      },
      {
        id: uuidv4(),
        name: 'Sarah Johnson',
        company: 'Digital Innovations Ltd',
        email: 'sarah.j@digitalinnovations.com',
        phone: '+1-555-0456',
        isActive: true,
        workspaceId: workspace1.id
      },
      {
        id: uuidv4(),
        name: 'Michael Chen',
        company: 'StartupHub Inc',
        email: 'm.chen@startuphub.io',
        phone: '+1-555-0789',
        isActive: true,
        workspaceId: workspace2.id
      },
      {
        id: uuidv4(),
        name: 'Emily Rodriguez',
        company: 'Global Enterprises',
        email: 'e.rodriguez@globalent.com',
        phone: '+1-555-0321',
        isActive: false,
        workspaceId: workspace2.id
      }
    ];
    
    for (const client of clientsData) {
      await db.run(`
        INSERT INTO clients (id, name, company, email, phone, is_active, workspace_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [client.id, client.name, client.company, client.email, client.phone, client.isActive ? 1 : 0, client.workspaceId]);
    }
    
    // Seed Team Members
    console.log('👨‍💻 Seeding team members...');
    const teamMembersData = [
      {
        id: uuidv4(),
        name: 'Alex Thompson',
        email: 'alex.thompson@company.com',
        role: 'Project Manager',
        skills: ['Project Management', 'Agile', 'Leadership'],
        isActive: true,
        workspaceId: workspace1.id
      },
      {
        id: uuidv4(),
        name: 'Jessica Lee',
        email: 'jessica.lee@company.com',
        role: 'Senior Developer',
        skills: ['React', 'Node.js', 'TypeScript', 'Database Design'],
        isActive: true,
        workspaceId: workspace1.id
      },
      {
        id: uuidv4(),
        name: 'David Wilson',
        email: 'david.wilson@company.com',
        role: 'UI/UX Designer',
        skills: ['Figma', 'UI Design', 'User Research', 'Prototyping'],
        isActive: true,
        workspaceId: workspace2.id
      },
      {
        id: uuidv4(),
        name: 'Maria Garcia',
        email: 'maria.garcia@company.com',
        role: 'Quality Assurance',
        skills: ['Testing', 'Automation', 'Bug Tracking'],
        isActive: true,
        workspaceId: workspace2.id
      }
    ];
    
    for (const member of teamMembersData) {
      await db.run(`
        INSERT INTO team_members (id, name, email, role, skills, is_active, workspace_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [member.id, member.name, member.email, member.role, JSON.stringify(member.skills), member.isActive ? 1 : 0, member.workspaceId]);
    }
    
    // Seed Workflows
    console.log('🔄 Seeding workflows...');
    const workflowsData = [
      {
        id: uuidv4(),
        name: 'E-commerce Platform Development',
        description: 'Complete e-commerce platform with payment integration and admin dashboard',
        clientId: clientsData[0].id,
        status: 'active',
        workspaceId: workspace1.id,
        startDate: new Date('2024-01-15').toISOString(),
        expectedEndDate: new Date('2024-06-15').toISOString(),
        actualEndDate: null
      },
      {
        id: uuidv4(),
        name: 'Mobile App Redesign',
        description: 'Complete UI/UX redesign of the mobile application with new features',
        clientId: clientsData[1].id,
        status: 'active',
        workspaceId: workspace1.id,
        startDate: new Date('2024-02-01').toISOString(),
        expectedEndDate: new Date('2024-05-01').toISOString(),
        actualEndDate: null
      },
      {
        id: uuidv4(),
        name: 'Website Migration',
        description: 'Migration from legacy system to modern tech stack',
        clientId: clientsData[2].id,
        status: 'completed',
        workspaceId: workspace2.id,
        startDate: new Date('2023-11-01').toISOString(),
        expectedEndDate: new Date('2024-02-01').toISOString(),
        actualEndDate: new Date('2024-01-28').toISOString()
      },
      {
        id: uuidv4(),
        name: 'Data Analytics Dashboard',
        description: 'Business intelligence dashboard with real-time data visualization',
        clientId: clientsData[0].id,
        status: 'paused',
        workspaceId: workspace1.id,
        startDate: new Date('2024-03-01').toISOString(),
        expectedEndDate: new Date('2024-07-01').toISOString(),
        actualEndDate: null
      }
    ];
    
    for (const workflow of workflowsData) {
      await db.run(`
        INSERT INTO workflows (id, name, description, client_id, status, workspace_id, start_date, expected_end_date, actual_end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [workflow.id, workflow.name, workflow.description, workflow.clientId, workflow.status, workflow.workspaceId, workflow.startDate, workflow.expectedEndDate, workflow.actualEndDate]);
    }
    
    // Seed Kanban Columns for each workspace
    console.log('📋 Seeding kanban columns...');
    const columnsData = [
      { id: 'todo-w1', title: 'To Do', color: '#64748b', order_index: 1, workspaceId: workspace1.id },
      { id: 'in-progress-w1', title: 'In Progress', color: '#3b82f6', order_index: 2, workspaceId: workspace1.id },
      { id: 'review-w1', title: 'Review', color: '#f59e0b', order_index: 3, workspaceId: workspace1.id },
      { id: 'done-w1', title: 'Done', color: '#10b981', order_index: 4, workspaceId: workspace1.id },
      
      { id: 'todo-w2', title: 'To Do', color: '#64748b', order_index: 1, workspaceId: workspace2.id },
      { id: 'in-progress-w2', title: 'In Progress', color: '#3b82f6', order_index: 2, workspaceId: workspace2.id },
      { id: 'review-w2', title: 'Review', color: '#f59e0b', order_index: 3, workspaceId: workspace2.id },
      { id: 'done-w2', title: 'Done', color: '#10b981', order_index: 4, workspaceId: workspace2.id }
    ];
    
    for (const column of columnsData) {
      await db.run(`
        INSERT OR REPLACE INTO kanban_columns (id, title, color, order_index, workspace_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [column.id, column.title, column.color, column.order_index, column.workspaceId]);
    }
    
    // Seed Kanban Tasks
    console.log('📝 Seeding kanban tasks...');
    const tasksData = [
      {
        id: uuidv4(),
        title: 'Setup Development Environment',
        description: 'Configure local development environment with Docker and database',
        workflowId: workflowsData[0].id,
        priority: 'high',
        status: 'done-w1',
        workspaceId: workspace1.id,
        tags: ['setup', 'development'],
        dueDate: new Date('2024-01-20').toISOString()
      },
      {
        id: uuidv4(),
        title: 'Design Database Schema',
        description: 'Create ERD and implement database schema for e-commerce platform',
        workflowId: workflowsData[0].id,
        priority: 'high',
        status: 'done-w1',
        workspaceId: workspace1.id,
        tags: ['database', 'design'],
        dueDate: new Date('2024-01-25').toISOString()
      },
      {
        id: uuidv4(),
        title: 'Implement User Authentication',
        description: 'Build user registration, login, and JWT token management',
        workflowId: workflowsData[0].id,
        priority: 'high',
        status: 'in-progress-w1',
        workspaceId: workspace1.id,
        tags: ['auth', 'security'],
        dueDate: new Date('2024-02-01').toISOString()
      },
      {
        id: uuidv4(),
        title: 'Create Product Catalog API',
        description: 'RESTful API for product management with CRUD operations',
        workflowId: workflowsData[0].id,
        priority: 'medium',
        status: 'todo-w1',
        workspaceId: workspace1.id,
        tags: ['api', 'products'],
        dueDate: new Date('2024-02-10').toISOString()
      },
      {
        id: uuidv4(),
        title: 'Mobile App Wireframes',
        description: 'Create low-fidelity wireframes for all mobile app screens',
        workflowId: workflowsData[1].id,
        priority: 'high',
        status: 'review-w1',
        workspaceId: workspace1.id,
        tags: ['design', 'wireframes'],
        dueDate: new Date('2024-02-05').toISOString()
      },
      {
        id: uuidv4(),
        title: 'Content Migration',
        description: 'Migrate existing content from old CMS to new platform',
        workflowId: workflowsData[2].id,
        priority: 'medium',
        status: 'done-w2',
        workspaceId: workspace2.id,
        tags: ['migration', 'content'],
        dueDate: new Date('2024-01-15').toISOString()
      },
      {
        id: uuidv4(),
        title: 'Dashboard UI Components',
        description: 'Design and implement reusable dashboard components',
        workflowId: workflowsData[3].id,
        priority: 'medium',
        status: 'todo-w1',
        workspaceId: workspace1.id,
        tags: ['ui', 'components'],
        dueDate: new Date('2024-03-15').toISOString()
      }
    ];
    
    for (const task of tasksData) {
      await db.run(`
        INSERT INTO kanban_tasks (id, title, description, workflow_id, priority, status, workspace_id, tags, due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [task.id, task.title, task.description, task.workflowId, task.priority, task.status, task.workspaceId, JSON.stringify(task.tags), task.dueDate]);
    }
    
    // Seed Client Meetings
    console.log('🤝 Seeding client meetings...');
    const meetingsData = [
      {
        id: uuidv4(),
        clientId: clientsData[0].id,
        title: 'Project Kickoff Meeting',
        description: 'Initial meeting to discuss project requirements and timeline',
        meetingDate: new Date('2024-01-10').toISOString(),
        duration: 120,
        location: 'Conference Room A',
        meetingType: 'in-person',
        status: 'completed',
        workspaceId: workspace1.id,
        notes: 'Great meeting! Client is excited about the project. Confirmed all requirements.'
      },
      {
        id: uuidv4(),
        clientId: clientsData[1].id,
        title: 'Design Review Session',
        description: 'Review mobile app wireframes and user flow',
        meetingDate: new Date('2024-02-08').toISOString(),
        duration: 90,
        location: null,
        meetingType: 'video',
        status: 'scheduled',
        workspaceId: workspace1.id,
        notes: null
      },
      {
        id: uuidv4(),
        clientId: clientsData[2].id,
        title: 'Migration Status Update',
        description: 'Weekly check-in on website migration progress',
        meetingDate: new Date('2024-01-20').toISOString(),
        duration: 60,
        location: null,
        meetingType: 'phone',
        status: 'completed',
        workspaceId: workspace2.id,
        notes: 'Migration completed ahead of schedule. Client very satisfied.'
      }
    ];
    
    for (const meeting of meetingsData) {
      await db.run(`
        INSERT INTO client_meetings (id, client_id, title, description, meeting_date, duration_minutes, location, meeting_type, status, workspace_id, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [meeting.id, meeting.clientId, meeting.title, meeting.description, meeting.meetingDate, meeting.duration, meeting.location, meeting.meetingType, meeting.status, meeting.workspaceId, meeting.notes]);
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - 2 workspaces created`);
    console.log(`   - ${clientsData.length} clients seeded`);
    console.log(`   - ${teamMembersData.length} team members seeded`);
    console.log(`   - ${workflowsData.length} workflows seeded`);
    console.log(`   - ${columnsData.length} kanban columns seeded`);
    console.log(`   - ${tasksData.length} kanban tasks seeded`);
    console.log(`   - ${meetingsData.length} client meetings seeded`);
    console.log(`🎉 All data is now workspace-scoped!`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  async function runSeeding() {
    try {
      await seedTestData();
      console.log('🌟 Database seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Database seeding failed:', error);
      process.exit(1);
    }
  }
  
  runSeeding();
}

module.exports = { seedTestData };