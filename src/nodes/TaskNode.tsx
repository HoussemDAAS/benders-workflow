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
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return '#6b7280';
      case 'in-progress': return '#3b82f6';
      case 'review': return '#8b5cf6';
      case 'done': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const assignedMembers = teamMembers?.filter(member => 
    task.assignedMembers.includes(member.id)
  ) || [];

  return (
    <div className={`task-node ${selected ? 'selected' : ''}`}>
      <div className="task-node-header">
        <div className="task-title">{task.title}</div>
        <div 
          className="task-priority-indicator"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
          title={`Priority: ${task.priority}`}
        >
          <Flag size={12} />
        </div>
      </div>
      
      {task.description && (
        <div className="task-description">
          {task.description.length > 60 
            ? `${task.description.substring(0, 60)}...` 
            : task.description
          }
        </div>
      )}

      <div className="task-meta">
        <div 
          className="task-status-badge"
          style={{ backgroundColor: getStatusColor(task.status) }}
        >
          {task.status.replace('-', ' ')}
        </div>
        
        {task.dueDate && (
          <div className="task-due-date">
            <Calendar size={12} />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {assignedMembers.length > 0 && (
        <div className="task-assignees">
          <User size={12} />
          <div className="assignee-list">
            {assignedMembers.slice(0, 3).map(member => (
              <div 
                key={member.id} 
                className="assignee-avatar"
                title={member.name}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} />
                ) : (
                  <span>{member.name.charAt(0)}</span>
                )}
              </div>
            ))}
            {assignedMembers.length > 3 && (
              <div className="assignee-count">+{assignedMembers.length - 3}</div>
            )}
          </div>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="task-tag">{tag}</span>
          ))}
          {task.tags.length > 2 && (
            <span className="task-tag-count">+{task.tags.length - 2}</span>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
} 