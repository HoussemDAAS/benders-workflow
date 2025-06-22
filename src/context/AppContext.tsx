import React, { createContext, useMemo } from 'react';
import { useMultipleApi } from '../hooks/useApi';
import {
  clientService,
  teamService,
  workflowService,
  taskService,
  dashboardService,
  meetingService,
} from '../services';
import { Client, TeamMember, Workflow, KanbanTask, Meeting, DashboardStats, KanbanColumn } from '../types';

interface AppContextType {
  // Data
  clients: Client[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  meetings: Meeting[];
  kanbanColumns: KanbanColumn[];
  kanbanTasks: KanbanTask[];
  dashboardStats: DashboardStats;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
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

  // Extract data with fallbacks
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

  const contextValue: AppContextType = {
    clients,
    teamMembers,
    workflows,
    meetings,
    kanbanColumns,
    kanbanTasks,
    dashboardStats,
    loading,
    error,
    refresh,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;