import { api, ApiError } from './api';

export interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  isCompleted: boolean;
  eventType: 'task' | 'meeting' | 'break' | 'personal';
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarTaskData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  eventType: 'task' | 'meeting' | 'break' | 'personal';
  linkedTaskId?: string;
}

export class CalendarTaskService {
  // Mark a calendar event as completed
  async markAsCompleted(eventId: string): Promise<void> {
    try {
      // Try the new completion endpoint first
      try {
        await api.patch(`/calendar/events/${eventId}/complete`, {});
        return;
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 404) {

          
          // Try to update the event
          try {
                        await api.put<{event: CalendarTask}>(`/calendar/${eventId}`, {
              description: '[COMPLETED]'
            });
            return;
          } catch (updateError: unknown) {
            if (updateError instanceof ApiError && updateError.status === 404) {
              // For local events, we'll handle completion in the UI layer
              // Store completion in localStorage as fallback
              const completedEvents = JSON.parse(localStorage.getItem('completed-events') || '[]');
              if (!completedEvents.includes(eventId)) {
                completedEvents.push(eventId);
                localStorage.setItem('completed-events', JSON.stringify(completedEvents));
              }
                              return;
            }
            throw updateError;
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to mark calendar event as completed:', error);
      throw error;
    }
  }

  // Check if an event is completed (including local-only events)
  isEventCompleted(eventId: string): boolean {
    const completedEvents = JSON.parse(localStorage.getItem('completed-events') || '[]');
    return completedEvents.includes(eventId);
  }

  // Create a new calendar task
  async createCalendarTask(data: CreateCalendarTaskData): Promise<CalendarTask> {
    const eventData = {
      title: data.title,
      description: data.description,
      start_time: data.startTime,
      end_time: data.endTime,
      all_day: data.allDay || false,
      event_type: data.eventType,
      task_id: data.linkedTaskId,
      is_completed: false
    };

    return await api.post('/calendar/events', eventData);
  }

  // Get completed events count for today (including local completions)
  async getTodayCompletedCount(): Promise<number> {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);



      const response = await api.get(`/calendar/events/completed-count?start_date=${startOfDay.toISOString()}&end_date=${endOfDay.toISOString()}`) as { count: number };
      
      // Add locally completed events count
      // Note: For a production app, we should filter local events by date too
      // For now, we assume all local events are from today
      const localCompletedEvents = JSON.parse(localStorage.getItem('completed-events') || '[]');
      const localCount = localCompletedEvents.length;
      

      
      return (response.count || 0) + localCount;
    } catch (error) {
      console.error('Failed to get completed events count, using local count only:', error);
      
      // If API fails, return only local count
      const localCompletedEvents = JSON.parse(localStorage.getItem('completed-events') || '[]');

      return localCompletedEvents.length;
    }
  }
}

export const calendarTaskService = new CalendarTaskService(); 