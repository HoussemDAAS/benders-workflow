import { apiService } from './api';
import type { DashboardStats } from '../types';

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: any[];
  taskDistribution: any[];
  workflowProgress: any[];
  teamWorkload: any[];
  upcomingDeadlines: any[];
  clientActivity: any[];
  performanceMetrics: {
    avgTaskCompletionTime: number;
    avgWorkflowCompletionTime: number;
    clientSatisfactionScore: number;
    teamProductivityScore: number;
  };
}

export interface MeetingData {
  id: string;
  title: string;
  type: 'in-person' | 'video' | 'phone';
  scheduledDate: string;
  clientId: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  attendeeIds: string[];
  description?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    return apiService.get<DashboardStats>('/dashboard/stats');
  }

  async getRecentActivity(limit = 10) {
    return apiService.get(`/dashboard/recent-activity?limit=${limit}`);
  }

  async getTaskDistribution() {
    return apiService.get('/dashboard/task-distribution');
  }

  async getWorkflowProgress() {
    return apiService.get('/dashboard/workflow-progress');
  }

  async getTeamWorkload() {
    return apiService.get('/dashboard/team-workload');
  }

  async getUpcomingDeadlines(days = 7) {
    return apiService.get(`/dashboard/upcoming-deadlines?days=${days}`);
  }

  async getClientActivity() {
    return apiService.get('/dashboard/client-activity');
  }

  async getPerformanceMetrics() {
    return apiService.get('/dashboard/performance-metrics');
  }

  async getFullDashboard(): Promise<DashboardData> {
    // Get all dashboard data in parallel for better performance
    const [
      stats,
      recentActivity,
      taskDistribution,
      workflowProgress,
      teamWorkload,
      upcomingDeadlines,
      clientActivity,
      performanceMetrics
    ] = await Promise.all([
      this.getStats(),
      this.getRecentActivity(),
      this.getTaskDistribution(),
      this.getWorkflowProgress(),
      this.getTeamWorkload(),
      this.getUpcomingDeadlines(),
      this.getClientActivity(),
      this.getPerformanceMetrics()
    ]);

    return {
      stats,
      recentActivity,
      taskDistribution,
      workflowProgress,
      teamWorkload,
      upcomingDeadlines,
      clientActivity,
      performanceMetrics
    };
  }
}

export const dashboardService = new DashboardService(); 