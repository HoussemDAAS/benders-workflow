import React, { useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Target, 
  BarChart3,
  Activity,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTimeStats } from '../../hooks/useTimeStats';

export const TimeStats: React.FC = () => {
  const { data, isLoading, error, refreshStats } = useTimeStats();

  // Listen for refresh events from timer actions
  useEffect(() => {
    const handleRefresh = () => {
      refreshStats();
    };

    window.addEventListener('refreshTimeStats', handleRefresh);
    return () => window.removeEventListener('refreshTimeStats', handleRefresh);
  }, [refreshStats]);

  // Auto-refresh every 30 seconds when timer is active
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshStats]);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-gray-600">Loading time statistics...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span>Failed to load time statistics: {error}</span>
            <button
              onClick={refreshStats}
              className="ml-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default to empty data if not loaded yet
  const stats = data || {
    todayStats: {
      totalTime: '0m',
      productiveTime: '0m',
      breakTime: '0m',
      tasksCompleted: 0,
      efficiency: 0
    },
    weeklyStats: [],
    categories: []
  };

  // Calculate real trends from weekly data
  const calculateTrend = (currentValue: number, weeklyData: Array<{day: string, hours: number}>) => {
    if (weeklyData.length < 2) return { value: '0%', isUp: false };
    
    const lastWeekAvg = weeklyData.slice(0, -1).reduce((sum, day) => sum + day.hours, 0) / (weeklyData.length - 1);
    const todayValue = weeklyData[weeklyData.length - 1]?.hours || 0;
    
    if (lastWeekAvg === 0) return { value: '0%', isUp: false };
    
    const change = ((todayValue - lastWeekAvg) / lastWeekAvg) * 100;
    return {
      value: `${change >= 0 ? '+' : ''}${Math.round(change)}%`,
      isUp: change >= 0
    };
  };

  // Calculate productivity trend (productive time vs total time)
  const productiveTrend = (() => {
    const totalMinutes = parseInt(stats.todayStats.totalTime.replace(/[^\d]/g, '')) || 0;
    const productiveMinutes = parseInt(stats.todayStats.productiveTime.replace(/[^\d]/g, '')) || 0;
    
    if (totalMinutes === 0) return { value: '0%', isUp: false };
    
    const productivityRate = (productiveMinutes / totalMinutes) * 100;
    const targetProductivity = 80; // 80% target
    const diff = productivityRate - targetProductivity;
    
    return {
      value: `${diff >= 0 ? '+' : ''}${Math.round(diff)}%`,
      isUp: diff >= 0
    };
  })();

  // Get today's trend
  const todayTrend = calculateTrend(
    parseInt(stats.todayStats.totalTime.replace(/[^\d]/g, '')) || 0,
    stats.weeklyStats
  );

  const statCards = [
    {
      title: 'Total Time',
      value: stats.todayStats.totalTime,
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600',
      trend: isLoading ? '...' : todayTrend.value,
      trendUp: todayTrend.isUp
    },
    {
      title: 'Productive Time',
      value: stats.todayStats.productiveTime,
      icon: Target,
      gradient: 'from-green-500 to-green-600',
      trend: isLoading ? '...' : productiveTrend.value,
      trendUp: productiveTrend.isUp
    },
    {
      title: 'Tasks Done',
      value: stats.todayStats.tasksCompleted.toString(),
      icon: Activity,
      gradient: 'from-purple-500 to-purple-600',
      trend: isLoading ? '...' : `${stats.todayStats.tasksCompleted} today`,
      trendUp: stats.todayStats.tasksCompleted > 0
    },
    {
      title: 'Efficiency',
      value: `${stats.todayStats.efficiency}%`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-orange-600',
      trend: isLoading ? '...' : stats.todayStats.efficiency >= 70 ? 'Good' : 'Low',
      trendUp: stats.todayStats.efficiency >= 70
    }
  ];

  // Calculate weekly chart max value for scaling
  const maxWeeklyHours = Math.max(...stats.weeklyStats.map(day => day.hours), 8); // Min 8 hours for scale

  return (
    <div className="w-full">
      {/* Today's Performance - Full Width */}
      <div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900">Today's Performance</h3>
                {!isLoading && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600 text-sm">Track your productivity metrics</p>
                {data && (
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <button
                onClick={refreshStats}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <BarChart3 size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600 hidden sm:inline">Analytics</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div 
                  key={card.title}
                  className="group relative p-3 lg:p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Animated background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <Icon size={14} className="text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-200 ${
                          card.trendUp 
                            ? 'bg-green-100 text-green-700 group-hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 group-hover:bg-red-200'
                        }`}>
                          {card.trend}
                        </span>
                        {/* Progress indicator */}
                        {card.title === 'Efficiency' && (
                          <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                stats.todayStats.efficiency >= 70 ? 'bg-green-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${Math.min(stats.todayStats.efficiency, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-base lg:text-lg font-bold text-gray-900 truncate group-hover:text-gray-800 transition-colors">
                      {card.value}
                    </div>
                    <div className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">
                      {card.title}
                    </div>
                    
                    {/* Dynamic indicator */}
                    {!isLoading && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 animate-ping"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekly Chart */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Weekly Overview</h4>
            {stats.weeklyStats.length > 0 ? (
              <div className="flex items-end justify-between gap-1 lg:gap-2 h-20 lg:h-24">
                {stats.weeklyStats.map((day, index) => {
                  const isToday = index === stats.weeklyStats.length - 1;
                  const height = Math.max((day.hours / maxWeeklyHours) * 100, 2); // Min 2% height
                  
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-t-lg relative group cursor-pointer" style={{ height: '48px' }}>
                        <div 
                          className={`${
                            isToday 
                              ? 'bg-gradient-to-t from-primary to-accent' 
                              : 'bg-gradient-to-t from-gray-400 to-gray-500'
                          } rounded-t-lg transition-all duration-300 group-hover:from-primary group-hover:to-accent`}
                          style={{ 
                            height: `${height}%`,
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {day.hours.toFixed(1)}h
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${
                        isToday ? 'text-primary' : 'text-gray-600'
                      }`}>
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 lg:h-24 text-gray-500">
                <span className="text-sm">No weekly data available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};