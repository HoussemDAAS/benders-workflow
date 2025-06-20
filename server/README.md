# Benders Workflow Management Backend

A robust Node.js backend API with SQLite database for the Benders Workflow Management System.

## Features

- **RESTful API** with comprehensive endpoints
- **SQLite Database** with automatic schema creation
- **Client Management** with auto-workflow generation
- **Meeting Scheduling** with attendee management
- **Kanban Task Management** with workflow integration
- **Team Member Management** with workload tracking
- **Activity Logging** for audit trails
- **Dashboard Analytics** with performance metrics
- **Data Validation** with express-validator
- **Security** with helmet, CORS, and rate limiting
- **Error Handling** with comprehensive logging

## Project Structure

```
server/
├── package.json              # Dependencies and scripts
├── config.env.example        # Environment configuration template
├── README.md                 # This file
├── data/                     # SQLite database files (auto-created)
│   └── benders_workflow.db
└── src/
    ├── index.js              # Main server file
    ├── config/
    │   └── database.js       # Database configuration
    ├── models/               # Data models
    │   ├── ActivityLogger.js
    │   ├── Client.js
    │   ├── KanbanTask.js
    │   ├── Meeting.js
    │   ├── TeamMember.js
    │   ├── Workflow.js
    │   └── WorkflowStep.js
    ├── routes/               # API route handlers
    │   ├── clients.js
    │   ├── dashboard.js
    │   ├── meetings.js
    │   ├── tasks.js
    │   ├── team.js
    │   └── workflows.js
    └── scripts/
        └── initDatabase.js   # Database initialization
```

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

Create a `.env` file from the example:

```bash
cp config.env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/benders_workflow.db
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:5173
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `GET /api/clients/:id/workflows` - Get client workflows
- `GET /api/clients/:id/meetings` - Get client meetings
- `GET /api/clients/:id/tasks` - Get client tasks
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `PATCH /api/clients/:id/status` - Update client status
- `DELETE /api/clients/:id` - Delete client

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `GET /api/workflows/:id/steps` - Get workflow steps
- `GET /api/workflows/:id/connections` - Get workflow connections
- `GET /api/workflows/:id/progress` - Get workflow progress
- `POST /api/workflows` - Create new workflow
- `POST /api/workflows/:id/steps` - Add step to workflow
- `POST /api/workflows/:id/connections` - Add connection between steps
- `PUT /api/workflows/:id` - Update workflow
- `PATCH /api/workflows/:id/status` - Update workflow status
- `DELETE /api/workflows/:id` - Delete workflow

### Tasks (Kanban)
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/columns` - Get kanban columns
- `GET /api/tasks/:id` - Get task by ID
- `GET /api/tasks/:id/assigned-members` - Get task assigned members
- `POST /api/tasks` - Create new task
- `POST /api/tasks/:id/assign` - Assign member to task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/move` - Move task to different status
- `PATCH /api/tasks/:id/priority` - Update task priority
- `DELETE /api/tasks/:id` - Delete task

### Team Members
- `GET /api/team` - Get all team members
- `GET /api/team/:id` - Get team member by ID
- `GET /api/team/:id/workload` - Get team member workload
- `GET /api/team/:id/assignments` - Get team member assignments
- `POST /api/team` - Create new team member
- `PUT /api/team/:id` - Update team member
- `PATCH /api/team/:id/status` - Update team member status
- `DELETE /api/team/:id` - Delete team member

### Meetings
- `GET /api/meetings` - Get all meetings
- `GET /api/meetings/:id` - Get meeting by ID
- `GET /api/meetings/:id/attendees` - Get meeting attendees
- `POST /api/meetings` - Create new meeting
- `POST /api/meetings/:id/attendees` - Add attendee to meeting
- `PUT /api/meetings/:id` - Update meeting
- `PATCH /api/meetings/:id/status` - Update meeting status
- `DELETE /api/meetings/:id` - Delete meeting

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/task-distribution` - Get task distribution
- `GET /api/dashboard/workflow-progress` - Get workflow progress
- `GET /api/dashboard/team-workload` - Get team workload overview
- `GET /api/dashboard/upcoming-deadlines` - Get upcoming deadlines
- `GET /api/dashboard/client-activity` - Get client activity summary
- `GET /api/dashboard/performance-metrics` - Get performance metrics

## Database Schema

### Key Tables
- **clients** - Client information
- **team_members** - Team member details
- **workflows** - Project workflows
- **workflow_steps** - Individual workflow steps
- **kanban_tasks** - Kanban board tasks
- **client_meetings** - Meeting schedules
- **activity_log** - Audit trail

### Auto-Generated Features
- **Default Workflows**: Each new client automatically gets a default workflow template
- **Kanban Integration**: Tasks are linked to workflow steps
- **Activity Logging**: All CRUD operations are logged for audit purposes
- **Performance Indexes**: Optimized queries with proper indexing

## Key Features

### 1. Client Workflow Auto-Generation
When a new client is created, the system automatically:
- Creates a default workflow template
- Sets up standard workflow steps (Initiation, Requirements, Design, Implementation, Review, Completion)
- Links steps with proper dependencies
- Establishes workflow connections

### 2. Meeting Management
Comprehensive meeting scheduling with:
- Multiple meeting types (in-person, video, phone)
- Attendee management with RSVP status
- Integration with team members
- Calendar-friendly date ranges

### 3. Kanban-Workflow Integration
Tasks can be:
- Linked to specific workflow steps
- Assigned to multiple team members
- Tracked with priorities and due dates
- Moved between customizable columns

### 4. Activity Logging
All operations are logged including:
- Entity type and ID
- Action performed (created, updated, deleted, moved)
- User who performed the action
- Detailed change information

### 5. Dashboard Analytics
Rich analytics including:
- Real-time statistics
- Team workload distribution
- Task completion rates
- Workflow progress tracking
- Performance metrics

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database tables
- `npm test` - Run tests (if configured)

## Error Handling

The API includes comprehensive error handling:
- Validation errors with detailed messages
- Database constraint violations
- Rate limiting protection
- Security headers with helmet
- Graceful shutdown handling

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin request protection
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Request validation with express-validator
- **SQL Injection Protection**: Parameterized queries

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DB_PATH` | ./data/benders_workflow.db | SQLite database path |
| `JWT_SECRET` | - | JWT signing secret |
| `CORS_ORIGIN` | http://localhost:5173 | Allowed CORS origin |
| `API_RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window |
| `API_RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

## Development

### Adding New Models
1. Create model file in `src/models/`
2. Extend database schema in `src/scripts/initDatabase.js`
3. Add routes in `src/routes/`
4. Register routes in `src/index.js`

### Database Migrations
The system uses a simple table creation approach. For production, consider implementing proper migrations.

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper JWT secret
3. Set up process manager (PM2 recommended)
4. Configure reverse proxy (nginx)
5. Set up database backups
6. Monitor with logging service

## License

MIT License - See LICENSE file for details 