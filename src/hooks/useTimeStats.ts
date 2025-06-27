import { useState, useEffect, useCallback } from 'react';
import { timeEntriesService } from '../services/timeTrackingService';

interface TaskBreakdown {
  taskId: string;
  taskTitle: string;
  hours: number;
  percentage: number;
}

interface CategoryBreakdown {
  categoryName: string;
  hours: number;
  percentage: number;
}

export interface TimeStatsData {
  todayStats: {
    totalTime: string;
    productiveTime: string;
    breakTime: string;
    tasksCompleted: number;
    efficiency: number;
  };
  weeklyStats: Array<{
    day: string;
    hours: number;
  }>;
  categories: Array<{
    name: string;
    time: string;
    percentage: number;
    color: string;
  }>;
}

export const useTimeStats = () => {
  const [data, setData] = useState<TimeStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTime = useCallback((hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return minutes > 0 ? `${minutes}m` : '0m';
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  }, []);

  const getWeekDays = useCallback(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
    const currentDayOfWeek = today.getDay();
    
    // Convert Sunday (0) to 6, Monday (1) to 0, etc. for our array
    const mondayBasedIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    return days.map((day, index) => ({
      day,
      isToday: index === mondayBasedIndex,
      date: new Date(today.getTime() - (mondayBasedIndex - index) * 24 * 60 * 60 * 1000)
    }));
  }, []);

  const fetchTimeStats = useCallback(async () => {
    try {
      setError(null);
      
      // Get current date ranges - focus on today and last 7 days for weekly trend
      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      
      // Get last 7 days for weekly trend
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      console.log('🔍 Fetching time stats for today and weekly trend...');
      console.log('📅 Today range:', startOfToday.toISOString(), 'to', endOfToday.toISOString());
      console.log('📊 Weekly range:', weekStart.toISOString(), 'to', endOfToday.toISOString());
      
      // Fetch today's statistics
      const todayStats = await timeEntriesService.getStats({
        start_date: startOfToday.toISOString(),
        end_date: endOfToday.toISOString()
      });

      // Fetch weekly statistics for trend
      const weeklyStats = await timeEntriesService.getStats({
        start_date: weekStart.toISOString(),
        end_date: endOfToday.toISOString()
      });

      console.log('📊 Today\'s stats from backend:', todayStats);
      console.log('📊 Weekly stats from backend:', weeklyStats);
      console.log('📋 Category breakdown:', todayStats.categoryBreakdown);

      // Calculate break time (assuming non-task time is break time)
      const totalTaskHours = todayStats.taskBreakdown.reduce((sum: number, task: TaskBreakdown) => sum + task.hours, 0);
      const breakHours = Math.max(0, todayStats.todayHours - totalTaskHours);
      
      // Calculate efficiency (productive vs total time)
      const efficiency = todayStats.todayHours > 0 ? Math.round((totalTaskHours / todayStats.todayHours) * 100) : 0;

      // Get weekly data from the trend
      const weekDays = getWeekDays();
      const weeklyTrendData = weekDays.map((dayInfo, index) => {
        // Find matching data from the last 7 days of weeklyTrend
        const trendData = weeklyStats.weeklyTrend[index] || { hours: 0 };
        return {
          day: dayInfo.day,
          hours: trendData.hours
        };
      });

      // Transform category breakdown with colors
      const categoryColors = [
        'bg-gradient-to-r from-blue-500 to-blue-600',
        'bg-gradient-to-r from-green-500 to-green-600',
        'bg-gradient-to-r from-purple-500 to-purple-600',
        'bg-gradient-to-r from-orange-500 to-orange-600',
        'bg-gradient-to-r from-pink-500 to-pink-600',
        'bg-gradient-to-r from-indigo-500 to-indigo-600',
        'bg-gradient-to-r from-red-500 to-red-600'
      ];

      const categories = todayStats.categoryBreakdown.map((category: CategoryBreakdown, index: number) => ({
        name: category.categoryName,
        time: formatTime(category.hours),
        percentage: category.percentage,
        color: categoryColors[index % categoryColors.length]
      }));

      console.log('🎨 Transformed categories:', categories);

      // Count tasks completed (from task breakdown)
      const tasksCompleted = todayStats.taskBreakdown.length;

      const transformedData = {
        todayStats: {
          totalTime: formatTime(todayStats.todayHours),
          productiveTime: formatTime(totalTaskHours),
          breakTime: formatTime(breakHours),
          tasksCompleted,
          efficiency
        },
        weeklyStats: weeklyTrendData,
        categories
      };

      console.log('✅ Final transformed data:', transformedData);
      setData(transformedData);

    } catch (err) {
      console.error('❌ Failed to fetch time stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load time statistics');
    } finally {
      setIsLoading(false);
    }
  }, [formatTime, getWeekDays]);

  const refreshStats = useCallback(() => {
    setIsLoading(true);
    fetchTimeStats();
  }, [fetchTimeStats]);

  useEffect(() => {
    fetchTimeStats();
  }, [fetchTimeStats]);

  return {
    data,
    isLoading,
    error,
    refreshStats
  };
};

export default useTimeStats;