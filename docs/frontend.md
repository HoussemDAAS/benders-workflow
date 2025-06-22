# Frontend Documentation

The frontend is a single-page application (SPA) built with React, Vite, and TypeScript.

## Tech Stack

-   **Framework**: React
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: CSS Modules / global CSS
-   **Workflow Visualization**: ReactFlow

## Folder Structure

The `src` directory contains the frontend source code.

-   `src/components`: Reusable React components.
-   `src/context`: React context for application-wide state.
-   `src/hooks`: Custom React hooks for encapsulating logic.
-   `src/nodes`: Custom nodes for the ReactFlow graph.
-   `src/pages`: Top-level page components.
-   `src/services`: Modules for making API calls to the backend.

## Components

A list of some of the main components:

-   `Sidebar`: The main navigation sidebar.
-   `Toolbar`: The toolbar for actions on different pages.
-   `Dashboard`: The main dashboard component.
-   `ClientsView`: Component for displaying and managing clients.
-   `KanbanBoard`: The Kanban board for tasks.
-   `TaskFlowView`: A view for the task flow visualization.
-   `WorkflowsView`: Component for managing workflows.
-   `TeamView`: Component for managing the team.
-   `MeetingView`: Component for managing meetings.
-   `...Modal`: Various modals for creating and editing items (clients, tasks, etc.).

## Hooks

Custom hooks are used to manage state and side effects for different features.

-   `useAppContext`: Provides access to the global application context.
-   `useApi`: A generic hook for making API requests.
-   `useClientActions`: Contains logic for client-related actions.
-   `useMeetingActions`: Contains logic for meeting-related actions.
-   `useTaskActions`: Contains logic for task-related actions.
-   `useTeamActions`: Contains logic for team-related actions.
-   `useWorkflowActions`: Contains logic for workflow-related actions.

## Services

Services are responsible for communicating with the backend API. Each service corresponds to a backend resource.

-   `api.ts`: A generic API client (e.g., Axios instance).
-   `clientService.ts`: API calls for clients.
-   `dashboardService.ts`: API calls for the dashboard.
-   `meetingService.ts`: API calls for meetings.
-   `taskService.ts`: API calls for tasks.
-   `teamService.ts`: API calls for team members.
-   `workflowService.ts`: API calls for workflows.

## Pages

Pages are the main views of the application, composed of multiple components.

-   `DashboardPage`: The main dashboard page.
-   `ClientsPage`: Page for managing clients.
--   `KanbanPage`: Page for the Kanban board.
-   `MeetingsPage`: Page for managing meetings.
-   `TeamPage`: Page for managing team members.
-   `WorkflowsPage`: Page for managing workflows. 