import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Workflow as WorkflowIcon,
  ArrowUpRight
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

interface ClientStatsProps {
  clients: Client[];
  workflows: Workflow[];
}

const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  clientWorkflows, 
  clientTasks,
  onEdit
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
    <div className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 ${
      !client.isActive ? 'opacity-75 bg-gray-50' : ''
    } ${isOverdue ? 'ring-2 ring-red-200 border-red-200' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {client.avatar ? (
              <img 
                src={client.avatar} 
                alt={client.name}
                className="w-14 h-14 rounded-xl object-cover shadow-md"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
                <Building2 size={24} className="text-white" />
              </div>
            )}
            {client.isActive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary transition-colors duration-300">
              {client.name}
            </h3>
            <p className="text-sm text-gray-600 font-medium">{client.company}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold mt-1 ${
              client.isActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {client.isActive ? 'Active Client' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 bg-gray-100 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(client);
            }}
          >
            <Edit3 size={14} />
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail size={14} className="text-gray-400" />
          <span className="truncate">{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} className="text-gray-400" />
            <span>{client.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>Client since {new Date(client.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Project Overview */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Project Overview</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <WorkflowIcon size={14} className="text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">{clientWorkflows.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle size={14} className="text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">{activeWorkflows}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={14} className="text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">{completedWorkflows}</div>
            <div className="text-xs text-gray-600">Done</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {completedTasks}/{totalTasks} tasks completed
          </div>
        </div>
      )}

      {/* Recent Workflows */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Recent Workflows</h4>
        <div className="space-y-2">
          {clientWorkflows.slice(0, 3).map((workflow) => (
            <div key={workflow.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{workflow.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                    workflow.status === 'active' ? 'bg-green-100 text-green-700' :
                    workflow.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    workflow.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {workflow.status}
                  </span>
                  {workflow.expectedEndDate && (
                    <span className="text-xs text-gray-500">
                      Due {new Date(workflow.expectedEndDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {clientWorkflows.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-2">No workflows yet</div>
          )}
          {clientWorkflows.length > 3 && (
            <div className="text-xs text-gray-500 text-center py-1">
              +{clientWorkflows.length - 3} more workflows
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {/* <div className="flex items-center justify-end pt-3 border-t border-gray-100">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={client.isActive}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(client.id, e.target.checked);
            }}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div> */}
    </div>
  );
};

const ClientStats: React.FC<ClientStatsProps> = ({ clients, workflows }) => {
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
      gradient: 'from-blue-500 to-blue-600',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Active Clients',
      value: activeClients,
      icon: CheckCircle,
      gradient: 'from-green-500 to-green-600',
      trend: '+8%',
      trendUp: true
    },
    {
      label: 'With Active Projects',
      value: clientsWithActiveProjects,
      icon: WorkflowIcon,
      gradient: 'from-purple-500 to-purple-600',
      trend: '+15%',
      trendUp: true
    },
    {
      label: 'Avg Workflows/Client',
      value: avgWorkflowsPerClient,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-orange-600',
      trend: '+5%',
      trendUp: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trendUp ? ArrowUpRight : AlertTriangle;
        return (
          <div key={stat.label} className="group relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <TrendIcon size={12} />
                {stat.trend}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                {stat.value.toLocaleString()}
              </h3>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
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

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.isActive).length;
  const clientsWithActiveProjects = clients.filter(client => 
    workflows.some(w => w.clientId === client.id && w.status === 'active')
  ).length;

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white pt-16 lg:pt-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-white">Clients</h1>
              </div>
              <p className="text-lg text-white/90 font-medium mb-4">
                Manage client relationships and track project progress
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/80">{totalClients} Total Clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/80">{activeClients} Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <WorkflowIcon className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/80">{clientsWithActiveProjects} With Projects</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClientCreate}
              className="flex items-center gap-2 px-6 py-3 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-semibold transition-all duration-200 shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Stats */}
        <div className="-mt-6 mb-6">
          <ClientStats 
            clients={clients}
            workflows={workflows}
          />
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 flex-1 lg:flex-none lg:min-w-[150px]"
            >
              <option value="all" className="text-gray-900">All Status</option>
              <option value="active" className="text-gray-900">Active</option>
              <option value="inactive" className="text-gray-900">Inactive</option>
            </select>

            <select 
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 flex-1 lg:flex-none lg:min-w-[170px]"
            >
              <option value="all" className="text-gray-900">All Projects</option>
              <option value="with-active" className="text-gray-900">With Active Projects</option>
              <option value="without-projects" className="text-gray-900">No Projects</option>
              <option value="overdue" className="text-gray-900">Has Overdue</option>
            </select>

            <div className="flex bg-gray-100 rounded-xl p-1">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
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

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start building your client base by adding your first client'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && projectFilter === 'all' && (
              <button 
                className="btn-primary"
                onClick={onClientCreate}
              >
                <Plus className="w-5 h-5" />
                Add First Client
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}