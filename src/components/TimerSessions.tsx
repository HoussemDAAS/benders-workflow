import React, { useEffect, useState } from 'react';
import { 
  Play,
  Pause,
  Square,
  Activity,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { timeEntriesService, TimerActivitiesResponse } from '../services/timeTrackingService';
import { timeUtils } from '../services/timeTrackingService';

export const TimerSessions: React.FC = () => {
  const [timerActivities, setTimerActivities] = useState<TimerActivitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timer activities
  const fetchTimerActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Fetching timer sessions for date:', today);
      
      const activities = await timeEntriesService.getTimerActivities({
        start_date: today,
        end_date: today,
        limit: 50
      });
      
      console.log('🎯 Timer activities response:', activities);
      console.log('🔢 Sessions count:', activities?.sessions?.length || 0);
      setTimerActivities(activities);
    } catch (error) {
      console.error('❌ Failed to fetch timer activities:', error);
      setError('Failed to load timer sessions');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchTimerActivities();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTimerActivities, 30000);

    // Listen for refresh events
    const handleRefresh = () => {
      fetchTimerActivities();
    };
    window.addEventListener('refreshTimeStats', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshTimeStats', handleRefresh);
    };
  }, []);

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'started':
      case 'resumed':
        return <Play size={14} className="text-green-600" />;
      case 'paused':
        return <Pause size={14} className="text-orange-600" />;
      case 'stopped':
        return <Square size={14} className="text-red-600" />;
      default:
        return <Activity size={14} className="text-gray-600" />;
    }
  };

  // Format action text
  const getActionText = (action: string) => {
    switch (action) {
      case 'started': return 'Started';
      case 'resumed': return 'Resumed';
      case 'paused': return 'Paused';
      case 'stopped': return 'Stopped';
      default: return action;
    }
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'started':
      case 'resumed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'paused':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'stopped':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading timer sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={32} className="mx-auto mb-4 text-red-400" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTimerActivities}
          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const sessions = timerActivities?.sessions || [];

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity size={32} className="mx-auto mb-4 text-gray-300" />
        <p className="mb-2">No timer sessions today</p>
        <p className="text-sm">Start a timer to see your activity timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} today
        </div>
        <button
          onClick={fetchTimerActivities}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh sessions"
        >
          <RefreshCw size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Sessions Timeline */}
      <div className="space-y-4">
        {sessions.map((session, sessionIndex) => (
          <div key={session.timerId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Session Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock size={12} className="text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">
                  Session #{sessions.length - sessionIndex}
                </span>
              </div>
              {session.timeEntry && (
                <div className="text-sm text-gray-600">
                  {timeUtils.formatDurationHuman(session.timeEntry.duration)}
                </div>
              )}
            </div>

            {/* Session Info */}
            {session.timeEntry && (
              <div className="mb-3 text-sm">
                <div className="text-gray-700">
                  <span className="font-medium">Task:</span> {session.timeEntry.taskTitle || 'No task'}
                </div>
                {session.timeEntry.description && (
                  <div className="text-gray-600 mt-1">
                    <span className="font-medium">Note:</span> {session.timeEntry.description}
                  </div>
                )}
              </div>
            )}

            {/* Activity Timeline */}
            <div className="space-y-2">
              {session.activities
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0">
                      {getActionIcon(activity.action)}
                    </div>

                    {/* Activity details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getActionColor(activity.action)}`}>
                          {getActionText(activity.action)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Activity details */}
                      {activity.details.reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          Reason: {activity.details.reason}
                        </div>
                      )}
                      {activity.details.pausedDuration && (
                        <div className="text-xs text-gray-600 mt-1">
                          Duration: {timeUtils.formatDurationHuman(activity.details.pausedDuration)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 