import { api } from './api';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  taskId?: string;
  description?: string;
  eventType: 'task' | 'meeting' | 'break' | 'personal';
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventData {
  title: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  taskId?: string;
  description?: string;
  eventType?: 'task' | 'meeting' | 'break' | 'personal';
  color?: string;
}

export interface UpdateCalendarEventData extends Partial<CreateCalendarEventData> {}

export interface CalendarFilters {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  taskId?: string;
}

export const calendarService = {
  // Get calendar events with optional filters
  async getEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    if (filters?.taskId) params.append('taskId', filters.taskId);

    const queryString = params.toString();
    const url = queryString ? `/calendar?${queryString}` : '/calendar';
    
    const response = await api.get<{events: CalendarEvent[]}>(url);
    return response.events || [];
  },

  // Get events for a specific date
  async getDailyEvents(date: string): Promise<CalendarEvent[]> {
    return await api.get(`/calendar/daily/${date}`);
  },

  // Get events for a specific week
  async getWeeklyEvents(date: string): Promise<CalendarEvent[]> {
    return await api.get(`/calendar/weekly/${date}`);
  },

  // Get events for a specific month
  async getMonthlyEvents(year: number, month: number): Promise<CalendarEvent[]> {
    return await api.get(`/calendar/monthly/${year}/${month}`);
  },

  // Create a new calendar event
  async createEvent(eventData: CreateCalendarEventData): Promise<CalendarEvent> {
    const response = await api.post<{event: CalendarEvent}>('/calendar', eventData);
    return response.event;
  },

  // Update an existing calendar event
  async updateEvent(eventId: string, eventData: UpdateCalendarEventData): Promise<CalendarEvent> {
    const response = await api.put<{event: CalendarEvent}>(`/calendar/${eventId}`, eventData);
    return response.event;
  },

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/calendar/${eventId}`);
  },

  // Get event by ID
  async getEvent(eventId: string): Promise<CalendarEvent> {
    return await api.get(`/calendar/${eventId}`);
  }
};

export default calendarService;