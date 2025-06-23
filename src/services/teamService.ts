/* TODO: Team service temporarily commented out for user authentication implementation
 * Team members will be replaced with authenticated users
 */

/*
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
    const queryParams = new URLSearchParams();
    if (params?.includeInactive) queryParams.append('includeInactive', 'true');
    if (params?.role) queryParams.append('role', params.role);
    
    return apiService.get(`/team?${queryParams.toString()}`);
  }

  async getById(id: string): Promise<TeamMember> {
    return apiService.get(`/team/${id}`);
  }

  async create(member: CreateTeamMemberRequest): Promise<TeamMember> {
    return apiService.post('/team', member);
  }

  async update(id: string, member: Partial<CreateTeamMemberRequest>): Promise<TeamMember> {
    return apiService.put(`/team/${id}`, member);
  }

  async updateStatus(id: string, isActive: boolean): Promise<TeamMember> {
    return apiService.patch(`/team/${id}/status`, { isActive });
  }

  async updateSkills(id: string, skills: string[]): Promise<TeamMember> {
    return apiService.patch(`/team/${id}/skills`, { skills });
  }

  async delete(id: string): Promise<void> {
    return apiService.delete(`/team/${id}`);
  }

  // Workload and assignments
  async getWorkload(id: string): Promise<TeamMemberWorkload> {
    return apiService.get(`/team/${id}/workload`);
  }

  async getAssignments(id: string): Promise<TeamMemberAssignments> {
    return apiService.get(`/team/${id}/assignments`);
  }

  async getSteps(id: string): Promise<any[]> {
    return apiService.get(`/team/${id}/steps`);
  }

  async getTasks(id: string): Promise<any[]> {
    return apiService.get(`/team/${id}/tasks`);
  }

  async getMeetings(id: string): Promise<any[]> {
    return apiService.get(`/team/${id}/meetings`);
  }
}

export const teamService = new TeamService();
*/

// TODO: Export mock service until user authentication is implemented
export const teamService = {
  getAll: () => Promise.resolve([]),
  getById: () => Promise.resolve({}),
  create: () => Promise.resolve({}),
  update: () => Promise.resolve({}),
  updateStatus: () => Promise.resolve({}),
  updateSkills: () => Promise.resolve({}),
  delete: () => Promise.resolve(),
  getWorkload: () => Promise.resolve({}),
  getAssignments: () => Promise.resolve({ steps: [], tasks: [], meetings: [] }),
  getSteps: () => Promise.resolve([]),
  getTasks: () => Promise.resolve([]),
  getMeetings: () => Promise.resolve([])
};