import React, { useState, useEffect, useMemo } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus, 
  Calendar, 
  Workflow as WorkflowIcon,
  Building
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
      className={`group bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200 ${
        isDragging ? 'opacity-50 transform rotate-2 scale-105' : ''
      } ${isOverdue ? 'ring-2 ring-red-200 border-red-200' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h4>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${getPriorityColor(priority)}`} />
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            +{tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center -space-x-2">
          {assignedMemberNames.map((name, index) => (
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
        
        {dueDate && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            isOverdue 
              ? 'bg-red-100 text-red-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
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
      className={`bg-gray-50 rounded-2xl p-4 min-h-[600px] transition-all duration-300 ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b-4 border-gray-200" style={{ borderTopColor: column.color, borderBottomColor: column.color }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }}></div>
          <h3 className="font-bold text-gray-900">{column.title}</h3>
          <span className="px-2 py-1 bg-white rounded-full text-sm font-bold text-gray-600 shadow-sm">
            {tasks.length}
          </span>
        </div>
        <button 
          className="w-8 h-8 bg-white hover:bg-primary hover:text-white text-gray-600 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm"
          onClick={handleCreateTask}
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            teamMembers={teamMembers}
            onEdit={onTaskEdit}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Plus size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-3">No tasks yet</p>
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-primary hover:text-white text-gray-600 rounded-xl font-medium transition-all duration-200 shadow-sm border border-gray-200"
              onClick={handleCreateTask}
            >
              <Plus size={14} />
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
  // onRefresh is unused but kept for potential future use
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
                  <div className="w-10 h-10 bg-gradient-to-br from-tertiary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <WorkflowIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">Kanban Board</h1>
                </div>
                <p className="text-lg text-white/90 font-medium">
                  Manage tasks and workflow steps by status
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Building size={16} className="text-white/80" />
                  <select 
                    value={selectedClient}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="bg-transparent text-white font-medium outline-none"
                  >
                    <option value="all" className="text-gray-900">All Clients</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id} className="text-gray-900">
                        {client.company || client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <WorkflowIcon size={16} className="text-white/80" />
                  <select 
                    value={selectedWorkflow}
                    onChange={(e) => handleWorkflowChange(e.target.value)}
                    className="bg-transparent text-white font-medium outline-none"
                  >
                    <option value="all" className="text-gray-900">
                      {selectedClient === 'all' ? 'All Workflows' : 'All Client Workflows'}
                    </option>
                    {clientWorkflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id} className="text-gray-900">
                        {workflow.name} ({workflow.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Workflow Info */}
          {currentWorkflow && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 -mt-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{currentWorkflow.name}</h3>
                  <p className="text-gray-600 mb-3">{currentWorkflow.description}</p>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                      currentWorkflow.status === 'active' ? 'bg-green-100 text-green-700' :
                      currentWorkflow.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      currentWorkflow.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {currentWorkflow.status}
                    </span>
                    {currentClient && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building size={14} />
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
                <div className="loading-spinner-container w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-gray-600 font-medium">Loading tasks...</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
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

          {/* Empty State */}
          {!loading && workflowTasks.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WorkflowIcon size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6">
                {selectedWorkflow !== 'all' || selectedClient !== 'all'
                  ? 'No tasks for this selection. Create your first task!'
                  : 'Create your first task to get started.'
                }
              </p>
              <button 
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all duration-200 shadow-lg mx-auto"
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
      </div>
    </DndProvider>
  );
} 