import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Timer,
  BarChart3,
  Filter,
  Download,
  Plus,
  Activity,
  Coffee
} from 'lucide-react';
import { CalendarContainer, TimeStats } from '../components/calendar';
import PauseReasonModal from '../components/PauseReasonModal';
import StopTimerModal from '../components/StopTimerModal';
import { useAppContext } from '../hooks/useAppContext';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { timeUtils } from '../services/timeTrackingService';

export type CalendarView = 'month' | 'week' | 'day' | 'table';

const CalendarPage: React.FC = () => {
  const { kanbanTasks, workflows, clients } = useAppContext();
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showTimeStats, setShowTimeStats] = useState(true); // Stats active by default
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  // Real-time pause timer
  const [pauseElapsed, setPauseElapsed] = useState(0);
  
  // Use the real time tracker hook
  const {
    timerStatus,
    isLoading,
    error,
    formattedElapsed,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer
  } = useTimeTracker();

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

  const viewOptions = [
    { id: 'day', label: 'Day', icon: Clock },
    { id: 'week', label: 'Week', icon: CalendarIcon },
    { id: 'month', label: 'Month', icon: CalendarIcon },
    { id: 'table', label: 'Table', icon: BarChart3 }
  ];

  // Handle view change
  const handleViewChange = (newView: CalendarView) => {
    setCurrentView(newView);
  };

  // Timer control handlers
  const handleStartTimer = async () => {
    try {
      await startTimer({ description: 'Quick timer start' });
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

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
      const result = await stopTimer();
      setShowStopModal(false);
      
      // Force immediate refresh of time stats after stopping timer
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshTimeStats'));
      }, 500); // Give server time to complete the transaction
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  // Get timer status for display
  const isTimerActive = timerStatus?.hasActiveTimer || false;
  const isPaused = timerStatus?.timer?.isPaused || false;
  const currentTask = timerStatus?.timer?.taskTitle || null;

  return (
    <>
      <div className="min-h-full bg-gray-50">
        {/* Enhanced Header with Timer Status */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 px-4 sm:px-6 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto">
              {/* Top Row - Title and Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Calendar & Schedule
                      </h1>
                      <p className="text-white/80 text-sm sm:text-base">
                        Plan your time and track your productivity
                      </p>
                    </div>
                  </div>
                  
                  {/* Status indicators */}
                  <div className="flex items-center justify-center lg:justify-start gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        isTimerActive ? 'bg-green-400' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-white/90">
                        {isTimerActive ? 'Timer Active' : 'Timer Ready'}
                      </span>
                    </div>
                    <span className="text-white/60">•</span>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-white/70" />
                      <span className="text-white/70">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3">
                  <button
                    onClick={() => setShowTimeStats(!showTimeStats)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors duration-200 backdrop-blur-sm ${
                      showTimeStats 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <BarChart3 size={16} />
                    <span className="hidden sm:inline">Stats</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors duration-200 backdrop-blur-sm">
                    <Download size={16} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-tertiary hover:bg-tertiary/90 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg">
                    <Plus size={16} />
                    <span className="hidden sm:inline">New Event</span>
                  </button>
                </div>
              </div>

              {/* Bottom Row - Timer Display and View Controls */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* View Controls */}
                <div className="xl:col-span-5">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">View Mode</h3>
                        <p className="text-white/70 text-sm">Choose your calendar layout</p>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Filter size={16} />
                        <span className="text-sm">Options</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {viewOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleViewChange(option.id as CalendarView)}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                              currentView === option.id
                                ? 'bg-white text-primary shadow-lg'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            <Icon size={16} />
                            <span className="text-sm">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Enhanced Timer Display and Controls */}
                <div className="xl:col-span-7">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Timer Display - Your existing design */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Timer size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white font-mono">
                              {formattedElapsed}
                            </div>
                            <div className="text-white/70 text-sm">
                              {currentTask ? `Working on: ${currentTask}` : 'Ready to track time'}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          isTimerActive && !isPaused ? 'bg-green-400/20 text-green-100' : 
                          isPaused ? 'bg-yellow-400/20 text-yellow-100' : 'bg-white/20 text-white/80'
                        }`}>
                          {isTimerActive && !isPaused ? '🔥 Working' : 
                           isPaused ? '⏸️ Paused' : '⏹️ Ready'}
                        </div>
                      </div>

                      {/* Timer Controls */}
                      <div className="flex items-center gap-2">
                        {isTimerActive ? (
                          <>
                            {isPaused ? (
                              <button
                                onClick={handleResume}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                              >
                                <Play size={14} />
                                <span className="hidden sm:inline">Resume</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowPauseModal(true)}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                              >
                                <Pause size={14} />
                                <span className="hidden sm:inline">Pause</span>
                              </button>
                            )}
                            
                            <button
                              onClick={() => setShowStopModal(true)}
                              disabled={isLoading}
                              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                            >
                              <Square size={14} />
                              <span className="hidden sm:inline">Stop</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleStartTimer}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                          >
                            <Play size={14} />
                            <span className="hidden sm:inline">Start Timer</span>
                          </button>
                        )}
                        
                        {error && (
                          <div className="text-red-200 text-xs">
                            {error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 pb-6 pt-4">
          <div className="max-w-7xl mx-auto">
            {/* Break Timer Widget - Only visible when paused */}
            {isTimerActive && isPaused && (
              <div className="mb-6">
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
                  <div className="px-6 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Timer Display */}
                      <div className="text-center sm:text-left">
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-orange-900 mb-2">
                          {timeUtils.formatDuration(pauseElapsed)}
                        </div>
                        <div className="text-sm text-orange-700 mb-4">
                          {timeUtils.formatDurationHuman(pauseElapsed)} break time - Stay refreshed!
                        </div>

                        {/* Pause Reason */}
                        {timerStatus?.timer?.pauseReason && (
                          <div className="bg-orange-100 rounded-lg p-3 mb-4">
                            <div className="text-xs text-orange-600 font-medium mb-1">Break Reason:</div>
                            <div className="text-sm text-orange-800">{timerStatus.timer.pauseReason}</div>
                          </div>
                        )}
                      </div>

                      {/* Resume Button */}
                      <div className="flex justify-center sm:justify-end">
                        <button
                          onClick={handleResume}
                          disabled={isLoading}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                          <Play size={16} />
                          {isLoading ? 'Resuming...' : 'Resume Work'}
                        </button>
                      </div>
                    </div>

                    {/* Break Stats */}
                    {timerStatus?.timer?.totalPausedDuration > 0 && (
                      <div className="mt-6 pt-4 border-t border-orange-200">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-xs text-orange-600 mb-1">Session Breaks</div>
                            <div className="text-sm font-medium text-orange-800">
                              {timeUtils.formatDurationHuman(timerStatus.timer.totalPausedDuration)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-orange-600 mb-1">Active Work</div>
                            <div className="text-sm font-medium text-green-700">
                              {formattedElapsed}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Time Stats - Full Width */}
            {showTimeStats && (
              <div className="mb-8">
                <TimeStats />
              </div>
            )}

            {/* Placeholder when stats are hidden */}
            {!showTimeStats && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Time Statistics</h3>
                    <p className="text-gray-600 mb-4">View your productivity metrics and trends</p>
                    <button
                      onClick={() => setShowTimeStats(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                    >
                      Show Stats
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Calendar Container */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <CalendarContainer
                view={currentView}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                tasks={kanbanTasks}
                workflows={workflows}
                clients={clients}
              />
            </div>
          </div>
        </div>
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
        elapsedSeconds={timerStatus?.timer?.elapsedSeconds || 0}
        taskTitle={currentTask}
      />
    </>
  );
};

export default CalendarPage;