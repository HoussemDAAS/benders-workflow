import { api } from './api';
import type { KanbanTask, KanbanColumn } from '../types';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  workflowId?: string;
  stepId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  tags?: string[];
  dueDate?: string;
  assignedMembers?: string[];
  clientId?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

export class TaskService {
  async getAll(params?: {
    status?: string;
    workflowId?: string;
    overdue?: boolean;
    priority?: string;
  }): Promise<KanbanTask[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.append('status', params.status);
    if (params?.workflowId) searchParams.append('workflowId', params.workflowId);
    if (params?.overdue) searchParams.append('overdue', 'true');
    if (params?.priority) searchParams.append('priority', params.priority);
    
    const queryString = searchParams.toString();
    return api.get<KanbanTask[]>(`/tasks${queryString ? `?${queryString}` : ''}`);
  }

  async getById(id: string): Promise<KanbanTask> {
    return api.get<KanbanTask>(`/tasks/${id}`);
  }

  async getByWorkflow(workflowId: string): Promise<KanbanTask[]> {
    return api.get<KanbanTask[]>(`/tasks/by-workflow/${workflowId}`);
  }

  async getByClient(clientId: string): Promise<KanbanTask[]> {
    return api.get<KanbanTask[]>(`/tasks/by-client/${clientId}`);
  }

  async getColumns(): Promise<KanbanColumn[]> {
    return api.get<KanbanColumn[]>('/tasks/columns');
  }

  async create(task: CreateTaskRequest): Promise<KanbanTask> {
    return api.post<KanbanTask>('/tasks', task);
  }

  async update(id: string, task: Partial<CreateTaskRequest>): Promise<KanbanTask> {
    return api.put<KanbanTask>(`/tasks/${id}`, task);
  }

  async move(id: string, newStatus: string): Promise<KanbanTask> {
    return api.patch<KanbanTask>(`/tasks/${id}/move`, { status: newStatus });
  }

  async updatePriority(id: string, priority: string): Promise<KanbanTask> {
    return api.patch<KanbanTask>(`/tasks/${id}/priority`, { priority });
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  }

  async assignMember(taskId: string, memberId: string): Promise<any> {
    return api.post<void>(`/tasks/${taskId}/assign`, { memberId });
  }

  async unassignMember(taskId: string, memberId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/assign/${memberId}`);
  }

  async getAssignedMembers(taskId: string) {
    return api.get(`/tasks/${taskId}/assigned-members`);
  }

  // Column management
  async createColumn(column: { id: string; title: string; color?: string; orderIndex?: number }): Promise<KanbanColumn> {
    return api.post<KanbanColumn>('/tasks/columns', column);
  }

  async updateColumn(id: string, column: { title: string; color?: string; orderIndex?: number }): Promise<KanbanColumn> {
    return api.put<KanbanColumn>(`/tasks/columns/${id}`, column);
  }

  async deleteColumn(id: string): Promise<void> {
    await api.delete(`/tasks/columns/${id}`);
  }
}

export const taskService = new TaskService(); 