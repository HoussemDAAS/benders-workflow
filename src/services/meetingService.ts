import { apiService } from './api';

export interface CreateMeetingRequest {
  title: string;
  type: 'in-person' | 'video' | 'phone';
  scheduledDate: string;
  clientId: string;
  duration: number;
  description?: string;
  location?: string;
  attendeeIds?: string[];
}

export interface Meeting {
  id: string;
  title: string;
  type: 'in-person' | 'video' | 'phone';
  scheduledDate: string;
  clientId: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  description?: string;
  location?: string;
  notes?: string;
  attendeeIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingWithDetails extends Meeting {
  client: {
    id: string;
    name: string;
    company?: string;
  };
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export class MeetingService {
  async getAll(params?: {
    clientId?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Meeting[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    
    const queryString = searchParams.toString();
    return apiService.get<Meeting[]>(`/meetings${queryString ? `?${queryString}` : ''}`);
  }

  async getById(id: string): Promise<MeetingWithDetails> {
    return apiService.get<MeetingWithDetails>(`/meetings/${id}`);
  }

  async create(meeting: CreateMeetingRequest): Promise<Meeting> {
    return apiService.post<Meeting>('/meetings', meeting);
  }

  async update(id: string, meeting: Partial<CreateMeetingRequest>): Promise<Meeting> {
    return apiService.put<Meeting>(`/meetings/${id}`, meeting);
  }

  async updateStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled'): Promise<Meeting> {
    return apiService.patch<Meeting>(`/meetings/${id}/status`, { status });
  }

  async addNotes(id: string, notes: string): Promise<Meeting> {
    return apiService.patch<Meeting>(`/meetings/${id}/notes`, { notes });
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/meetings/${id}`);
  }

  // Attendee management
  async addAttendee(meetingId: string, memberId: string): Promise<any> {
    return apiService.post<void>(`/meetings/${meetingId}/attendees`, { memberId });
  }

  async removeAttendee(meetingId: string, memberId: string): Promise<void> {
    await apiService.delete(`/meetings/${meetingId}/attendees/${memberId}`);
  }

  async getAttendees(meetingId: string) {
    return apiService.get(`/meetings/${meetingId}/attendees`);
  }

  // Date range queries
  async getUpcoming(days = 7): Promise<Meeting[]> {
    return apiService.get<Meeting[]>(`/meetings/upcoming?days=${days}`);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Meeting[]> {
    return apiService.get<Meeting[]>(`/meetings/range?start=${startDate}&end=${endDate}`);
  }

  // Calendar integration helpers
  async getTodaysMeetings(): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDateRange(today, today);
  }

  async getThisWeeksMeetings(): Promise<Meeting[]> {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
    
    return this.getByDateRange(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0]
    );
  }
}

export const meetingService = new MeetingService(); 