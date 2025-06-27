import { api } from './api';

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  task_id?: string;
  description?: string;
  event_type: 'task' | 'meeting' | 'break' | 'personal';
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventData {
  title: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  task_id?: string;
  description?: string;
  event_type?: 'task' | 'meeting' | 'break' | 'personal';
  color?: string;
}

export interface UpdateCalendarEventData extends Partial<CreateCalendarEventData> {}

export interface CalendarFilters {
  start_date?: string;
  end_date?: string;
  event_type?: string;
  task_id?: string;
}

export const calendarService = {
  // Get calendar events with optional filters
  async getEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.event_type) params.append('event_type', filters.event_type);
    if (filters?.task_id) params.append('task_id', filters.task_id);

    const queryString = params.toString();
    const url = queryString ? `/calendar/events?${queryString}` : '/calendar/events';
    
    return await api.get(url);
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
    return await api.post('/calendar/events', eventData);
  },

  // Update an existing calendar event
  async updateEvent(eventId: string, eventData: UpdateCalendarEventData): Promise<CalendarEvent> {
    return await api.put(`/calendar/events/${eventId}`, eventData);
  },

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/calendar/events/${eventId}`);
  },

  // Get event by ID
  async getEvent(eventId: string): Promise<CalendarEvent> {
    return await api.get(`/calendar/events/${eventId}`);
  }
};

export default calendarService;