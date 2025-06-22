import React from 'react';
import { 
  Play,
  CheckCircle,
  Pause,
  Clock,
  Building,
  Target,
  Calendar,
  Edit2,
  Trash2,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import { Workflow, Client, KanbanTask } from '../types';

interface WorkflowCardProps {
  workflow: Workflow;
  client: Client | undefined;
  tasks: KanbanTask[];
  onEdit: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onViewFlow: (workflow: Workflow) => void;
  onStatusChange: (workflowId: string, status: string) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  client,
  tasks,
  onEdit,
  onDelete,
  onViewFlow,
  onStatusChange
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getStatusIcon = (status: string) => {
    const iconProps = "w-4 h-4";
    switch (status) {
      case 'active': return <Play className={`${iconProps} text-green-600`} />;
      case 'completed': return <CheckCircle className={`${iconProps} text-blue-600`} />;
      case 'on-hold': return <Pause className={`${iconProps} text-yellow-600`} />;
      default: return <Clock className={`${iconProps} text-gray-600`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-green-500 to-emerald-500';
      case 'completed': return 'from-blue-500 to-indigo-500';
      case 'on-hold': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'on-hold': return 'status-pending';
      default: return 'status-inactive';
    }
  };

  const daysActive = Math.ceil((new Date().getTime() - new Date(workflow.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-200 mb-2 line-clamp-2">
              {workflow.name}
            </h3>
            <div className="flex items-center gap-2">
              {getStatusIcon(workflow.status)}
              <span className={`${getStatusBadge(workflow.status)}`}>
                {workflow.status.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className="relative">
            <select
              value={workflow.status}
              onChange={(e) => onStatusChange(workflow.id, e.target.value)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/30"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{workflow.description}</p>

        {/* Client Info */}
        <div className="flex items-center gap-2 text-gray-700">
          <Building className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{client?.company || 'Unknown Client'}</span>
          <span className="text-gray-500 text-sm truncate">({client?.name})</span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-gray-900">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full bg-gradient-to-r ${getStatusColor(workflow.status)} transition-all duration-500`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {completedTasks} of {totalTasks} tasks completed
        </div>
      </div>

      {/* Dates and Stats */}
      <div className="p-6">
        {/* Dates */}
        {(workflow.startDate || workflow.expectedEndDate) && (
          <div className="space-y-2 mb-4">
            {workflow.startDate && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Started: {new Date(workflow.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {workflow.expectedEndDate && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Target className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Due: {new Date(workflow.expectedEndDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <div className="text-xl font-bold text-gray-900">{totalTasks}</div>
            <div className="text-xs text-gray-500 font-medium">Tasks</div>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <div className="text-xl font-bold text-gray-900">{workflow.connections?.length || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Steps</div>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <div className="text-xl font-bold text-gray-900">{daysActive}</div>
            <div className="text-xs text-gray-500 font-medium">Days</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(workflow);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors duration-200"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewFlow(workflow);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary hover:bg-secondary/90 text-white rounded-xl text-sm font-medium transition-colors duration-200"
          >
            <WorkflowIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Flow</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(workflow);
            }}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};