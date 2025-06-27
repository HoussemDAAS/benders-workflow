import { api } from './api';

export interface ActiveTimer {
  id: string;
  taskId?: string;
  taskTitle?: string;
  taskPriority?: string;
  workflowName?: string;
  clientName?: string;
  startTime: string;
  description?: string;
  isBreak: boolean;
  elapsedSeconds: number;
  totalPausedDuration: number;
  isPaused: boolean;
  pauseReason?: string;
  pausedAt?: string;
  currentPauseDuration: number;
  createdAt: string;
}

export interface TimerStatus {
  hasActiveTimer: boolean;
  timer: ActiveTimer | null;
}

export interface StartTimerData {
  taskId?: string;
  description?: string;
  isBreak?: boolean;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  taskTitle?: string;
  startTime: string;
  endTime: string;
  duration: number;
  description?: string;
  isBreak: boolean;
  categoryId?: string;
  categoryName?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeEntryData {
  taskId?: string;
  startTime: string;
  endTime: string;
  description?: string;
  isBreak?: boolean;
  categoryId?: string;
}

export interface UpdateTimeEntryData extends Partial<CreateTimeEntryData> {}

export interface TimeEntryFilters {
  start_date?: string;
  end_date?: string;
  task_id?: string;
  category_id?: string;
  is_break?: boolean;
}

export interface TimeStats {
  totalHours: number;
  totalMinutes: number;
  todayHours: number;
  weekHours: number;
  monthHours: number;
  taskBreakdown: Array<{
    taskId: string;
    taskTitle: string;
    hours: number;
    percentage: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    hours: number;
    percentage: number;
  }>;
  dailyAverage: number;
  weeklyTrend: Array<{
    date: string;
    hours: number;
  }>;
}

export interface TimerActivity {
  id: string;
  entityType: string;
  entityId: string;
  action: 'started' | 'paused' | 'resumed' | 'stopped';
  performedBy: string;
  performedByName: string;
  details: {
    taskId?: string;
    description?: string;
    isBreak?: boolean;
    startTime?: string;
    pausedAt?: string;
    reason?: string;
    pausedDuration?: number;
    totalPausedDuration?: number;
    totalDuration?: number;
    timeEntryId?: string;
    workspaceId?: string;
  };
  createdAt: string;
}

export interface TimerSession {
  timerId: string;
  activities: TimerActivity[];
  timeEntry: TimeEntry | null;
}

export interface TimerActivitiesResponse {
  activities: TimerActivity[];
  sessions: TimerSession[];
  timeEntries: TimeEntry[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface TimerSessionFilters {
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export const timeTrackerService = {
  // Get current timer status
  async getStatus(): Promise<TimerStatus> {
    return await api.get('/time-tracker/status');
  },

  // Start a new timer
  async startTimer(data: StartTimerData): Promise<{ message: string; timer: ActiveTimer }> {
    return await api.post('/time-tracker/start', data);
  },

  // Pause current timer with reason
  async pauseTimer(reason?: string): Promise<{ message: string; pausedAt: string; reason: string }> {
    return await api.post('/time-tracker/pause', { reason });
  },

  // Resume paused timer
  async resumeTimer(): Promise<{ message: string; pausedDuration: number; totalPausedDuration: number }> {
    return await api.post('/time-tracker/resume', {});
  },

  // Stop current timer and create time entry
  async stopTimer(): Promise<{ message: string; timeEntry: TimeEntry }> {
    return await api.post('/time-tracker/stop', {});
  }
};

export const timeEntriesService = {
  // Get time entries with optional filters
  async getTimeEntries(filters?: TimeEntryFilters): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.task_id) params.append('task_id', filters.task_id);
    if (filters?.category_id) params.append('category_id', filters.category_id);
    if (filters?.is_break !== undefined) params.append('is_break', filters.is_break.toString());

    const queryString = params.toString();
    const url = queryString ? `/time-entries?${queryString}` : '/time-entries';
    
    return await api.get(url);
  },

  // Create manual time entry
  async createTimeEntry(data: CreateTimeEntryData): Promise<TimeEntry> {
    return await api.post('/time-entries', data);
  },

  // Update time entry
  async updateTimeEntry(entryId: string, data: UpdateTimeEntryData): Promise<TimeEntry> {
    return await api.put(`/time-entries/${entryId}`, data);
  },

  // Delete time entry
  async deleteTimeEntry(entryId: string): Promise<void> {
    await api.delete(`/time-entries/${entryId}`);
  },

  // Get time entry by ID
  async getTimeEntry(entryId: string): Promise<TimeEntry> {
    return await api.get(`/time-entries/${entryId}`);
  },

  // Get time tracking statistics
  async getStats(filters?: { start_date?: string; end_date?: string }): Promise<TimeStats> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const queryString = params.toString();
    const url = queryString ? `/time-entries/stats?${queryString}` : '/time-entries/stats';
    
    return await api.get(url);
  },

  // Get timer activities and sessions for time breakdown
  async getTimerActivities(filters?: TimerSessionFilters): Promise<TimerActivitiesResponse> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/time-entries/activities?${queryString}` : '/time-entries/activities';
    
    return await api.get(url);
  }
};

// Utility functions for time formatting
export const timeUtils = {
  // Format seconds to HH:MM:SS
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Format seconds to human readable (e.g., "2h 30m")
  formatDurationHuman(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '< 1m';
    }
  },

  // Convert hours to seconds
  hoursToSeconds(hours: number): number {
    return Math.floor(hours * 3600);
  },

  // Convert seconds to hours (decimal)
  secondsToHours(seconds: number): number {
    return seconds / 3600;
  },

  // Get today's date in YYYY-MM-DD format
  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  },

  // Get week start date (Monday) in YYYY-MM-DD format
  getWeekStartString(): string {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  },

  // Get month start date in YYYY-MM-DD format
  getMonthStartString(): string {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  }
};

export { timeTrackerService as default };