import { api } from './api';
import type { Workflow, WorkflowStep, KanbanColumn, KanbanTask } from '../types';

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  clientId: string;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate?: string;
  expectedEndDate?: string;
}

export interface WorkflowConnection {
  id: string;
  workflowId: string;
  sourceStepId: string;
  targetStepId: string;
  createdAt: Date;
}

export interface WorkflowProgress {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
}

export const workflowService = {
  async getAll(): Promise<Workflow[]> {
    const response = await api.get<Workflow[]>('/workflows');
    return response;
  },

  async getById(id: string): Promise<Workflow> {
    const response = await api.get<Workflow>(`/workflows/${id}`);
    return response;
  },

  async create(workflow: Partial<Workflow>): Promise<Workflow> {
    const response = await api.post<Workflow>('/workflows', workflow);
    return response;
  },

  async update(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    const response = await api.put<Workflow>(`/workflows/${id}`, workflow);
    return response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  async getSteps(workflowId: string): Promise<WorkflowStep[]> {
    const response = await api.get<WorkflowStep[]>(`/workflows/${workflowId}/steps`);
    return response;
  },

  async getProgress(workflowId: string): Promise<WorkflowProgress> {
    const response = await api.get<WorkflowProgress>(`/workflows/${workflowId}/progress`);
    return response;
  },

  async getKanbanColumns(workflowId: string): Promise<KanbanColumn[]> {
    const response = await api.get<KanbanColumn[]>(`/workflows/${workflowId}/kanban-columns`);
    return response;
  },

  async getKanbanTasks(workflowId: string): Promise<{ [stepId: string]: KanbanTask[] }> {
    const response = await api.get<{ [stepId: string]: KanbanTask[] }>(`/workflows/${workflowId}/kanban-tasks`);
    return response;
  },

  async createKanbanColumn(workflowId: string, column: Partial<KanbanColumn>): Promise<KanbanColumn> {
    const response = await api.post<KanbanColumn>(`/workflows/${workflowId}/kanban-columns`, column);
    return response;
  },

  async updateKanbanColumn(workflowId: string, stepId: string, column: Partial<KanbanColumn>): Promise<KanbanColumn> {
    const response = await api.put<KanbanColumn>(`/workflows/${workflowId}/kanban-columns/${stepId}`, column);
    return response;
  },

  async deleteKanbanColumn(workflowId: string, stepId: string): Promise<void> {
    await api.delete(`/workflows/${workflowId}/kanban-columns/${stepId}`);
  },

  async initializeDefaultColumns(workflowId: string): Promise<KanbanColumn[]> {
    const response = await api.post<KanbanColumn[]>(`/workflows/${workflowId}/initialize-default-columns`, {});
    return response;
  },

  async moveTaskToStep(taskId: string, stepId: string, performedBy?: string): Promise<KanbanTask> {
    const response = await api.patch<KanbanTask>(`/tasks/${taskId}/move-to-step`, {
      stepId,
      performedBy
    });
    return response;
  },

  async updateStatus(id: string, status: string): Promise<Workflow> {
    const response = await api.patch<Workflow>(`/workflows/${id}/status`, { status });
    return response;
  },

  // Connections management
  async getConnections(workflowId: string): Promise<WorkflowConnection[]> {
    const response = await api.get<WorkflowConnection[]>(`/workflows/${workflowId}/connections`);
    return response;
  },

  async createConnection(workflowId: string, connection: {
    sourceStepId: string;
    targetStepId: string;
  }): Promise<WorkflowConnection> {
    const response = await api.post<WorkflowConnection>(`/workflows/${workflowId}/connections`, connection);
    return response;
  },

  async deleteConnection(workflowId: string, connectionId: string): Promise<void> {
    await api.delete(`/workflows/${workflowId}/connections/${connectionId}`);
  },

  async createStep(workflowId: string, step: {
    name: string;
    description?: string;
    type: string;
    status?: string;
    positionX?: number;
    positionY?: number;
  }): Promise<WorkflowStep> {
    const response = await api.post<WorkflowStep>(`/workflows/${workflowId}/steps`, step);
    return response;
  }
}; 