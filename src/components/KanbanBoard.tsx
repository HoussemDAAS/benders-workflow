import React, { useState, useEffect, useMemo } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Flag,
  Clock,
  Workflow as WorkflowIcon,
  Users,
  Building
} from 'lucide-react';
import { KanbanTask, KanbanColumn, TeamMember, Workflow, Client } from '../types';
import { taskService, workflowService } from '../services';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  clients: Client[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskCreate: (columnId: string, workflowId?: string, clientId?: string) => void;
  onTaskEdit: (task: KanbanTask) => void;
  onRefresh: () => void;
  selectedWorkflow?: string;
  selectedClient?: string;
  onWorkflowChange?: (workflowId: string) => void;
  onClientChange?: (clientId: string) => void;
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
  selectedWorkflow: Workflow | null;
  selectedClient: Client | null;
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskCreate: (columnId: string, workflowId?: string, clientId?: string) => void;
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
    ? task.assignedMembers
        .map(memberId => teamMembers.find(m => m.id === memberId)?.name)
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const title = task.title;
  const description = task.description;
  const priority = task.priority;
  const dueDate = task.dueDate;
  const tags = task.tags || [];

  const isOverdue = dueDate && new Date(dueDate) < new Date();

  return (
    <div
      ref={drag}
      className={`task-card ${isDragging ? 'dragging' : ''} ${isOverdue ? 'overdue' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="task-card-header">
        <h4 className="task-title">
          {title}
        </h4>
        <div className={`priority-indicator ${getPriorityColor(priority)}`} />
      </div>
      
      <p className="task-description">{description}</p>
      
      <div className="task-tags">
        {tags.slice(0, 3).map((tag, index) => (
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
          {task.assignedMembers && task.assignedMembers.length > 3 && (
            <div className="assignee-more">
              +{task.assignedMembers.length - 3}
            </div>
          )}
        </div>
        
        {dueDate && (
          <div className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
            <Calendar size={12} />
            <span>{new Date(dueDate).toLocaleDateString()}</span>
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
  selectedWorkflow,
  selectedClient,
  onTaskMove, 
  onTaskCreate, 
  onTaskEdit 
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: { id: string }) => {
      onTaskMove(item.id, column.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleCreateTask = () => {
    onTaskCreate(
      column.id, 
      selectedWorkflow?.id, 
      selectedClient?.id
    );
  };

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
          onClick={handleCreateTask}
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
              onClick={handleCreateTask}
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
  clients,
  onTaskMove, 
  onTaskCreate, 
  onTaskEdit,
  onRefresh,
  selectedWorkflow: globalSelectedWorkflow,
  selectedClient: globalSelectedClient,
  onWorkflowChange,
  onClientChange
}: KanbanBoardProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(globalSelectedWorkflow || 'all');
  const [selectedClient, setSelectedClient] = useState<string>(globalSelectedClient || 'all');
  const [workflowTasks, setWorkflowTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(false);

  // Get current workflow and client
  const currentWorkflow = selectedWorkflow !== 'all' 
    ? workflows.find(w => w.id === selectedWorkflow) || null 
    : null;
  const currentClient = selectedClient !== 'all' 
    ? clients.find(c => c.id === selectedClient) || null 
    : null;

  // Filter workflows based on selected client
  const clientWorkflows = useMemo(() => {
    if (selectedClient === 'all') {
      return workflows;
    }
    return workflows.filter(w => w.clientId === selectedClient);
  }, [workflows, selectedClient]);

  // Combine regular tasks and workflow steps
  useEffect(() => {
    const filterTasks = () => {
      setLoading(true);
      let allItems: KanbanTask[] = [...tasks];
      
      // Filter by workflow and client
      if (selectedWorkflow !== 'all' || selectedClient !== 'all') {
        let filteredItems = allItems.filter(item => {
          const matchesWorkflow = selectedWorkflow === 'all' || item.workflowId === selectedWorkflow;
          const matchesClient = selectedClient === 'all' || 
            workflows.find(w => w.id === item.workflowId)?.clientId === selectedClient;
          return matchesWorkflow && matchesClient;
        });
        allItems = filteredItems;
      }
      
      setWorkflowTasks(allItems);
      setLoading(false);
    };

    filterTasks();
  }, [selectedWorkflow, selectedClient, tasks, workflows]);

  // Handle workflow selection
  const handleWorkflowChange = (workflowId: string) => {
    setSelectedWorkflow(workflowId);
    onWorkflowChange?.(workflowId);
    if (workflowId !== 'all') {
      // Find the client for this workflow and set it
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        setSelectedClient(workflow.clientId);
        onClientChange?.(workflow.clientId);
      }
    }
  };

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    onClientChange?.(clientId);
    if (clientId !== 'all') {
      // Reset workflow selection when client changes
      setSelectedWorkflow('all');
      onWorkflowChange?.('all');
    }
  };

  // Use the standard kanban columns (not workflow steps as columns)
  const kanbanColumns = useMemo(() => {
    return columns.sort((a, b) => (a.order || a.order_index || 0) - (b.order || b.order_index || 0));
  }, [columns]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="kanban-board">
        <div className="kanban-header">
          <div className="kanban-title-section">
            <h1>
              <WorkflowIcon size={24} />
              Workflow Kanban Board
            </h1>
            <p>Manage tasks and workflow steps by status</p>
          </div>
          
          <div className="kanban-selectors">
            <div className="selector-group">
              <label>
                <Building size={16} />
                Client:
              </label>
              <select 
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="client-selector"
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company || client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label>
                <WorkflowIcon size={16} />
                Workflow:
              </label>
              <select 
                value={selectedWorkflow}
                onChange={(e) => handleWorkflowChange(e.target.value)}
                className="workflow-selector"
              >
                <option value="all">
                  {selectedClient === 'all' ? 'All Workflows' : 'All Client Workflows'}
                </option>
                {clientWorkflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name} ({workflow.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {currentWorkflow && (
          <div className="workflow-info">
            <div className="workflow-details">
              <h3>{currentWorkflow.name}</h3>
              <p>{currentWorkflow.description}</p>
              <div className="workflow-meta">
                <span className={`status-badge ${currentWorkflow.status}`}>
                  {currentWorkflow.status}
                </span>
                {currentClient && (
                  <span className="client-info">
                    <Building size={14} />
                    {currentClient.company || currentClient.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="kanban-loading">
            <div className="loading-spinner">Loading tasks...</div>
          </div>
        ) : (
          <div className="kanban-columns">
            {kanbanColumns.map((column) => {
              const columnItems = workflowTasks.filter(item => {
                // For regular tasks, match by status
                if ('status' in item) {
                  return item.status === column.id;
                }
                return false;
              });
              
              return (
                <Column
                  key={column.id}
                  column={column}
                  tasks={columnItems}
                  teamMembers={teamMembers}
                  selectedWorkflow={currentWorkflow}
                  selectedClient={currentClient}
                  onTaskMove={onTaskMove}
                  onTaskCreate={onTaskCreate}
                  onTaskEdit={onTaskEdit}
                />
              );
            })}
          </div>
        )}

        {!loading && workflowTasks.length === 0 && (
          <div className="empty-kanban">
            <WorkflowIcon size={48} />
            <h3>No tasks found</h3>
            <p>
              {selectedWorkflow !== 'all' || selectedClient !== 'all'
                ? 'No tasks for this selection. Create your first task!'
                : 'Create your first task to get started.'
              }
            </p>
            <button 
              className="create-first-task"
              onClick={() => onTaskCreate(
                kanbanColumns[0]?.id || 'todo', 
                currentWorkflow?.id, 
                currentClient?.id
              )}
            >
              <Plus size={20} />
              Create First Task
            </button>
          </div>
        )}
      </div>
    </DndProvider>
  );
} 