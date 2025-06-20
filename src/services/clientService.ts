import { apiService } from './api';
import type { Client } from '../types';

export interface CreateClientRequest {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateClientRequest extends CreateClientRequest {
  id: string;
}

export class ClientService {
  async getAll(includeInactive = false): Promise<Client[]> {
    const params = includeInactive ? '?include_inactive=true' : '';
    return apiService.get<Client[]>(`/clients${params}`);
  }

  async getById(id: string): Promise<Client> {
    return apiService.get<Client>(`/clients/${id}`);
  }

  async create(client: CreateClientRequest): Promise<Client> {
    return apiService.post<Client>('/clients', client);
  }

  async update(id: string, client: Partial<CreateClientRequest>): Promise<Client> {
    return apiService.put<Client>(`/clients/${id}`, client);
  }

  async updateStatus(id: string, isActive: boolean): Promise<Client> {
    return apiService.patch<Client>(`/clients/${id}/status`, { isActive });
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/clients/${id}`);
  }

  async getWorkflows(id: string) {
    return apiService.get(`/clients/${id}/workflows`);
  }

  async getMeetings(id: string) {
    return apiService.get(`/clients/${id}/meetings`);
  }

  async getTasks(id: string) {
    return apiService.get(`/clients/${id}/tasks`);
  }
}

export const clientService = new ClientService(); 