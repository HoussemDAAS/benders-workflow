import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Building2, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Star,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  totalTimeSpent: {
    seconds: number;
    hours: number;
    formatted: string;
  };
  lastTrackedAt?: string;
  trackingCount: number;
  progress: {
    percentage: number;
    isOvertime: boolean;
  };
  isRecentlyTracked: boolean;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface Workflow {
  id: string;
  name: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
  company?: string;
}

interface TaskGroup {
  client: Client;
  workflows: Array<{
    workflow: Workflow;
    tasks: Task[];
    totalTasks: number;
    totalTimeSpent: number;
  }>;
  totalTasks: number;
}

interface TaskSelectorProps {
  onSelectTask: (task: Task & { workflowName?: string; clientName?: string }) => void;
  selectedTaskId?: string;
  showRecentOnly?: boolean;
}

const urgencyColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500'
};

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  onSelectTask,
  selectedTaskId,
  showRecentOnly = false
}) => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'grouped' | 'recent'>('recent');

  useEffect(() => {
    loadTasks();
  }, [showRecentOnly, selectedPriority, showCompleted]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (view === 'recent') {
        // Load recent tasks
        const recent = await api.get<Task[]>('/tasks/recent-tracking?limit=15');
        setRecentTasks(recent);
      } else {
        // Load grouped tasks
        const params = new URLSearchParams();
        if (selectedPriority !== 'all') params.append('priority', selectedPriority);
        if (showRecentOnly) params.append('recent_only', 'true');
        if (showCompleted) params.append('include_completed', 'true');

        const response = await api.get<{
          tasks: TaskGroup[];
          summary: any;
        }>(`/tasks/for-tracking?${params.toString()}`);
        
        setTaskGroups(response.tasks);
        
        // Auto-expand clients that have recently tracked tasks
        const clientsWithRecent = new Set<string>();
        response.tasks.forEach(group => {
          const hasRecentTasks = group.workflows.some(wf => 
            wf.tasks.some(task => task.isRecentlyTracked)
          );
          if (hasRecentTasks) {
            clientsWithRecent.add(group.client.id || 'no-client');
          }
        });
        setExpandedClients(clientsWithRecent);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClientExpanded = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  const handleTaskSelect = (task: Task, workflowName?: string, clientName?: string) => {
    onSelectTask({
      ...task,
      workflowName,
      clientName
    });
  };

  const filterTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const formatLastTracked = (lastTrackedAt?: string) => {
    if (!lastTrackedAt) return 'Never tracked';
    
    const date = new Date(lastTrackedAt);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-sm text-gray-600">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={loadTasks}
          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 max-h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Select Task</h3>
          <button
            onClick={loadTasks}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setView('recent')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              view === 'recent'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setView('grouped')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              view === 'grouped'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Tasks
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Filters for grouped view */}
        {view === 'grouped' && (
          <div className="flex gap-2 mt-3">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded"
              />
              Include completed
            </label>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'recent' ? (
          // Recent Tasks View
          <div className="p-2">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock size={20} className="mx-auto mb-2" />
                <p className="text-sm">No recent tasks found</p>
                <p className="text-xs">Start tracking time to see recent tasks</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filterTasks(recentTasks).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelect(task)}
                    className={`w-full p-3 text-left rounded-md border transition-colors ${
                      selectedTaskId === task.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {task.title}
                          </h4>
                          {task.isRecentlyTracked && (
                            <Star size={12} className="text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        {(task.workflowName || task.clientName) && (
                          <p className="text-xs text-gray-500 mb-1">
                            {task.clientName} {task.workflowName && `• ${task.workflowName}`}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {task.totalTimeSpent.formatted}
                          </span>
                          <span>{formatLastTracked(task.lastTrackedAt)}</span>
                          {task.trackingCount > 1 && (
                            <span>{task.trackingCount} sessions</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${urgencyColors[task.urgency]}`}>
                          {task.urgency}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Grouped Tasks View
          <div className="p-2">
            {taskGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen size={20} className="mx-auto mb-2" />
                <p className="text-sm">No tasks found</p>
                <p className="text-xs">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {taskGroups.map((group) => {
                  const clientId = group.client.id || 'no-client';
                  const isExpanded = expandedClients.has(clientId);
                  
                  return (
                    <div key={clientId} className="border border-gray-200 rounded-md">
                      {/* Client Header */}
                      <button
                        onClick={() => toggleClientExpanded(clientId)}
                        className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-500" />
                          <span className="font-medium text-sm text-gray-900">
                            {group.client.company || group.client.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({group.totalTasks} tasks)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {group.workflows.some(wf => 
                            wf.tasks.some(task => task.isRecentlyTracked)
                          ) && (
                            <Star size={12} className="text-yellow-500 fill-current" />
                          )}
                          <span className={`transform transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}>
                            ▶
                          </span>
                        </div>
                      </button>

                      {/* Workflows & Tasks */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50/50">
                          {group.workflows.map((workflowGroup) => (
                            <div key={workflowGroup.workflow.id || 'no-workflow'} className="p-2">
                              <div className="flex items-center gap-2 mb-2 px-2">
                                <FolderOpen size={12} className="text-gray-400" />
                                <span className="text-xs font-medium text-gray-700">
                                  {workflowGroup.workflow.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({workflowGroup.totalTasks} tasks)
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                {filterTasks(workflowGroup.tasks).map((task) => (
                                  <button
                                    key={task.id}
                                    onClick={() => handleTaskSelect(
                                      task, 
                                      workflowGroup.workflow.name, 
                                      group.client.name
                                    )}
                                    className={`w-full p-2 text-left rounded border transition-colors ${
                                      selectedTaskId === task.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h5 className="font-medium text-xs text-gray-900 truncate">
                                            {task.title}
                                          </h5>
                                          {task.isRecentlyTracked && (
                                            <Star size={10} className="text-yellow-500 fill-current" />
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <span className={priorityColors[task.priority]}>
                                            {task.priority}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Clock size={8} />
                                            {task.totalTimeSpent.formatted}
                                          </span>
                                          {task.progress.percentage > 0 && (
                                            <span className={
                                              task.progress.isOvertime ? 'text-red-500' : 'text-green-500'
                                            }>
                                              {task.progress.percentage}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <span className={`text-xs px-1 py-0.5 rounded ${urgencyColors[task.urgency]}`}>
                                        {task.urgency}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSelector;