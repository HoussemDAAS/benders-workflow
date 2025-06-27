import { useState, useEffect, useCallback, useRef } from 'react';
import { timeTrackerService, timeEntriesService, timeUtils } from '../services';
import type { ActiveTimer, TimerStatus, StartTimerData, TimeEntry } from '../services';

export interface UseTimeTrackerReturn {
  // Timer state
  timerStatus: TimerStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Timer controls
  startTimer: (data: StartTimerData) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  
  // Current session info
  currentElapsed: number;
  formattedElapsed: string;
  formattedElapsedHuman: string;
  
  // Refresh functionality
  refreshStatus: () => Promise<void>;
}

export const useTimeTracker = () => {
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentElapsed, setCurrentElapsed] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Calculate elapsed time and update every second
  const updateElapsedTime = useCallback(() => {
    if (!timerStatus?.hasActiveTimer || !timerStatus.timer) {
      setCurrentElapsed(0);
      return;
    }

    const timer = timerStatus.timer;
    if (timer.isPaused) {
      // When paused, show the elapsed time at pause
      setCurrentElapsed(timer.elapsedSeconds);
      return;
    }

    const now = Date.now();
    const startTime = new Date(timer.startTime).getTime();
    const realTimeElapsed = Math.floor((now - startTime) / 1000);
    const adjustedElapsed = realTimeElapsed - timer.totalPausedDuration;
    
    setCurrentElapsed(Math.max(0, adjustedElapsed));
  }, [timerStatus]);

  // Fetch current timer status
  const refreshStatus = useCallback(async () => {
    try {
      setError(null);
      const status = await timeTrackerService.getStatus();
      setTimerStatus(status);
      
      // Update elapsed time immediately
      if (status.hasActiveTimer && status.timer) {
        const timer = status.timer;
        if (!timer.isPaused) {
          const now = Date.now();
          const startTime = new Date(timer.startTime).getTime();
          const realTimeElapsed = Math.floor((now - startTime) / 1000);
          const adjustedElapsed = realTimeElapsed - timer.totalPausedDuration;
          setCurrentElapsed(Math.max(0, adjustedElapsed));
        } else {
          setCurrentElapsed(timer.elapsedSeconds);
        }
      } else {
        setCurrentElapsed(0);
      }
    } catch (err) {
      console.error('Failed to fetch timer status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch timer status');
    }
  }, []);

  // Start timer
  const startTimer = useCallback(async (data: StartTimerData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await timeTrackerService.startTimer(data);
      
      // Refresh status to get updated timer info
      await refreshStatus();
    } catch (err) {
      console.error('Failed to start timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to start timer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Pause timer
  const pauseTimer = useCallback(async (reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await timeTrackerService.pauseTimer(reason);
      await refreshStatus();
    } catch (err) {
      console.error('Failed to pause timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to pause timer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Resume timer
  const resumeTimer = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await timeTrackerService.resumeTimer();
      await refreshStatus();
    } catch (err) {
      console.error('Failed to resume timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume timer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Stop timer
  const stopTimer = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await timeTrackerService.stopTimer();
      
      // Clear timer state
      setTimerStatus({ hasActiveTimer: false, timer: null });
      setCurrentElapsed(0);
      
      return result.timeEntry;
    } catch (err) {
      console.error('Failed to stop timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop timer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up interval for updating elapsed time
  useEffect(() => {
    if (timerStatus?.hasActiveTimer && timerStatus.timer && !timerStatus.timer.isPaused) {
      // Update immediately
      updateElapsedTime();
      
      // Set up interval to update every second
      intervalRef.current = setInterval(updateElapsedTime, 1000);
    } else {
      // Clear interval when timer is not active or is paused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerStatus, updateElapsedTime]);

  // Initial load
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Format elapsed time
  const formattedElapsed = timeUtils.formatDuration(currentElapsed);
  const formattedElapsedHuman = timeUtils.formatDurationHuman(currentElapsed);

  return {
    timerStatus,
    isLoading,
    error,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    currentElapsed,
    formattedElapsed,
    formattedElapsedHuman,
    refreshStatus
  };
};

export default useTimeTracker;