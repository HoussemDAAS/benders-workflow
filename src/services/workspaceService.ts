import { api } from './api'
import type { Workspace } from '../types'

export interface CreateWorkspaceData {
  name: string
  description?: string
}

export interface JoinWorkspaceData {
  inviteCode: string
}

export interface UpdateWorkspaceData {
  name?: string
  description?: string
}

export interface AddMemberData {
  email: string
  role?: 'admin' | 'member'
}

class WorkspaceService {
  // Get all workspaces for current user
  async getWorkspaces(): Promise<Workspace[]> {
    return await api.get<Workspace[]>('/workspaces')
  }

  // Get workspace by ID
  async getWorkspace(id: string): Promise<Workspace> {
    return await api.get<Workspace>(`/workspaces/${id}`)
  }

  // Create new workspace
  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    return await api.post<Workspace>('/workspaces', data)
  }

  // Join workspace by invite code
  async joinWorkspace(data: JoinWorkspaceData): Promise<{ message: string; workspace: Workspace }> {
    return await api.post<{ message: string; workspace: Workspace }>('/workspaces/join', data)
  }

  // Update workspace
  async updateWorkspace(id: string, data: UpdateWorkspaceData): Promise<Workspace> {
    return await api.put<Workspace>(`/workspaces/${id}`, data)
  }

  // Regenerate invite code
  async regenerateInviteCode(id: string): Promise<{ message: string; inviteCode: string }> {
    return await api.post<{ message: string; inviteCode: string }>(`/workspaces/${id}/regenerate-invite`, {})
  }

  // Add member to workspace
  async addMember(id: string, data: AddMemberData): Promise<{ message: string; member: any }> {
    return await api.post<{ message: string; member: any }>(`/workspaces/${id}/members`, data)
  }

  // Remove member from workspace
  async removeMember(workspaceId: string, userId: string): Promise<{ message: string }> {
    const response = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return response as { message: string };
  }

  // Update member role
  async updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'member'): Promise<{ message: string }> {
    return await api.put<{ message: string }>(`/workspaces/${workspaceId}/members/${userId}/role`, { role })
  }

  // Delete workspace
  async deleteWorkspace(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/workspaces/${id}`);
    return response as { message: string };
  }
}

export const workspaceService = new WorkspaceService() 