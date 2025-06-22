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
  AlertTriangle,
  X,
} from 'lucide-react';
import { Workflow, Client, TeamMember, WorkflowStep, KanbanTask } from '../types';
import { nodeTypes } from '../nodes';
import { TaskFlowView } from './TaskFlowView';
import { WorkflowHeader } from './WorkflowHeader';
import { WorkflowFilters } from './WorkflowFilters';
import { WorkflowCard } from './WorkflowCard';
import { EmptyState } from './EmptyState';

interface WorkflowsViewProps {
  workflows: Workflow[];
  clients: Client[];
  teamMembers: TeamMember[];
  tasks: KanbanTask[];
  onWorkflowCreate: (workflow: CreateWorkflowData) => void;
  onWorkflowEdit: (workflow: Workflow) => void;
  onWorkflowDelete: (workflowId: string) => void;
  onWorkflowStatusChange: (workflowId: string, status: string) => void;
  initialClientFilter?: string;
}

interface CreateWorkflowData {
  name: string;
  description: string;
  clientId: string;
  status: 'draft' | 'active' | 'completed' | 'on-hold';
  startDate?: string;
  expectedEndDate?: string;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary to-accent text-white">
          <div>
            <h2 className="text-2xl font-bold">{workflow.name} - Flowchart</h2>
            <p className="text-white/80">Design and visualize your workflow steps</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-tertiary hover:bg-tertiary/90 text-primary rounded-xl font-semibold transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-accent text-white -m-px -mb-0 rounded-t-2xl">
          <h2 className="text-xl font-semibold">{workflow ? 'Edit Workflow' : 'Create New Workflow'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="form-label">Workflow Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="E-commerce Platform Development"
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div>
            <label className="form-label">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the workflow objectives and deliverables..."
              rows={4}
              className={`form-input resize-none ${errors.description ? 'form-input-error' : ''}`}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Client *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className={`form-input ${errors.clientId ? 'form-input-error' : ''}`}
              >
                <option value="">Select a client</option>
                {clients.filter(c => c.isActive).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company} - {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <span className="form-error">{errors.clientId}</span>}
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Expected End Date</label>
              <input
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                className={`form-input ${errors.expectedEndDate ? 'form-input-error' : ''}`}
              />
              {errors.expectedEndDate && <span className="form-error">{errors.expectedEndDate}</span>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Delete Workflow</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">Are you sure you want to delete the workflow <strong>"{workflow.name}"</strong>?</p>
              <p className="text-gray-600 text-sm mt-2">This will permanently remove all workflow steps, connections, and associated tasks. This action cannot be undone.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-outline">
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
  onWorkflowStatusChange,
  initialClientFilter 
}: WorkflowsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>(initialClientFilter || 'all');
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

  const hasFilters = searchTerm !== '' || statusFilter !== 'all' || clientFilter !== 'all';

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
    <div className="min-h-full bg-gray-50">
      {/* Header Section */}
      <WorkflowHeader
        totalWorkflows={workflows.length}
        activeWorkflows={statusCounts.active || 0}
        onCreateWorkflow={() => setIsCreateModalOpen(true)}
      />

      <div className="px-6 pb-6">
        {/* Filters Section */}
        <WorkflowFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          clientFilter={clientFilter}
          statusCounts={statusCounts}
          totalWorkflows={workflows.length}
          clients={clients}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onClientFilterChange={setClientFilter}
        />

        {/* Workflows Grid */}
        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => {
              const client = clients.find(c => c.id === workflow.clientId);
              const workflowTasks = tasks.filter(task => task.workflowId === workflow.id);
              
              return (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  client={client}
                  tasks={workflowTasks}
                  onEdit={setEditingWorkflow}
                  onDelete={setDeletingWorkflow}
                  onViewFlow={setTaskFlowWorkflow}
                  onStatusChange={onWorkflowStatusChange}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            hasFilters={hasFilters}
            onCreateWorkflow={() => setIsCreateModalOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
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