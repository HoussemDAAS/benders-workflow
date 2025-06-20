import { apiService } from './api';
import type { TeamMember } from '../types';

export interface CreateTeamMemberRequest {
  name: string;
  email: string;
  role: string;
  skills?: string[];
  isActive?: boolean;
}

export interface TeamMemberWorkload {
  totalSteps: number;
  activeSteps: number;
  totalTasks: number;
  activeTasks: number;
  overallLoad: number;
}

export interface TeamMemberAssignments {
  steps: any[];
  tasks: any[];
  meetings: any[];
}

export class TeamService {
  async getAll(params?: {
    includeInactive?: boolean;
    role?: string;
  }): Promise<TeamMember[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.includeInactive) searchParams.append('includeInactive', 'true');
    if (params?.role) searchParams.append('role', params.role);
    
    const queryString = searchParams.toString();
    return apiService.get<TeamMember[]>(`/team${queryString ? `?${queryString}` : ''}`);
  }

  async getById(id: string): Promise<TeamMember> {
    return apiService.get<TeamMember>(`/team/${id}`);
  }

  async create(member: CreateTeamMemberRequest): Promise<TeamMember> {
    return apiService.post<TeamMember>('/team', member);
  }

  async update(id: string, member: Partial<CreateTeamMemberRequest>): Promise<TeamMember> {
    return apiService.put<TeamMember>(`/team/${id}`, member);
  }

  async updateStatus(id: string, isActive: boolean): Promise<TeamMember> {
    return apiService.patch<TeamMember>(`/team/${id}/status`, { isActive });
  }

  async updateSkills(id: string, skills: string[]): Promise<TeamMember> {
    return apiService.patch<TeamMember>(`/team/${id}/skills`, { skills });
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/team/${id}`);
  }

  // Workload and assignments
  async getWorkload(id: string): Promise<TeamMemberWorkload> {
    return apiService.get<TeamMemberWorkload>(`/team/${id}/workload`);
  }

  async getAssignments(id: string): Promise<TeamMemberAssignments> {
    return apiService.get<TeamMemberAssignments>(`/team/${id}/assignments`);
  }

  async getSteps(id: string) {
    return apiService.get(`/team/${id}/steps`);
  }

  async getTasks(id: string) {
    return apiService.get(`/team/${id}/tasks`);
  }

  async getMeetings(id: string) {
    return apiService.get(`/team/${id}/meetings`);
  }
}

export const teamService = new TeamService(); 