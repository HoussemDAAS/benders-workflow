import { api } from './api';

export interface TaskResource {
  id: string;
  taskId: string;
  type: 'document' | 'link' | 'image' | 'file';
  title: string;
  content?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskResourceRequest {
  type: 'document' | 'link' | 'image' | 'file';
  title: string;
  content?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface UpdateTaskResourceRequest {
  type: 'document' | 'link' | 'image' | 'file';
  title: string;
  content?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export const taskResourceService = {
  async getTaskResources(taskId: string): Promise<TaskResource[]> {
    return api.get(`/tasks/${taskId}/resources`);
  },

  async getTaskResource(taskId: string, resourceId: string): Promise<TaskResource> {
    return api.get(`/tasks/${taskId}/resources/${resourceId}`);
  },

  async createTaskResource(taskId: string, resource: CreateTaskResourceRequest): Promise<TaskResource> {
    return api.post(`/tasks/${taskId}/resources`, resource);
  },

  async updateTaskResource(
    taskId: string, 
    resourceId: string, 
    resource: UpdateTaskResourceRequest
  ): Promise<TaskResource> {
    return api.put(`/tasks/${taskId}/resources/${resourceId}`, resource);
  },

  async deleteTaskResource(taskId: string, resourceId: string): Promise<void> {
    return api.delete(`/tasks/${taskId}/resources/${resourceId}`);
  }
}; 