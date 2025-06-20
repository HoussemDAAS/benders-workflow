import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { WorkflowsView } from './components/WorkflowsView';
import { TeamView } from './components/TeamView';
import { ClientsView } from './components/ClientsView';

// Types
import { 
  AppState, 
  Client, 
  TeamMember, 
  Workflow, 
  KanbanColumn, 
  KanbanTask,
  DashboardStats 
} from './types';

// Styles
import './styles/app.css';

// Initial data
const initialKanbanColumns: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', color: '#64748b', order: 1 },
  { id: 'in-progress', title: 'In Progress', color: '#3b82f6', order: 2 },
  { id: 'review', title: 'Review', color: '#f59e0b', order: 3 },
  { id: 'done', title: 'Done', color: '#10b981', order: 4 }
];

const initialTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'Project Manager',
    skills: ['Project Management', 'Agile', 'Communication'],
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah@company.com',
    role: 'Developer',
    skills: ['React', 'TypeScript', 'Node.js'],
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@company.com',
    role: 'Designer',
    skills: ['UI/UX Design', 'Figma', 'Prototyping'],
    isActive: true,
    createdAt: new Date()
  }
];

const initialClients: Client[] = [
  {
    id: '1',
    name: 'Alice Smith',
    company: 'TechCorp Inc.',
    email: 'alice@techcorp.com',
    phone: '+1-555-0123',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Bob Johnson',
    company: 'StartupXYZ',
    email: 'bob@startupxyz.com',
    isActive: true,
    createdAt: new Date()
  }
];

const initialWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX',
    clientId: '1',
    steps: [
      {
        id: 'step1',
        name: 'Project Kickoff',
        description: 'Initial meeting and requirements gathering',
        type: 'start-end',
        assignedMembers: ['1'],
        position: { x: 100, y: 100 },
        status: 'completed',
        dependencies: []
      },
      {
        id: 'step2',
        name: 'Design Mockups',
        description: 'Create wireframes and visual designs',
        type: 'process',
        assignedMembers: ['3'],
        position: { x: 100, y: 200 },
        status: 'in-progress',
        dependencies: ['step1']
      },
      {
        id: 'step3',
        name: 'Development',
        description: 'Frontend and backend implementation',
        type: 'process',
        assignedMembers: ['2'],
        position: { x: 100, y: 300 },
        status: 'pending',
        dependencies: ['step2']
      }
    ],
    connections: [
      { id: 'conn1', source: 'step1', target: 'step2' },
      { id: 'conn2', source: 'step2', target: 'step3' }
    ],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    startDate: new Date(),
    expectedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }
];

const initialTasks: KanbanTask[] = [
  {
    id: '1',
    title: 'Create user research plan',
    description: 'Develop comprehensive research methodology',
    workflowId: '1',
    stepId: 'step2',
    assignedMembers: ['3'],
    priority: 'high',
    status: 'in-progress',
    tags: ['research', 'planning'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Setup development environment',
    description: 'Configure build tools and development workflow',
    workflowId: '1',
    stepId: 'step3',
    assignedMembers: ['2'],
    priority: 'medium',
    status: 'todo',
    tags: ['development', 'setup'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    clients: initialClients,
    teamMembers: initialTeamMembers,
    workflows: initialWorkflows,
    kanbanColumns: initialKanbanColumns,
    kanbanTasks: initialTasks,
    currentView: 'dashboard',
    selectedWorkflow: undefined,
    selectedClient: undefined
  });

  // Calculate dashboard stats
  const dashboardStats: DashboardStats = {
    totalClients: appState.clients.filter(c => c.isActive).length,
    activeWorkflows: appState.workflows.filter(w => w.status === 'active').length,
    completedTasks: appState.kanbanTasks.filter(t => t.status === 'done').length,
    teamMembers: appState.teamMembers.filter(m => m.isActive).length,
    overdueItems: appState.kanbanTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length
  };

  // Event handlers
  const handleViewChange = useCallback((view: string) => {
    setAppState(prev => ({ ...prev, currentView: view as any }));
  }, []);

  const handleNewWorkflow = useCallback(() => {
    // For now, just switch to workflows view
    // In a real app, this would open a modal or form
    handleViewChange('workflows');
  }, [handleViewChange]);

  // Workflow handlers
  const handleWorkflowCreate = useCallback(() => {
    console.log('Create new workflow');
    // TODO: Implement workflow creation modal
  }, []);

  const handleWorkflowEdit = useCallback((workflow: Workflow) => {
    setAppState(prev => ({
      ...prev,
      workflows: prev.workflows.map(w => 
        w.id === workflow.id ? workflow : w
      )
    }));
  }, []);

  const handleWorkflowStatusChange = useCallback((workflowId: string, status: string) => {
    setAppState(prev => ({
      ...prev,
      workflows: prev.workflows.map(w => 
        w.id === workflowId 
          ? { ...w, status: status as any, updatedAt: new Date() }
          : w
      )
    }));
  }, []);

  // Team member handlers
  const handleMemberCreate = useCallback(() => {
    console.log('Create new team member');
    // TODO: Implement team member creation modal
  }, []);

  const handleMemberEdit = useCallback((member: TeamMember) => {
    console.log('Edit team member:', member);
    // TODO: Implement team member edit modal
  }, []);

  const handleMemberStatusChange = useCallback((memberId: string, isActive: boolean) => {
    setAppState(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map(m => 
        m.id === memberId ? { ...m, isActive } : m
      )
    }));
  }, []);

  // Client handlers
  const handleClientCreate = useCallback(() => {
    console.log('Create new client');
    // TODO: Implement client creation modal
  }, []);

  const handleClientEdit = useCallback((client: Client) => {
    console.log('Edit client:', client);
    // TODO: Implement client edit modal
  }, []);

  const handleClientStatusChange = useCallback((clientId: string, isActive: boolean) => {
    setAppState(prev => ({
      ...prev,
      clients: prev.clients.map(c => 
        c.id === clientId ? { ...c, isActive } : c
      )
    }));
  }, []);

  // Kanban handlers
  const handleTaskMove = useCallback((taskId: string, newStatus: string) => {
    setAppState(prev => ({
      ...prev,
      kanbanTasks: prev.kanbanTasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      )
    }));
  }, []);

  const handleTaskCreate = useCallback((columnId: string) => {
    const newTask: KanbanTask = {
      id: uuidv4(),
      title: 'New Task',
      description: 'Task description',
      workflowId: appState.selectedWorkflow || appState.workflows[0]?.id || '',
      stepId: '',
      assignedMembers: [],
      priority: 'medium',
      status: columnId,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setAppState(prev => ({
      ...prev,
      kanbanTasks: [...prev.kanbanTasks, newTask]
    }));
  }, [appState.selectedWorkflow, appState.workflows]);

  const handleTaskEdit = useCallback((task: KanbanTask) => {
    // For now, just log the task
    // In a real app, this would open an edit modal
    console.log('Edit task:', task);
  }, []);

  // Render current view
  const renderCurrentView = () => {
    switch (appState.currentView) {
      case 'dashboard':
        return (
          <Dashboard
            stats={dashboardStats}
            recentClients={appState.clients}
            activeWorkflows={appState.workflows.filter(w => w.status === 'active')}
            teamMembers={appState.teamMembers}
            onViewChange={handleViewChange}
          />
        );

      case 'workflows':
        return (
          <WorkflowsView
            workflows={appState.workflows}
            clients={appState.clients}
            teamMembers={appState.teamMembers}
            onWorkflowCreate={handleWorkflowCreate}
            onWorkflowEdit={handleWorkflowEdit}
            onWorkflowStatusChange={handleWorkflowStatusChange}
          />
        );

      case 'kanban':
        return (
          <KanbanBoard
            columns={appState.kanbanColumns}
            tasks={appState.kanbanTasks}
            teamMembers={appState.teamMembers}
            workflows={appState.workflows}
            onTaskMove={handleTaskMove}
            onTaskCreate={handleTaskCreate}
            onTaskEdit={handleTaskEdit}
          />
        );

      case 'team':
        return (
          <TeamView
            teamMembers={appState.teamMembers}
            workflows={appState.workflows}
            tasks={appState.kanbanTasks}
            onMemberCreate={handleMemberCreate}
            onMemberEdit={handleMemberEdit}
            onMemberStatusChange={handleMemberStatusChange}
          />
        );

      case 'clients':
        return (
          <ClientsView
            clients={appState.clients}
            workflows={appState.workflows}
            tasks={appState.kanbanTasks}
            teamMembers={appState.teamMembers}
            onClientCreate={handleClientCreate}
            onClientEdit={handleClientEdit}
            onClientStatusChange={handleClientStatusChange}
          />
        );

      default:
        return (
          <Dashboard
            stats={dashboardStats}
            recentClients={appState.clients}
            activeWorkflows={appState.workflows.filter(w => w.status === 'active')}
            teamMembers={appState.teamMembers}
            onViewChange={handleViewChange}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar
        currentView={appState.currentView}
        onViewChange={handleViewChange}
        onNewWorkflow={handleNewWorkflow}
      />
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  );
}
