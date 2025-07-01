import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Coffee,
  AlertCircle,
  Timer,
  RotateCcw
} from 'lucide-react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { timeUtils } from '../services/timeTrackingService';
import PauseReasonModal from './PauseReasonModal';
import StopTimerModal from './StopTimerModal';

export const TimerWidget: React.FC = () => {
  const {
    timerStatus,
    isLoading,
    error,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    currentElapsed,
    refreshStatus
  } = useTimeTracker();

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  // Separate pause timer state
  const [pauseElapsed, setPauseElapsed] = useState(0);

  // Real-time pause timer when paused
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerStatus?.timer?.isPaused && timerStatus.timer.pausedAt) {
      // Start pause timer from when it was paused
      const pauseStartTime = new Date(timerStatus.timer.pausedAt).getTime();
      
      const updatePauseTime = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - pauseStartTime) / 1000);
        setPauseElapsed(elapsed);
      };

      // Update immediately
      updatePauseTime();
      
      // Update every second
      interval = setInterval(updatePauseTime, 1000);
    } else {
      // Reset when not paused
      setPauseElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus?.timer?.isPaused, timerStatus?.timer?.pausedAt]);

  const handlePause = async (reason: string) => {
    try {
      await pauseTimer(reason);
      setShowPauseModal(false);
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeTimer();
    } catch (error) {
      console.error('Failed to resume timer:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer();
      setShowStopModal(false);
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const handleStartTimer = async () => {
    try {
      await startTimer({
        description: 'Quick timer start'
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle size={20} />
          <span className="font-medium">Timer Error</span>
        </div>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          onClick={refreshStatus}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RotateCcw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Timer Widget */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Timer size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Work Timer</h3>
                  <p className="text-sm text-gray-600">
                    {timerStatus?.hasActiveTimer ? 'Active Session' : 'Ready to start'}
                  </p>
                </div>
              </div>
              
              {timerStatus?.hasActiveTimer && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  timerStatus.timer?.isPaused 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {timerStatus.timer?.isPaused ? 'Paused' : 'Running'}
                </div>
              )}
            </div>
          </div>

          {/* Timer Display */}
          <div className="px-6 py-6">
            {timerStatus?.hasActiveTimer && timerStatus.timer ? (
              <div className="space-y-4">
                {/* Task Info */}
                {timerStatus.timer.taskTitle && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span className="font-medium">Task:</span>
                    <span>{timerStatus.timer.taskTitle}</span>
                  </div>
                )}

                {/* Main Timer Display */}
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
                    {timeUtils.formatDuration(currentElapsed)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {timeUtils.formatDurationHuman(currentElapsed)} of active work
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3">
                  {timerStatus.timer.isPaused ? (
                    <button
                      onClick={handleResume}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      <Play size={16} />
                      Resume Work
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPauseModal(true)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      <Pause size={16} />
                      Pause
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowStopModal(true)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <Square size={16} />
                    Stop
                  </button>
                </div>

                {/* Session Summary */}
                {timerStatus.timer.totalPausedDuration > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Work Time</div>
                        <div className="text-sm font-medium text-green-600">
                          {timeUtils.formatDurationHuman(currentElapsed)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total Breaks</div>
                        <div className="text-sm font-medium text-orange-600">
                          {timeUtils.formatDurationHuman(timerStatus.timer.totalPausedDuration)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // No active timer state
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No Active Timer</h4>
                <p className="text-sm text-gray-600 mb-6">Start tracking your work time</p>
                
                <button
                  onClick={handleStartTimer}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mx-auto"
                >
                  <Play size={16} />
                  {isLoading ? 'Starting...' : 'Start Timer'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Separate Pause Timer Widget - Only visible when paused */}
        {timerStatus?.timer?.isPaused && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-lg border border-orange-200 overflow-hidden">
            {/* Pause Timer Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                    <Coffee size={20} className="text-orange-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900">Break Timer</h3>
                    <p className="text-sm text-orange-700">Currently on break</p>
                  </div>
                </div>
                
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800 animate-pulse">
                  Paused
                </div>
              </div>
            </div>

            {/* Pause Timer Display */}
            <div className="px-6 py-6 text-center">
              <div className="text-4xl font-mono font-bold text-orange-900 mb-2">
                {timeUtils.formatDuration(pauseElapsed)}
              </div>
              <div className="text-sm text-orange-700 mb-4">
                {timeUtils.formatDurationHuman(pauseElapsed)} break time
              </div>

              {/* Pause Reason */}
              {timerStatus.timer.pauseReason && (
                <div className="bg-orange-100 rounded-lg p-3 mb-4">
                  <div className="text-xs text-orange-600 font-medium mb-1">Break Reason:</div>
                  <div className="text-sm text-orange-800">{timerStatus.timer.pauseReason}</div>
                </div>
              )}

              {/* Resume Button */}
              <button
                onClick={handleResume}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mx-auto"
              >
                <Play size={16} />
                {isLoading ? 'Resuming...' : 'Resume Work'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PauseReasonModal
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onConfirm={handlePause}
        isLoading={isLoading}
      />

      <StopTimerModal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        onConfirm={handleStop}
        isLoading={isLoading}
        elapsedSeconds={currentElapsed}
        taskTitle={timerStatus?.timer?.taskTitle}
      />
    </>
  );
};

export default TimerWidget;