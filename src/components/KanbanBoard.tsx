import React, { useState, useEffect, useMemo } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus, 
  Calendar, 
  Workflow as WorkflowIcon,
  Building,
  BarChart3,
  Users,
  Clock,
  Edit3,
  FileText
} from 'lucide-react';
import { KanbanTask, KanbanColumn, TeamMember, Workflow, Client } from '../types';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  clients: Client[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskCreate: (columnId: string, workflowId?: string, clientId?: string) => void;
  onTaskEdit: (task: KanbanTask) => void;
  onTaskResourcesOpen: (task: KanbanTask) => void;
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
  onResourcesOpen: (task: KanbanTask) => void;
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
  onTaskResourcesOpen: (task: KanbanTask) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, teamMembers, onEdit, onResourcesOpen }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // TODO: Add null checks for teamMembers during user auth implementation
  const assignedMemberNames = task.assignedMembers && teamMembers && Array.isArray(teamMembers)
    ? task.assignedMembers
        .map(memberId => teamMembers.find(m => m.id === memberId)?.name)
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'bg-gray-500';
    }
  };

  const title = task.title;
  const description = task.description;
  const priority = task.priority;
  const dueDate = task.dueDate;
  const tags = task.tags || [];

  const isOverdue = dueDate && new Date(dueDate) < new Date();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleCardClick = () => {
    onResourcesOpen(task);
  };

  return (
    <div
      ref={drag}
      className={`group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200 hover:-translate-y-1 ${
        isDragging ? 'opacity-50 transform rotate-2 scale-105' : ''
      } ${isOverdue ? 'ring-2 ring-red-200 border-red-200' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors duration-300 flex-1">
          {title}
        </h4>
        <div className="flex items-center gap-2 ml-2">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getPriorityColor(priority)} shadow-sm`} />
          <button
            onClick={handleEditClick}
            className="w-6 h-6 bg-gray-100 hover:bg-primary hover:text-white text-gray-500 rounded-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
            title="Edit task"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
      )}
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
              +{tags.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center -space-x-2">
          {assignedMemberNames.slice(0, 3).map((name, index) => (
            <div 
              key={index} 
              className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm"
              title={name}
            >
              {name?.charAt(0)}
            </div>
          ))}
          {task.assignedMembers && task.assignedMembers.length > 3 && (
            <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 border-2 border-white shadow-sm">
              +{task.assignedMembers.length - 3}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {dueDate && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              isOverdue 
                ? 'bg-red-100 text-red-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{new Date(dueDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FileText className="w-3 h-3" />
            <span>Resources</span>
          </div>
        </div>
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
  onTaskEdit,
  onTaskResourcesOpen
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
    <div className="flex-shrink-0 w-80">
      <div 
        ref={drop} 
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[600px] transition-all duration-300 ${
          isOver ? 'ring-2 ring-primary/30 bg-primary/5' : ''
        }`}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: column.color }}></div>
              <h3 className="font-bold text-gray-900 text-lg">{column.title}</h3>
            </div>
            <button 
              className="w-8 h-8 bg-gray-100 hover:bg-primary hover:text-white text-gray-600 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-105"
              onClick={handleCreateTask}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
            {tasks.length > 0 && (
              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, (tasks.length / 10) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto nav-scrollbar-hide">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              onEdit={onTaskEdit}
              onResourcesOpen={onTaskResourcesOpen}
            />
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4 font-medium">No tasks yet</p>
              <button 
                className="btn-primary"
                onClick={handleCreateTask}
              >
                <Plus className="w-4 h-4" />
                Add first task
              </button>
            </div>
          )}
        </div>
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
  onTaskResourcesOpen,
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
        const filteredItems = allItems.filter(item => {
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

  // Calculate stats
  const totalTasks = workflowTasks.length;
  const activeTasks = workflowTasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = workflowTasks.filter(t => t.status === 'done').length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-full bg-gray-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white pt-16 lg:pt-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                    <WorkflowIcon className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">Kanban Board</h1>
                </div>
                <p className="text-lg text-white/90 font-medium mb-4">
                  Manage tasks and workflow steps by status
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white/80">{totalTasks} Total Tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white/80">{activeTasks} In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white/80">{completedTasks} Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Filters Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 -mt-6 mb-6 relative z-10">
            <div className="flex flex-col lg:flex-row gap-4">
              <select 
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 flex-1 lg:flex-none lg:min-w-[200px]"
              >
                <option value="all" className="text-gray-900">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id} className="text-gray-900">
                    {client.company || client.name}
                  </option>
                ))}
              </select>

              <select 
                value={selectedWorkflow}
                onChange={(e) => handleWorkflowChange(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 flex-1 lg:flex-none lg:min-w-[250px]"
              >
                <option value="all" className="text-gray-900">
                  {selectedClient === 'all' ? 'All Workflows' : 'All Client Workflows'}
                </option>
                {clientWorkflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id} className="text-gray-900">
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Workflow Info */}
          {currentWorkflow && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 -mt-6 mb-6 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{currentWorkflow.name}</h3>
                  <p className="text-gray-600 mb-3">{currentWorkflow.description}</p>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                      currentWorkflow.status === 'active' ? 'status-active' :
                      currentWorkflow.status === 'completed' ? 'status-completed' :
                      currentWorkflow.status === 'on-hold' ? 'status-pending' :
                      'status-inactive'
                    }`}>
                      {currentWorkflow.status.replace('-', ' ')}
                    </span>
                    {currentClient && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">{currentClient.company || currentClient.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="loading-spinner"></div>
                <span className="text-gray-600 font-medium">Loading tasks...</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {kanbanColumns.map((column) => {
                const columnItems = workflowTasks.filter(item => {
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
                    onTaskResourcesOpen={onTaskResourcesOpen}
                  />
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && workflowTasks.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <WorkflowIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {selectedWorkflow !== 'all' || selectedClient !== 'all'
                  ? 'No tasks for this selection. Create your first task to get started!'
                  : 'Create your first task to organize your workflow processes.'
                }
              </p>
              <button 
                className="btn-primary"
                onClick={() => onTaskCreate(
                  kanbanColumns[0]?.id || 'todo', 
                  currentWorkflow?.id, 
                  currentClient?.id
                )}
              >
                <Plus className="w-5 h-5" />
                Create First Task
              </button>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}