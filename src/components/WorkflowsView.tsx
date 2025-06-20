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
  Edit3, 
  Play, 
  Pause, 
  MoreHorizontal, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { Workflow, Client, TeamMember, WorkflowStep } from '../types';
import { nodeTypes } from '../nodes';

interface WorkflowsViewProps {
  workflows: Workflow[];
  clients: Client[];
  teamMembers: TeamMember[];
  onWorkflowCreate: () => void;
  onWorkflowEdit: (workflow: Workflow) => void;
  onWorkflowStatusChange: (workflowId: string, status: string) => void;
}

interface WorkflowCardProps {
  workflow: Workflow;
  client: Client | undefined;
  teamMembers: TeamMember[];
  onEdit: (workflow: Workflow) => void;
  onStatusChange: (workflowId: string, status: string) => void;
  onViewFlowchart: (workflow: Workflow) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
  workflow, 
  client, 
  teamMembers, 
  onEdit, 
  onStatusChange,
  onViewFlowchart 
}) => {
  // Handle workflows without steps data from API
  const steps = workflow.steps || [];
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const assignedMembers = steps
    .flatMap(step => step.assignedMembers || [])
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(memberId => teamMembers.find(member => member.id === memberId))
    .filter(Boolean)
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'on-hold': return 'text-yellow-600 bg-yellow-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play size={12} />;
      case 'completed': return <CheckCircle size={12} />;
      case 'on-hold': return <Pause size={12} />;
      case 'draft': return <Edit3 size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const isOverdue = workflow.expectedEndDate && new Date(workflow.expectedEndDate) < new Date() && workflow.status !== 'completed';

  return (
    <div className={`workflow-card ${isOverdue ? 'overdue' : ''}`}>
      <div className="workflow-card-header">
        <div className="workflow-title-section">
          <h3 className="workflow-title">{workflow.name}</h3>
          <span className={`workflow-status-badge ${getStatusColor(workflow.status)}`}>
            {getStatusIcon(workflow.status)}
            {workflow.status}
          </span>
        </div>
        <div className="workflow-actions">
          <button 
            className="action-btn secondary"
            onClick={() => onViewFlowchart(workflow)}
          >
            View Flowchart
          </button>
          <button 
            className="action-btn"
            onClick={() => onEdit(workflow)}
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      <p className="workflow-description">{workflow.description}</p>

      <div className="workflow-client">
        <strong>Client:</strong> {client?.name} ({client?.company})
      </div>

      <div className="workflow-progress-section">
        <div className="progress-header">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-stats">
          {totalSteps > 0 
            ? `${completedSteps}/${totalSteps} steps completed`
            : 'No steps defined'
          }
        </div>
      </div>

      <div className="workflow-team">
        <div className="team-label">Team:</div>
        <div className="team-avatars">
          {assignedMembers.map((member, index) => (
            <div key={index} className="team-avatar" title={member?.name}>
              {member?.name?.charAt(0)}
            </div>
          ))}
          {assignedMembers.length === 0 && (
            <span className="no-team">No team assigned</span>
          )}
        </div>
      </div>

      <div className="workflow-footer">
        <div className="workflow-dates">
          {workflow.startDate && (
            <div className="date-item">
              <Calendar size={14} />
              Started: {new Date(workflow.startDate).toLocaleDateString()}
            </div>
          )}
          {workflow.expectedEndDate && (
            <div className={`date-item ${isOverdue ? 'overdue' : ''}`}>
              <Clock size={14} />
              Due: {new Date(workflow.expectedEndDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="workflow-quick-actions">
          {workflow.status === 'draft' && (
            <button 
              className="quick-action-btn start"
              onClick={() => onStatusChange(workflow.id, 'active')}
            >
              Start
            </button>
          )}
          {workflow.status === 'active' && (
            <button 
              className="quick-action-btn pause"
              onClick={() => onStatusChange(workflow.id, 'on-hold')}
            >
              Pause
            </button>
          )}
          {workflow.status === 'on-hold' && (
            <button 
              className="quick-action-btn resume"
              onClick={() => onStatusChange(workflow.id, 'active')}
            >
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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

export function WorkflowsView({ 
  workflows, 
  clients, 
  teamMembers, 
  onWorkflowCreate, 
  onWorkflowEdit,
  onWorkflowStatusChange 
}: WorkflowsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesClient = selectedClient === 'all' || workflow.clientId === selectedClient;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleWorkflowUpdate = useCallback((updatedWorkflow: Workflow) => {
    onWorkflowEdit(updatedWorkflow);
  }, [onWorkflowEdit]);

  return (
    <ReactFlowProvider>
      <div className="workflows-view">
        <div className="workflows-header">
          <div className="header-content">
            <h1>Workflows</h1>
            <p>Design, manage, and track your client workflows</p>
          </div>
          <button className="create-workflow-btn" onClick={onWorkflowCreate}>
            <Plus size={20} />
            Create Workflow
          </button>
        </div>

        <div className="workflows-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>

            <select 
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.company}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="workflows-grid">
          {filteredWorkflows.map((workflow) => {
            const client = clients.find(c => c.id === workflow.clientId);
            return (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                client={client}
                teamMembers={teamMembers}
                onEdit={onWorkflowEdit}
                onStatusChange={onWorkflowStatusChange}
                onViewFlowchart={(workflow) => setSelectedWorkflow(workflow)}
              />
            );
          })}
        </div>

        {filteredWorkflows.length === 0 && (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No workflows found</h3>
            <p>Try adjusting your filters or create a new workflow to get started.</p>
            <button className="create-workflow-btn" onClick={onWorkflowCreate}>
              <Plus size={20} />
              Create Your First Workflow
            </button>
          </div>
        )}

        {selectedWorkflow && (
          <FlowchartView
            workflow={selectedWorkflow}
            onClose={() => setSelectedWorkflow(null)}
            onWorkflowUpdate={handleWorkflowUpdate}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
} 