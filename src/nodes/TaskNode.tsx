import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Calendar, User, Flag, Clock } from 'lucide-react';
import { KanbanTask, TeamMember } from '../types';

export interface TaskNodeData {
  task: KanbanTask;
  teamMembers?: TeamMember[];
}

export function TaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  const { task, teamMembers } = data;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'review': return 'bg-purple-500';
      case 'done': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const assignedMembers = teamMembers?.filter(member => 
    task.assignedMembers.includes(member.id)
  ) || [];

  return (
    <div className={`bg-white border-2 rounded-xl p-3 min-w-[200px] max-w-[250px] shadow-lg transition-all duration-300 hover:shadow-xl ${
      selected ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-semibold text-gray-900 leading-tight flex-1 mr-2">
          {task.title}
        </div>
        <div 
          className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${getPriorityColor(task.priority)}`}
          title={`Priority: ${task.priority}`}
        >
          <Flag size={12} />
        </div>
      </div>
      
      {task.description && (
        <div className="text-xs text-gray-600 mb-3 leading-relaxed">
          {task.description.length > 60 
            ? `${task.description.substring(0, 60)}...` 
            : task.description
          }
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className={`px-2 py-1 rounded-full text-xs text-white font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('-', ' ')}
        </div>
        
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={12} />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {assignedMembers.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <User size={12} className="text-gray-400" />
          <div className="flex items-center -space-x-1">
            {assignedMembers.slice(0, 3).map(member => (
              <div 
                key={member.id} 
                className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                title={member.name}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{member.name.charAt(0)}</span>
                )}
              </div>
            ))}
            {assignedMembers.length > 3 && (
              <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
                +{assignedMembers.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Top} className="w-2 h-2 border-2 border-white bg-primary" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 border-2 border-white bg-primary" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 border-2 border-white bg-primary" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 border-2 border-white bg-primary" />
    </div>
  );
} 