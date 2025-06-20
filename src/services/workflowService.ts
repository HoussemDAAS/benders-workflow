import { apiService } from './api';
import type { Workflow } from '../types';

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  clientId: string;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate?: string;
  expectedEndDate?: string;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  type: 'start-end' | 'process' | 'decision' | 'input-output';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  positionX: number;
  positionY: number;
  createdAt: Date;
  updatedAt: Date;
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

export class WorkflowService {
  async getAll(params?: {
    status?: string;
    clientId?: string;
  }): Promise<Workflow[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.append('status', params.status);
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    
    const queryString = searchParams.toString();
    return apiService.get<Workflow[]>(`/workflows${queryString ? `?${queryString}` : ''}`);
  }

  async getById(id: string): Promise<Workflow> {
    return apiService.get<Workflow>(`/workflows/${id}`);
  }

  async create(workflow: CreateWorkflowRequest): Promise<Workflow> {
    return apiService.post<Workflow>('/workflows', workflow);
  }

  async update(id: string, workflow: Partial<CreateWorkflowRequest>): Promise<Workflow> {
    return apiService.put<Workflow>(`/workflows/${id}`, workflow);
  }

  async updateStatus(id: string, status: string): Promise<Workflow> {
    return apiService.patch<Workflow>(`/workflows/${id}/status`, { status });
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/workflows/${id}`);
  }

  // Steps management
  async getSteps(workflowId: string): Promise<WorkflowStep[]> {
    return apiService.get<WorkflowStep[]>(`/workflows/${workflowId}/steps`);
  }

  async createStep(workflowId: string, step: {
    name: string;
    description?: string;
    type: string;
    status?: string;
    positionX?: number;
    positionY?: number;
  }): Promise<WorkflowStep> {
    return apiService.post<WorkflowStep>(`/workflows/${workflowId}/steps`, step);
  }

  // Connections management
  async getConnections(workflowId: string): Promise<WorkflowConnection[]> {
    return apiService.get<WorkflowConnection[]>(`/workflows/${workflowId}/connections`);
  }

  async createConnection(workflowId: string, connection: {
    sourceStepId: string;
    targetStepId: string;
  }): Promise<WorkflowConnection> {
    return apiService.post<WorkflowConnection>(`/workflows/${workflowId}/connections`, connection);
  }

  async deleteConnection(workflowId: string, connectionId: string): Promise<void> {
    return apiService.delete<void>(`/workflows/${workflowId}/connections/${connectionId}`);
  }

  // Progress tracking
  async getProgress(workflowId: string): Promise<WorkflowProgress> {
    return apiService.get<WorkflowProgress>(`/workflows/${workflowId}/progress`);
  }
}

export const workflowService = new WorkflowService(); 