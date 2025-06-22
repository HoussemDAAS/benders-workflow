import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../flowchart-nodes.css';

import { 
  Plus, 
  Calendar,
  Search,
  Filter,
  Edit2,
  Trash2,
  MoreVertical,
  Building,
  Target,
  Workflow as WorkflowIcon,
  Play,
  CheckCircle,
  Pause,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Workflow, Client, TeamMember, WorkflowStep, KanbanTask } from '../types';
import { nodeTypes } from '../nodes';
import { TaskFlowView } from './TaskFlowView';

interface WorkflowsViewProps {
  workflows: Workflow[];
  clients: Client[];
  teamMembers: TeamMember[];
  tasks: KanbanTask[];
  onWorkflowCreate: (workflow: CreateWorkflowData) => void;
  onWorkflowEdit: (workflow: Workflow) => void;
  onWorkflowDelete: (workflowId: string) => void;
  onWorkflowStatusChange: (workflowId: string, status: string) => void;
}

interface CreateWorkflowData {
  name: string;
  description: string;
  clientId: string;
  status: 'draft' | 'active' | 'completed' | 'on-hold';
  startDate?: string;
  expectedEndDate?: string;
}

interface WorkflowCardProps {
  workflow: Workflow;
  client: Client | undefined;
  teamMembers: TeamMember[];
  workflowTasks: KanbanTask[];
  onEdit: (workflow: Workflow) => void;
  onStatusChange: (workflowId: string, status: string) => void;
  onViewFlowchart: (workflow: Workflow) => void;
}

interface WorkflowModalProps {
  workflow?: Workflow;
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkflowData) => void;
}

interface DeleteModalProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Unused WorkflowCard component - keeping interface for potential future use
// Currently using inline rendering in the main component

interface FlowchartViewProps {
  workflow: Workflow;
  onClose: () => void;
  onWorkflowUpdate: (workflow: Workflow) => void;
}

const FlowchartView: React.FC<FlowchartViewProps> = ({ workflow, onClose, onWorkflowUpdate }) => {
  // Handle workflows without steps/connections data from API
  const steps = workflow.steps || [];
  const connections = workflow.connections || [];
  
  // Convert workflow steps to React Flow nodes
  const initialNodes: Node[] = steps.map((step) => ({
    id: step.id,
    type: step.type || 'process',
    position: step.position || { x: 0, y: 0 },
    data: { 
      label: step.name,
      description: step.description 
    },
  }));

  // Convert workflow connections to React Flow edges
  const initialEdges: Edge[] = connections.map((conn) => ({
    id: conn.id,
    source: conn.source,
    target: conn.target,
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle,
    label: conn.label,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );

  const handleSave = useCallback(() => {
    // Convert back to workflow format and save
    const updatedSteps: WorkflowStep[] = nodes.map((node) => {
      const originalStep = steps.find(s => s.id === node.id);
      return {
        ...originalStep!,
        position: node.position,
        name: (node.data as any).label,
        description: (node.data as any).description || '',
      };
    });

    const updatedWorkflow: Workflow = {
      ...workflow,
      steps: updatedSteps,
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      })),
      updatedAt: new Date(),
    };

    onWorkflowUpdate(updatedWorkflow);
    onClose();
  }, [nodes, edges, workflow, steps, onWorkflowUpdate, onClose]);

  return (
    <div className="flowchart-overlay">
      <div className="flowchart-header">
        <div>
          <h2>{workflow.name} - Flowchart</h2>
          <p>Design and visualize your workflow steps</p>
        </div>
        <div className="flowchart-actions">
          <button className="action-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="action-btn primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="flowchart-container">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#f1f5f9" />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'start-end': return '#22c55e';
                case 'process': return '#3b82f6';
                case 'decision': return '#f59e0b';
                case 'input-output': return '#8b5cf6';
                default: return '#6b7280';
              }
            }}
            maskColor="rgba(255, 255, 255, 0.2)"
            position="bottom-right"
          />
          <Controls position="bottom-right" style={{ bottom: 100 }} />
        </ReactFlow>
      </div>
    </div>
  );
};

const WorkflowModal: React.FC<WorkflowModalProps> = ({ workflow, clients, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateWorkflowData>({
    name: workflow?.name || '',
    description: workflow?.description || '',
    clientId: workflow?.clientId || '',
    status: workflow?.status || 'draft',
    startDate: workflow?.startDate ? new Date(workflow.startDate).toISOString().split('T')[0] : '',
    expectedEndDate: workflow?.expectedEndDate ? new Date(workflow.expectedEndDate).toISOString().split('T')[0] : ''
  });

  const [errors, setErrors] = useState<Partial<CreateWorkflowData>>({});

  const validateForm = () => {
    const newErrors: Partial<CreateWorkflowData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Workflow name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.clientId) newErrors.clientId = 'Client selection is required';
    
    if (formData.startDate && formData.expectedEndDate) {
      if (new Date(formData.startDate) >= new Date(formData.expectedEndDate)) {
        newErrors.expectedEndDate = 'End date must be after start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{workflow ? 'Edit Workflow' : 'Create New Workflow'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Workflow Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="E-commerce Platform Development"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the workflow objectives and deliverables..."
              rows={4}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Client *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className={errors.clientId ? 'error' : ''}
              >
                <option value="">Select a client</option>
                {clients.filter(c => c.isActive).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company} - {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <span className="error-text">{errors.clientId}</span>}
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Expected End Date</label>
              <input
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                className={errors.expectedEndDate ? 'error' : ''}
              />
              {errors.expectedEndDate && <span className="error-text">{errors.expectedEndDate}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {workflow ? 'Update Workflow' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal: React.FC<DeleteModalProps> = ({ workflow, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
        <div className="modal-header">
          <h2>Delete Workflow</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-body">
          <div className="delete-warning">
            <AlertCircle size={48} className="warning-icon" />
            <p>Are you sure you want to delete the workflow <strong>"{workflow.name}"</strong>?</p>
            <p className="warning-text">This will permanently remove all workflow steps, connections, and associated tasks.</p>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Delete Workflow
          </button>
        </div>
      </div>
    </div>
  );
};

export function WorkflowsView({ 
  workflows, 
  clients, 
  teamMembers,
  tasks,
  onWorkflowCreate, 
  onWorkflowEdit,
  onWorkflowDelete,
  onWorkflowStatusChange 
}: WorkflowsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);
  const [taskFlowWorkflow, setTaskFlowWorkflow] = useState<Workflow | null>(null);

  const statusCounts = workflows.reduce((acc, workflow) => {
    acc[workflow.status] = (acc[workflow.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesClient = clientFilter === 'all' || workflow.clientId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="status-icon active" size={16} />;
      case 'completed': return <CheckCircle className="status-icon completed" size={16} />;
      case 'on-hold': return <Pause className="status-icon on-hold" size={16} />;
      default: return <Clock className="status-icon draft" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'on-hold': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handleCreateWorkflow = (data: CreateWorkflowData) => {
    onWorkflowCreate(data);
    setIsCreateModalOpen(false);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    onWorkflowEdit(workflow);
    setEditingWorkflow(null);
  };

  const handleDeleteWorkflow = () => {
    if (deletingWorkflow) {
      onWorkflowDelete(deletingWorkflow.id);
      setDeletingWorkflow(null);
    }
  };

  return (
    <div className="workflows-view">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <WorkflowIcon size={24} />
            Workflow Management
          </h1>
          <p>Create and manage project workflows for your clients</p>
        </div>
        
        <button 
          className="btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={20} />
          Create Workflow
        </button>
      </div>

      <div className="page-controls">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select 
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company}
              </option>
            ))}
          </select>

          <div className="filter-tabs">
            <button 
              className={statusFilter === 'all' ? 'active' : ''}
              onClick={() => setStatusFilter('all')}
            >
              All ({workflows.length})
            </button>
            <button 
              className={statusFilter === 'active' ? 'active' : ''}
              onClick={() => setStatusFilter('active')}
            >
              Active ({statusCounts.active || 0})
            </button>
            <button 
              className={statusFilter === 'draft' ? 'active' : ''}
              onClick={() => setStatusFilter('draft')}
            >
              Draft ({statusCounts.draft || 0})
            </button>
            <button 
              className={statusFilter === 'on-hold' ? 'active' : ''}
              onClick={() => setStatusFilter('on-hold')}
            >
              On Hold ({statusCounts['on-hold'] || 0})
            </button>
            <button 
              className={statusFilter === 'completed' ? 'active' : ''}
              onClick={() => setStatusFilter('completed')}
            >
              Completed ({statusCounts.completed || 0})
            </button>
          </div>
        </div>
      </div>

      <div className="workflows-grid">
        {filteredWorkflows.map((workflow) => {
          const client = clients.find(c => c.id === workflow.clientId);
          const workflowTasks = tasks.filter(task => task.workflowId === workflow.id);
          const totalTasks = workflowTasks.length;
          const completedTasks = workflowTasks.filter(task => task.status === 'done').length;
          const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          return (
            <div key={workflow.id} className="workflow-card">
              <div className="workflow-header">
                <div className="workflow-title">
                  <h3>{workflow.name}</h3>
                  <div className="workflow-status">
                    {getStatusIcon(workflow.status)}
                    <span className={`status-text ${workflow.status}`}>
                      {workflow.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div className="workflow-actions">
                  <div className="status-selector">
                    <select
                      value={workflow.status}
                      onChange={(e) => onWorkflowStatusChange(workflow.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="dropdown">
                    <button className="dropdown-trigger">
                      <MoreVertical size={16} />
                    </button>
                    <div className="dropdown-menu">
                      <button onClick={() => setEditingWorkflow(workflow)}>
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={() => setTaskFlowWorkflow(workflow)}
                      >
                        <WorkflowIcon size={14} />
                        View Task Flow
                      </button>
                      <button 
                        onClick={() => setDeletingWorkflow(workflow)}
                        className="danger"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="workflow-description">{workflow.description}</p>

              <div className="workflow-client">
                <Building size={14} />
                <span>{client?.company || 'Unknown Client'}</span>
                <span className="client-name">({client?.name})</span>
              </div>

              <div className="workflow-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span className="progress-percentage">{progressPercentage}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${progressPercentage}%`,
                      backgroundColor: getStatusColor(workflow.status)
                    }}
                  />
                </div>
                <div className="progress-details">
                  <span>{completedTasks} of {totalTasks} tasks completed</span>
                </div>
              </div>

              <div className="workflow-dates">
                {workflow.startDate && (
                  <div className="date-item">
                    <Calendar size={14} />
                    <span>Started: {new Date(workflow.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {workflow.expectedEndDate && (
                  <div className="date-item">
                    <Target size={14} />
                    <span>Due: {new Date(workflow.expectedEndDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="workflow-stats">
                <div className="stat-item">
                  <span className="stat-value">{totalTasks}</span>
                  <span className="stat-label">Tasks</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{workflow.connections?.length || 0}</span>
                  <span className="stat-label">Connections</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {Math.ceil((new Date().getTime() - new Date(workflow.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                  <span className="stat-label">Days Active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="empty-state">
          <WorkflowIcon size={48} />
          <h3>No workflows found</h3>
          <p>
            {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first workflow to get started'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && clientFilter === 'all' && (
            <button 
              className="btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={20} />
              Create First Workflow
            </button>
          )}
        </div>
      )}

      <WorkflowModal
        workflow={editingWorkflow}
        clients={clients}
        isOpen={isCreateModalOpen || !!editingWorkflow}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingWorkflow(null);
        }}
        onSubmit={editingWorkflow ? handleEditWorkflow : handleCreateWorkflow}
      />

      <DeleteModal
        workflow={deletingWorkflow!}
        isOpen={!!deletingWorkflow}
        onClose={() => setDeletingWorkflow(null)}
        onConfirm={handleDeleteWorkflow}
      />

      {taskFlowWorkflow && (
        <TaskFlowView
          workflow={taskFlowWorkflow}
          tasks={tasks.filter(task => task.workflowId === taskFlowWorkflow.id)}
          teamMembers={teamMembers}
          onClose={() => setTaskFlowWorkflow(null)}
        />
      )}
    </div>
  );
} 