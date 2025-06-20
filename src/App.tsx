import React, { useState, useCallback, useMemo } from 'react';

// Components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { WorkflowsView } from './components/WorkflowsView';
import { TeamView } from './components/TeamView';
import { ClientsView } from './components/ClientsView';
import { LoadingCard } from './components/LoadingSpinner';
import { ErrorCard } from './components/ErrorMessage';

// Services
import {
  clientService,
  teamService,
  workflowService,
  taskService,
  dashboardService,
  CreateClientRequest,
  CreateTeamMemberRequest,
  CreateWorkflowRequest,
  CreateTaskRequest
} from './services';

// Hooks
import { useMultipleApi } from './hooks/useApi';

// Types
import { 
  Client, 
  TeamMember, 
  Workflow, 
  KanbanTask,
  DashboardStats 
} from './types';

// Styles
import './styles/app.css';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | undefined>();
  const [selectedClient, setSelectedClient] = useState<string | undefined>();

  // Memoize API call functions to prevent infinite re-renders
  const apiCallFunctions = useMemo(() => ({
    clients: () => clientService.getAll(),
    teamMembers: () => teamService.getAll(),
    workflows: () => workflowService.getAll(),
    kanbanColumns: () => taskService.getColumns(),
    kanbanTasks: () => taskService.getAll(),
    dashboardStats: () => dashboardService.getStats()
  }), []);

  // Load all data using our API hook
  const { data, loading, error, refresh } = useMultipleApi(apiCallFunctions);

  // Extract data with fallbacks - all data from API now
  const clients = data?.clients || [];
  const teamMembers = data?.teamMembers || [];
  const workflows = data?.workflows || [];
  const kanbanColumns = data?.kanbanColumns || [
    { id: 'todo', title: 'To Do', color: '#64748b', order: 1 },
    { id: 'in-progress', title: 'In Progress', color: '#3b82f6', order: 2 },
    { id: 'review', title: 'Review', color: '#f59e0b', order: 3 },
    { id: 'done', title: 'Done', color: '#10b981', order: 4 }
  ];
  const kanbanTasks = data?.kanbanTasks || [];
  const dashboardStats = data?.dashboardStats || {
    totalClients: 0,
    activeWorkflows: 0,
    completedTasks: 0,
    teamMembers: 0,
    overdueItems: 0
  };

  // Event handlers - MUST be defined before any conditional returns to maintain hook order
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view);
  }, []);

  const handleNewWorkflow = useCallback(() => {
    setCurrentView('workflows');
  }, []);

  // Workflow handlers
  const handleWorkflowCreate = useCallback(() => {
    console.log('Create workflow - will be implemented with modal');
    // TODO: Open modal for workflow creation
  }, []);

  const handleWorkflowEdit = useCallback(async (workflow: Workflow) => {
    try {
      // Convert workflow to update format
      const updateData: Partial<CreateWorkflowRequest> = {
        name: workflow.name,
        description: workflow.description,
        clientId: workflow.clientId,
        status: workflow.status === 'draft' ? 'active' : workflow.status === 'on-hold' ? 'paused' : workflow.status as any,
        startDate: workflow.startDate ? new Date(workflow.startDate).toISOString() : undefined,
        expectedEndDate: workflow.expectedEndDate ? new Date(workflow.expectedEndDate).toISOString() : undefined
      };
      
      await workflowService.update(workflow.id, updateData);
      await refresh();
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  }, [refresh]);

  const handleWorkflowStatusChange = useCallback(async (workflowId: string, status: string) => {
    try {
      await workflowService.updateStatus(workflowId, status);
      await refresh();
    } catch (error) {
      console.error('Failed to update workflow status:', error);
    }
  }, [refresh]);

  // Team member handlers
  const handleMemberCreate = useCallback(() => {
    console.log('Create team member - will be implemented with modal');
    // TODO: Open modal for team member creation
  }, []);

  const handleMemberEdit = useCallback(async (member: TeamMember) => {
    try {
      const updateData: Partial<CreateTeamMemberRequest> = {
        name: member.name,
        email: member.email,
        role: member.role,
        skills: member.skills,
        isActive: member.isActive
      };
      
      await teamService.update(member.id, updateData);
      await refresh();
    } catch (error) {
      console.error('Failed to update team member:', error);
    }
  }, [refresh]);

  const handleMemberStatusChange = useCallback(async (memberId: string, isActive: boolean) => {
    try {
      await teamService.updateStatus(memberId, isActive);
      await refresh();
    } catch (error) {
      console.error('Failed to update team member status:', error);
    }
  }, [refresh]);

  // Client handlers
  const handleClientCreate = useCallback(() => {
    console.log('Create client - will be implemented with modal');
    // TODO: Open modal for client creation
  }, []);

  const handleClientEdit = useCallback(async (client: Client) => {
    try {
      const updateData: Partial<CreateClientRequest> = {
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive
      };
      
      await clientService.update(client.id, updateData);
      await refresh();
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  }, [refresh]);

  const handleClientStatusChange = useCallback(async (clientId: string, isActive: boolean) => {
    try {
      await clientService.updateStatus(clientId, isActive);
      await refresh();
    } catch (error) {
      console.error('Failed to update client status:', error);
    }
  }, [refresh]);

  // Kanban handlers
  const handleTaskMove = useCallback(async (taskId: string, newStatus: string) => {
    try {
      await taskService.move(taskId, newStatus);
      await refresh();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  }, [refresh]);

  const handleTaskCreate = useCallback(async (columnId: string, workflowId?: string, clientId?: string) => {
    try {
      const newTask: CreateTaskRequest = {
        title: 'New Task',
        description: 'Task description',
        workflowId: workflowId || selectedWorkflow || workflows[0]?.id,
        stepId: '',
        priority: 'medium',
        status: columnId,
        tags: [],
        assignedMembers: [],
        clientId: clientId // For auto-workflow creation
      };

      await taskService.create(newTask);
      await refresh();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [selectedWorkflow, workflows, refresh]);

  const handleTaskEdit = useCallback(async (task: KanbanTask) => {
    try {
      const updateData: Partial<CreateTaskRequest> = {
        title: task.title,
        description: task.description,
        workflowId: task.workflowId,
        stepId: task.stepId,
        priority: task.priority,
        status: task.status,
        tags: task.tags,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
        assignedMembers: task.assignedMembers
      };
      
      await taskService.update(task.id, updateData);
      await refresh();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, [refresh]);

  // Show loading or error states - AFTER all hooks are defined
  if (loading) {
    return (
      <div className="app">
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          onNewWorkflow={handleNewWorkflow}
        />
        <main className="main-content">
          <LoadingCard message="Loading application data..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          onNewWorkflow={handleNewWorkflow}
        />
        <main className="main-content">
          <ErrorCard error={error} onRetry={refresh} />
        </main>
      </div>
    );
  }

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            stats={dashboardStats}
            recentClients={clients}
            activeWorkflows={workflows.filter((w: any) => w.status === 'active')}
            teamMembers={teamMembers}
            onViewChange={handleViewChange}
          />
        );

      case 'workflows':
        return (
          <WorkflowsView
            workflows={workflows}
            clients={clients}
            teamMembers={teamMembers}
            onWorkflowCreate={handleWorkflowCreate}
            onWorkflowEdit={handleWorkflowEdit}
            onWorkflowStatusChange={handleWorkflowStatusChange}
          />
        );

      case 'kanban':
        return (
          <KanbanBoard
            columns={kanbanColumns}
            tasks={kanbanTasks}
            teamMembers={teamMembers}
            workflows={workflows}
            clients={clients}
            onTaskMove={handleTaskMove}
            onTaskCreate={handleTaskCreate}
            onTaskEdit={handleTaskEdit}
            onRefresh={refresh}
          />
        );

      case 'team':
        return (
          <TeamView
            teamMembers={teamMembers}
            workflows={workflows}
            tasks={kanbanTasks}
            onMemberCreate={handleMemberCreate}
            onMemberEdit={handleMemberEdit}
            onMemberStatusChange={handleMemberStatusChange}
          />
        );

      case 'clients':
        return (
          <ClientsView
            clients={clients}
            workflows={workflows}
            tasks={kanbanTasks}
            teamMembers={teamMembers}
            onClientCreate={handleClientCreate}
            onClientEdit={handleClientEdit}
            onClientStatusChange={handleClientStatusChange}
          />
        );

      default:
        return (
          <Dashboard
            stats={dashboardStats}
            recentClients={clients}
            activeWorkflows={workflows.filter((w: any) => w.status === 'active')}
            teamMembers={teamMembers}
            onViewChange={handleViewChange}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewWorkflow={handleNewWorkflow}
      />
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  );
}
