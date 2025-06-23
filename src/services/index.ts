export { apiService, ApiError } from './api';
export { workspaceService } from './workspaceService';
export { clientService } from './clientService';
export { taskService } from './taskService';
export { taskResourceService } from './taskResourceService';
export { workflowService } from './workflowService';
export { teamService } from './teamService'; // Re-export the mock teamService
export { dashboardService } from './dashboardService';
export { meetingService } from './meetingService';

export type {
  CreateWorkspaceData,
  JoinWorkspaceData,
  UpdateWorkspaceData,
  AddMemberData
} from './workspaceService';

export type {
  CreateClientRequest,
  UpdateClientRequest
} from './clientService';

export type {
  CreateTaskRequest,
  UpdateTaskRequest
} from './taskService';

export type {
  TaskResource,
  CreateTaskResourceRequest,
  UpdateTaskResourceRequest
} from './taskResourceService';

export type {
  CreateWorkflowRequest,
  WorkflowConnection,
  WorkflowProgress
} from './workflowService';

/*
export type {
  CreateTeamMemberRequest,
  TeamMemberWorkload,
  TeamMemberAssignments
} from './teamService';
*/

export type {
  DashboardData
} from './dashboardService';

export type {
  CreateMeetingRequest,
  Meeting,
  MeetingWithDetails
} from './meetingService';