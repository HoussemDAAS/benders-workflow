import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  User,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  MapPin,
  Globe,
  Users,
  Workflow as WorkflowIcon
} from 'lucide-react';
import { Client, Workflow, KanbanTask, TeamMember } from '../types';

interface ClientsViewProps {
  clients: Client[];
  workflows: Workflow[];
  tasks: KanbanTask[];
  teamMembers: TeamMember[];
  onClientCreate: () => void;
  onClientEdit: (client: Client) => void;
  onClientStatusChange: (clientId: string, isActive: boolean) => void;
}

interface ClientCardProps {
  client: Client;
  clientWorkflows: Workflow[];
  clientTasks: KanbanTask[];
  onEdit: (client: Client) => void;
  onStatusChange: (clientId: string, isActive: boolean) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  clientWorkflows, 
  clientTasks,
  onEdit, 
  onStatusChange 
}) => {
  const activeWorkflows = clientWorkflows.filter(w => w.status === 'active').length;
  const completedWorkflows = clientWorkflows.filter(w => w.status === 'completed').length;
  const totalTasks = clientTasks.length;
  const completedTasks = clientTasks.filter(t => t.status === 'done').length;
  
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const isOverdue = clientWorkflows.some(workflow => 
    workflow.expectedEndDate && 
    new Date(workflow.expectedEndDate) < new Date() && 
    workflow.status !== 'completed'
  );

  return (
    <div className={`client-card ${!client.isActive ? 'inactive' : ''} ${isOverdue ? 'has-overdue' : ''}`}>
      <div className="client-card-header">
        <div className="client-avatar-section">
          <div className="client-avatar large">
            {client.avatar ? (
              <img src={client.avatar} alt={client.name} />
            ) : (
              <Building2 size={24} />
            )}
          </div>
          <div className="client-basic-info">
            <h3 className="client-name">{client.name}</h3>
            <p className="client-company">{client.company}</p>
            <span className={`client-status ${client.isActive ? 'active' : 'inactive'}`}>
              {client.isActive ? 'Active Client' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="client-actions">
          <button 
            className="action-btn secondary"
            onClick={() => onEdit(client)}
          >
            <Edit3 size={16} />
          </button>
          <div className="client-menu">
            <button className="menu-trigger">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="client-contact">
        <div className="contact-item">
          <Mail size={14} />
          <span>{client.email}</span>
        </div>
        {client.phone && (
          <div className="contact-item">
            <Phone size={14} />
            <span>{client.phone}</span>
          </div>
        )}
        <div className="contact-item">
          <Calendar size={14} />
          <span>Client since {new Date(client.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="client-projects-overview">
        <h4>Project Overview</h4>
        <div className="overview-stats">
          <div className="overview-stat">
            <WorkflowIcon size={16} />
            <span>{clientWorkflows.length} Total Workflows</span>
          </div>
          <div className="overview-stat">
            <CheckCircle size={16} className="text-green-500" />
            <span>{activeWorkflows} Active</span>
          </div>
          <div className="overview-stat">
            <Clock size={16} className="text-blue-500" />
            <span>{completedWorkflows} Completed</span>
          </div>
        </div>
      </div>

      {totalTasks > 0 && (
        <div className="client-progress">
          <div className="progress-header">
            <span className="progress-label">Overall Progress</span>
            <span className="progress-percentage">{Math.round(overallProgress)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="progress-stats">
            {completedTasks}/{totalTasks} tasks completed
          </div>
        </div>
      )}

      <div className="client-recent-activity">
        <h4>Recent Workflows</h4>
        <div className="activity-list">
          {clientWorkflows.slice(0, 3).map((workflow) => (
            <div key={workflow.id} className="activity-item">
              <div className="activity-content">
                <div className="activity-name">{workflow.name}</div>
                <div className="activity-meta">
                  <span className={`activity-status ${workflow.status}`}>
                    {workflow.status}
                  </span>
                  {workflow.expectedEndDate && (
                    <span className="activity-date">
                      Due {new Date(workflow.expectedEndDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {clientWorkflows.length === 0 && (
            <div className="no-activity">No workflows yet</div>
          )}
          {clientWorkflows.length > 3 && (
            <div className="more-activity">
              +{clientWorkflows.length - 3} more workflows
            </div>
          )}
        </div>
      </div>

      <div className="client-card-footer">
        <div className="client-value">
          <DollarSign size={14} />
          <span>High Value Client</span>
        </div>
        
        <div className="status-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={client.isActive}
              onChange={(e) => onStatusChange(client.id, e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {isOverdue && (
        <div className="overdue-indicator">
          <AlertTriangle size={16} />
          <span>Has overdue projects</span>
        </div>
      )}
    </div>
  );
};

interface ClientStatsProps {
  clients: Client[];
  workflows: Workflow[];
  tasks: KanbanTask[];
}

const ClientStats: React.FC<ClientStatsProps> = ({ clients, workflows, tasks }) => {
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.isActive).length;
  const clientsWithActiveProjects = clients.filter(client => 
    workflows.some(w => w.clientId === client.id && w.status === 'active')
  ).length;
  const avgWorkflowsPerClient = totalClients > 0 ? Math.round(workflows.length / totalClients) : 0;

  const stats = [
    {
      label: 'Total Clients',
      value: totalClients,
      icon: Building2,
      color: 'blue',
      trend: '+12%'
    },
    {
      label: 'Active Clients',
      value: activeClients,
      icon: CheckCircle,
      color: 'green',
      trend: '+8%'
    },
    {
      label: 'With Active Projects',
      value: clientsWithActiveProjects,
      icon: WorkflowIcon,
      color: 'purple',
      trend: '+15%'
    },
    {
      label: 'Avg Workflows/Client',
      value: avgWorkflowsPerClient,
      icon: TrendingUp,
      color: 'orange',
      trend: '+5%'
    }
  ];

  return (
    <div className="client-stats">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="stat-header">
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <span className="stat-trend">{stat.trend}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function ClientsView({ 
  clients, 
  workflows,
  tasks,
  teamMembers,
  onClientCreate, 
  onClientEdit,
  onClientStatusChange 
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && client.isActive) ||
                         (statusFilter === 'inactive' && !client.isActive);
    
    const clientWorkflows = workflows.filter(w => w.clientId === client.id);
    let matchesProject = true;
    
    if (projectFilter === 'with-active') {
      matchesProject = clientWorkflows.some(w => w.status === 'active');
    } else if (projectFilter === 'without-projects') {
      matchesProject = clientWorkflows.length === 0;
    } else if (projectFilter === 'overdue') {
      matchesProject = clientWorkflows.some(w => 
        w.expectedEndDate && 
        new Date(w.expectedEndDate) < new Date() && 
        w.status !== 'completed'
      );
    }
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  return (
    <div className="clients-view">
      <div className="clients-header">
        <div className="header-content">
          <h1>Clients</h1>
          <p>Manage client relationships and track project progress</p>
        </div>
        <button className="create-client-btn" onClick={onClientCreate}>
          <Plus size={20} />
          Add Client
        </button>
      </div>

      <ClientStats 
        clients={clients}
        workflows={workflows}
        tasks={tasks}
      />

      <div className="clients-controls">
        <div className="clients-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select 
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              <option value="with-active">With Active Projects</option>
              <option value="without-projects">No Projects</option>
              <option value="overdue">Has Overdue</option>
            </select>
          </div>
        </div>

        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      <div className={`clients-grid ${viewMode}`}>
        {filteredClients.map((client) => {
          const clientWorkflows = workflows.filter(w => w.clientId === client.id);
          const clientTasks = tasks.filter(task => 
            clientWorkflows.some(workflow => workflow.id === task.workflowId)
          );
          
          return (
            <ClientCard
              key={client.id}
              client={client}
              clientWorkflows={clientWorkflows}
              clientTasks={clientTasks}
              onEdit={onClientEdit}
              onStatusChange={onClientStatusChange}
            />
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>No clients found</h3>
          <p>Try adjusting your filters or add a new client to get started.</p>
          <button className="create-client-btn" onClick={onClientCreate}>
            <Plus size={20} />
            Add Your First Client
          </button>
        </div>
      )}
    </div>
  );
} 