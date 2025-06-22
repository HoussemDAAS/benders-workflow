import React, { useState, useCallback, useMemo } from 'react';

// Components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { WorkflowsView } from './components/WorkflowsView';
import { TeamView } from './components/TeamView';
import { ClientsView } from './components/ClientsView';
import { MeetingView } from './components/MeetingView';
import { LoadingCard } from './components/LoadingSpinner';
import { ErrorCard } from './components/ErrorMessage';
import { TaskEditModal } from './components/TaskEditModal';
import { ClientModal } from './components/ClientModal';
import { TeamMemberModal } from './components/TeamMemberModal';
import { MeetingModal } from './components/MeetingModal';

// Services
import {
  clientService,
  teamService,
  workflowService,
  taskService,
  dashboardService,
  meetingService,
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
  WorkflowStep, 
  KanbanTask,
  Meeting,
  DashboardStats 
} from './types';

// Styles
import './styles/app.css';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | undefined>();
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  
  // Task edit modal state
  const [taskEditModal, setTaskEditModal] = useState<{
    isOpen: boolean;
    task: KanbanTask | null;
  }>({
    isOpen: false,
    task: null
  });

  // Client modal state
  const [clientModal, setClientModal] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({
    isOpen: false,
    client: null
  });

  // Team member modal state
  const [teamMemberModal, setTeamMemberModal] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
  }>({
    isOpen: false,
    member: null
  });

  // Meeting modal state
  const [meetingModal, setMeetingModal] = useState<{
    isOpen: boolean;
    meeting: Meeting | null;
  }>({
    isOpen: false,
    meeting: null
  });

  // New task context
  const [newTaskContext, setNewTaskContext] = useState<{
    columnId?: string;
    workflowId?: string;
    clientId?: string;
  }>({});

  // Memoize API call functions to prevent infinite re-renders
  const apiCallFunctions = useMemo(() => ({
    clients: () => clientService.getAll(),
    teamMembers: () => teamService.getAll(),
    workflows: () => workflowService.getAll(),
    kanbanColumns: () => taskService.getColumns(),
    kanbanTasks: () => taskService.getAll(),
    meetings: () => meetingService.getAll(),
    dashboardStats: () => dashboardService.getStats()
  }), []);

  // Load all data using our API hook
  const { data, loading, error, refresh } = useMultipleApi(apiCallFunctions);

  // Extract data with fallbacks - all data from API now
  const clients = data?.clients || [];
  const teamMembers = data?.teamMembers || [];
  const workflows = data?.workflows || [];
  const meetings = data?.meetings || [];
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
  const handleWorkflowCreate = useCallback(async (workflowData: any) => {
    try {
      await workflowService.create(workflowData);
      await refresh();
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  }, [refresh]);

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

  const handleWorkflowDelete = useCallback(async (workflowId: string) => {
    try {
      await workflowService.delete(workflowId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
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
    setTeamMemberModal({
      isOpen: true,
      member: null
    });
  }, []);

  const handleMemberEdit = useCallback((member: TeamMember) => {
    setTeamMemberModal({
      isOpen: true,
      member: member
    });
  }, []);

  const handleTeamMemberModalSubmit = useCallback(async (memberData: any) => {
    try {
      if (teamMemberModal.member) {
        // Update existing member
        await teamService.update(teamMemberModal.member.id, memberData);
      } else {
        // Create new member
        await teamService.create(memberData);
      }
      await refresh();
      setTeamMemberModal({ isOpen: false, member: null });
    } catch (error) {
      console.error('Failed to save team member:', error);
      throw error; // Re-throw to let modal handle the error
    }
  }, [teamMemberModal.member, refresh]);

  const handleTeamMemberModalClose = useCallback(() => {
    setTeamMemberModal({ isOpen: false, member: null });
  }, []);

  const handleMemberDelete = useCallback(async (memberId: string) => {
    try {
      await teamService.delete(memberId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete team member:', error);
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
    setClientModal({
      isOpen: true,
      client: null
    });
  }, []);

  const handleClientEdit = useCallback((client: Client) => {
    setClientModal({
      isOpen: true,
      client: client
    });
  }, []);

  const handleClientModalSubmit = useCallback(async (clientData: any) => {
    try {
      if (clientModal.client) {
        // Update existing client
        await clientService.update(clientModal.client.id, clientData);
      } else {
        // Create new client
        await clientService.create(clientData);
      }
      await refresh();
      setClientModal({ isOpen: false, client: null });
    } catch (error) {
      console.error('Failed to save client:', error);
      throw error; // Re-throw to let modal handle the error
    }
  }, [clientModal.client, refresh]);

  const handleClientModalClose = useCallback(() => {
    setClientModal({ isOpen: false, client: null });
  }, []);

  const handleClientDelete = useCallback(async (clientId: string) => {
    try {
      await clientService.delete(clientId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete client:', error);
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
  const handleTaskMove = useCallback(async (taskId: string, newColumnId: string) => {
    try {
      // Find the task to understand its current context
      const task = kanbanTasks.find(t => t.id === taskId);
      if (!task) return;

      // Determine if we're moving within workflow steps or generic columns
      const currentWorkflow = selectedWorkflow && selectedWorkflow !== 'all' 
        ? workflows.find(w => w.id === selectedWorkflow)
        : null;

      if (currentWorkflow && currentWorkflow.steps && currentWorkflow.steps.length > 0) {
        // Moving between workflow steps - update stepId
        const targetStep = currentWorkflow.steps.find(step => step.id === newColumnId);
        if (targetStep) {
          await taskService.update(taskId, {
            stepId: newColumnId,
            status: targetStep.status || task.status // Update status to match step status
          });
        }
      } else {
        // Moving between generic columns - update status
        await taskService.move(taskId, newColumnId);
      }
      
      await refresh();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  }, [refresh, kanbanTasks, selectedWorkflow, workflows]);

  const handleTaskCreate = useCallback(async (columnId: string, workflowId?: string, clientId?: string) => {
    // Open modal for new task creation - pass null to indicate new task
    setTaskEditModal({
      isOpen: true,
      task: null // This will be handled by the modal to show default values
    });
    
    // Store the column and workflow context for the new task
    setNewTaskContext({
      columnId,
      workflowId: workflowId || selectedWorkflow || workflows[0]?.id,
      clientId
    });
  }, [selectedWorkflow, workflows]);

  const handleTaskEdit = useCallback(async (task: KanbanTask | WorkflowStep) => {
    // For workflow steps, we can't edit them directly - they need to be handled differently
    if ('type' in task) {
      // This is a WorkflowStep - for now, just log that it's clicked
      console.log('Workflow step clicked:', task.name);
      return;
    }
    
    // Open the task edit modal for regular tasks
    setTaskEditModal({
      isOpen: true,
      task: task as KanbanTask
    });
  }, []);

  const handleTaskSave = useCallback(async (task: KanbanTask) => {
    try {
      if (task.id) {
        // Update existing task
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
      } else {
        // Create new task
        const createData: CreateTaskRequest = {
          title: task.title,
          description: task.description,
          workflowId: task.workflowId,
          stepId: task.stepId,
          priority: task.priority,
          status: task.status,
          tags: task.tags || [],
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
          assignedMembers: task.assignedMembers || []
        };
        
        await taskService.create(createData);
      }
      
      await refresh();
    } catch (error) {
      console.error('Failed to save task:', error);
      throw error; // Re-throw to let modal handle the error
    }
  }, [refresh]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await taskService.delete(taskId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error; // Re-throw to let modal handle the error
    }
  }, [refresh]);

  const handleTaskModalClose = useCallback(() => {
    setTaskEditModal({
      isOpen: false,
      task: null
    });
    // Clear the new task context
    setNewTaskContext({});
  }, []);

  const handleNewTask = useCallback(() => {
    setTaskEditModal({
      isOpen: true,
      task: null
    });
  }, []);

  // Meeting handlers
  const handleMeetingCreate = useCallback(() => {
    setMeetingModal({
      isOpen: true,
      meeting: null
    });
  }, []);

  const handleMeetingEdit = useCallback((meeting: Meeting) => {
    setMeetingModal({
      isOpen: true,
      meeting: meeting
    });
  }, []);

  const handleMeetingModalSubmit = useCallback(async (meetingData: any) => {
    try {
      if (meetingModal.meeting) {
        // Update existing meeting
        await meetingService.update(meetingModal.meeting.id, meetingData);
      } else {
        // Create new meeting
        await meetingService.create(meetingData);
      }
      await refresh();
      setMeetingModal({ isOpen: false, meeting: null });
    } catch (error) {
      console.error('Failed to save meeting:', error);
      throw error; // Re-throw to let modal handle the error
    }
  }, [meetingModal.meeting, refresh]);

  const handleMeetingModalClose = useCallback(() => {
    setMeetingModal({ isOpen: false, meeting: null });
  }, []);

  const handleMeetingDelete = useCallback(async (meetingId: string) => {
    try {
      await meetingService.delete(meetingId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    }
  }, [refresh]);

  const handleMeetingStatusChange = useCallback(async (meetingId: string, status: string) => {
    try {
      await meetingService.updateStatus(meetingId, status as any);
      await refresh();
    } catch (error) {
      console.error('Failed to update meeting status:', error);
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
            onWorkflowDelete={handleWorkflowDelete}
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
            selectedWorkflow={selectedWorkflow}
            selectedClient={selectedClient}
            onWorkflowChange={setSelectedWorkflow}
            onClientChange={setSelectedClient}
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
            onMemberDelete={handleMemberDelete}
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
            onClientDelete={handleClientDelete}
            onClientStatusChange={handleClientStatusChange}
          />
        );

      case 'meetings':
        return (
          <MeetingView
            meetings={meetings}
            clients={clients}
            teamMembers={teamMembers}
            onMeetingCreate={handleMeetingCreate}
            onMeetingEdit={handleMeetingEdit}
            onMeetingDelete={handleMeetingDelete}
            onMeetingStatusChange={handleMeetingStatusChange}
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
        onNewTask={handleNewTask}
      />
      <main className="main-content">
        {renderCurrentView()}
      </main>
      
      {/* Task Edit Modal */}
      <TaskEditModal
        task={taskEditModal.task}
        isOpen={taskEditModal.isOpen}
        onClose={handleTaskModalClose}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        teamMembers={teamMembers}
        workflows={workflows}
        columns={kanbanColumns}
        defaultColumnId={newTaskContext.columnId}
        defaultWorkflowId={newTaskContext.workflowId}
      />

      {/* Client Modal */}
      <ClientModal
        client={clientModal.client || undefined}
        isOpen={clientModal.isOpen}
        onClose={handleClientModalClose}
        onSubmit={handleClientModalSubmit}
      />

      {/* Team Member Modal */}
      <TeamMemberModal
        member={teamMemberModal.member || undefined}
        isOpen={teamMemberModal.isOpen}
        onClose={handleTeamMemberModalClose}
        onSubmit={handleTeamMemberModalSubmit}
      />

      {/* Meeting Modal */}
      <MeetingModal
        meeting={meetingModal.meeting || undefined}
        clients={clients}
        teamMembers={teamMembers}
        isOpen={meetingModal.isOpen}
        onClose={handleMeetingModalClose}
        onSubmit={handleMeetingModalSubmit}
      />
    </div>
  );
}
