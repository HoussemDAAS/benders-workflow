// Core entity types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  skills: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  type: 'in-person' | 'video' | 'phone';
  scheduledDate: string;
  clientId: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  description?: string;
  location?: string;
  notes?: string;
  attendeeIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'start-end' | 'process' | 'decision' | 'input-output';
  assignedMembers: string[]; // TeamMember IDs
  estimatedHours?: number;
  dependencies: string[]; // Other step IDs
  position: { x: number; y: number };
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  dueDate?: Date;
  completedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  clientId: string;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  status: 'draft' | 'active' | 'completed' | 'on-hold';
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  expectedEndDate?: Date;
}

export interface WorkflowConnection {
  id: string;
  source: string; // step ID
  target: string; // step ID
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

// Kanban board types
export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
  order_index?: number; // Backend uses snake_case
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  workflowId: string;
  stepId?: string;
  assignedMembers: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string; // column ID
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Application state
export interface AppState {
  clients: Client[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  kanbanColumns: KanbanColumn[];
  kanbanTasks: KanbanTask[];
  currentView: 'dashboard' | 'workflows' | 'kanban' | 'team' | 'clients';
  selectedWorkflow?: string;
  selectedClient?: string;
}

// UI Props
export interface DashboardStats {
  totalClients: number;
  activeWorkflows: number;
  completedTasks: number;
  teamMembers: number;
  overdueItems: number;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked'; 