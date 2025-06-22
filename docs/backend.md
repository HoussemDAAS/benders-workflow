# Backend Documentation

The backend is a Node.js application using Express.js.

## Database

The backend uses **SQLite** as its database. The database connection is managed by `server/src/config/database.js`, and the database file is located at `server/data/benders_workflow.db`.

## Models

The backend uses a set of models to interact with the database. These models encapsulate the data logic. Some of them use a custom ORM-like structure, while others use raw SQL queries.

The main models are:
-   `ActivityLogger`: Logs activities in the system.
-   `Client`: Manages client information.
-   `KanbanTask`: Represents tasks in the Kanban board.
-   `Meeting`: Manages meetings with clients.
-   `TeamMember`: Represents team members.
-   `Workflow`: Manages client workflows.

## API Endpoints

The backend exposes a RESTful API.

### Clients (`/api/clients`)

-   `GET /`: Get all clients.
-   `GET /:id`: Get a client by ID.
-   `GET /:id/workflows`: Get workflows for a client.
-   `GET /:id/meetings`: Get meetings for a client.
-   `GET /:id/tasks`: Get tasks for a client.
-   `POST /`: Create a new client.
-   `PUT /:id`: Update a client.
-   `PATCH /:id/status`: Update client's status.
-   `DELETE /:id`: Delete a client.

### Dashboard (`/api/dashboard`)

-   `GET /stats`: Get dashboard statistics.
-   `GET /recent-activity`: Get recent activities.
-   `GET /task-distribution`: Get task distribution by status.
-   `GET /workflow-progress`: Get workflow progress overview.
-   `GET /team-workload`: Get team workload overview.
-   `GET /upcoming-deadlines`: Get upcoming task deadlines.
-   `GET /client-activity`: Get client activity summary.
-   `GET /performance-metrics`: Get performance metrics.

### Meetings (`/api/meetings`)

-   `GET /`: Get all meetings.
-   `GET /:id`: Get a meeting by ID.
-   `GET /:id/attendees`: Get attendees for a meeting.
-   `POST /`: Create a new meeting.
-   `POST /:id/attendees`: Add an attendee to a meeting.
-   `PUT /:id`: Update a meeting.
-   `PATCH /:id/status`: Update meeting status.
-   `PATCH /:id/attendees/:memberId`: Update attendee status.
-   `DELETE /:id`: Delete a meeting.
-   `DELETE /:id/attendees/:memberId`: Remove an attendee from a meeting.

### Tasks (`/api/tasks`)

-   `GET /`: Get all tasks.
-   `GET /by-workflow/:workflowId`: Get tasks for a specific workflow.
-   `GET /by-client/:clientId`: Get tasks for a specific client.
-   `GET /columns`: Get Kanban columns.
-   `GET /:id`: Get a task by ID.
-   `GET /:id/assigned-members`: Get assigned members for a task.
-   `POST /`: Create a new task.
-   `POST /:id/assign`: Assign a member to a task.
-   `PUT /:id`: Update a task.
-   `PATCH /:id/move`: Move a task to a different status.
-   `PATCH /:id/priority`: Update task priority.
-   `POST /columns`: Create a new Kanban column.
-   `PUT /columns/:id`: Update a Kanban column.
-   `DELETE /:id`: Delete a task.
-   `DELETE /:id/assign/:memberId`: Unassign a member from a task.
-   `DELETE /columns/:id`: Delete a Kanban column.

### Team (`/api/team`)

-   `GET /`: Get all team members.
-   `GET /:id`: Get a team member by ID.
-   `GET /:id/workload`: Get team member's workload.
-   `GET /:id/assignments`: Get team member's assignments.
-   `GET /:id/steps`: Get team member's assigned steps.
-   `GET /:id/tasks`: Get team member's assigned tasks.
-   `GET /:id/meetings`: Get team member's meetings.
-   `POST /`: Create a new team member.
-   `PUT /:id`: Update a team member.
-   `PATCH /:id/status`: Update a team member's status.
-   `PATCH /:id/skills`: Update a team member's skills.
-   `DELETE /:id`: Delete a team member.

### Workflows (`/api/workflows`)

-   `GET /`: Get all workflows.
-   `GET /:id`: Get a workflow by ID.
-   `GET /:id/progress`: Get workflow progress.
-   `POST /`: Create a new workflow.
-   `POST /:id/connections`: Add a connection between steps.
-   `PUT /:id`: Update a workflow.
-   `PATCH /:id/status`: Update workflow status.
-   `DELETE /:id`: Delete a workflow.
-   `DELETE /:id/connections/:connectionId`: Delete a connection. 