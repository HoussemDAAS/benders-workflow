import React, { useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Flag,
  Clock
} from 'lucide-react';
import { KanbanTask, KanbanColumn, TeamMember, Workflow } from '../types';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskCreate: (columnId: string) => void;
  onTaskEdit: (task: KanbanTask) => void;
}

interface TaskCardProps {
  task: KanbanTask;
  teamMembers: TeamMember[];
  onEdit: (task: KanbanTask) => void;
}

interface ColumnProps {
  column: KanbanColumn;
  tasks: KanbanTask[];
  teamMembers: TeamMember[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskCreate: (columnId: string) => void;
  onTaskEdit: (task: KanbanTask) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, teamMembers, onEdit }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const assignedMemberNames = task.assignedMembers
    .map(memberId => teamMembers.find(m => m.id === memberId)?.name)
    .filter(Boolean)
    .slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={drag}
      className={`task-card ${isDragging ? 'dragging' : ''} ${isOverdue ? 'overdue' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <div className={`priority-indicator ${getPriorityColor(task.priority)}`} />
      </div>
      
      <p className="task-description">{task.description}</p>
      
      <div className="task-tags">
        {task.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="task-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="task-card-footer">
        <div className="task-assignees">
          {assignedMemberNames.map((name, index) => (
            <div key={index} className="assignee-avatar" title={name}>
              {name?.charAt(0)}
            </div>
          ))}
          {task.assignedMembers.length > 3 && (
            <div className="assignee-more">
              +{task.assignedMembers.length - 3}
            </div>
          )}
        </div>
        
        {task.dueDate && (
          <div className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
            <Calendar size={12} />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Column: React.FC<ColumnProps> = ({ 
  column, 
  tasks, 
  teamMembers, 
  onTaskMove, 
  onTaskCreate, 
  onTaskEdit 
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: { id: string }) => onTaskMove(item.id, column.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop} 
      className={`kanban-column ${isOver ? 'drop-target' : ''}`}
    >
      <div className="column-header" style={{ borderTopColor: column.color }}>
        <div className="column-title">
          <h3>{column.title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
        <button 
          className="add-task-btn"
          onClick={() => onTaskCreate(column.id)}
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="column-content">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            teamMembers={teamMembers}
            onEdit={onTaskEdit}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="empty-column">
            <p>No tasks yet</p>
            <button 
              className="add-first-task"
              onClick={() => onTaskCreate(column.id)}
            >
              Add first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export function KanbanBoard({ 
  columns, 
  tasks, 
  teamMembers, 
  workflows,
  onTaskMove, 
  onTaskCreate, 
  onTaskEdit 
}: KanbanBoardProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');

  const filteredTasks = selectedWorkflow === 'all' 
    ? tasks 
    : tasks.filter(task => task.workflowId === selectedWorkflow);

  const sortedColumns = columns.sort((a, b) => a.order - b.order);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="kanban-board">
        <div className="kanban-header">
          <div>
            <h1>Kanban Board</h1>
            <p>Manage and track all workflow tasks</p>
          </div>
          
          <div className="kanban-filters">
            <select 
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="workflow-filter"
            >
              <option value="all">All Workflows</option>
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="kanban-columns">
          {sortedColumns.map((column) => {
            const columnTasks = filteredTasks.filter(task => task.status === column.id);
            
            return (
              <Column
                key={column.id}
                column={column}
                tasks={columnTasks}
                teamMembers={teamMembers}
                onTaskMove={onTaskMove}
                onTaskCreate={onTaskCreate}
                onTaskEdit={onTaskEdit}
              />
            );
          })}
        </div>
      </div>
    </DndProvider>
  );
} 