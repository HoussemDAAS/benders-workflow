import React from 'react';
import { 
  Users, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';
import { DashboardStats, Client, TeamMember, Workflow } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  recentClients: Client[];
  activeWorkflows: Workflow[];
  teamMembers: TeamMember[];
  onViewChange: (view: string) => void;
}

export function Dashboard({ 
  stats, 
  recentClients, 
  activeWorkflows, 
  teamMembers, 
  onViewChange 
}: DashboardProps) {
  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Building2,
      color: 'blue',
      trend: '+12%',
      action: () => onViewChange('clients')
    },
    {
      title: 'Active Workflows',
      value: stats.activeWorkflows,
      icon: Activity,
      color: 'green',
      trend: '+8%',
      action: () => onViewChange('workflows')
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'purple',
      trend: '+24%',
      action: () => onViewChange('kanban')
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      color: 'orange',
      trend: '+2',
      action: () => onViewChange('team')
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your workflows.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className={`stat-card ${card.color}`}
              onClick={card.action}
            >
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <Icon size={24} />
                  <span className="stat-trend">{card.trend}</span>
                </div>
                <div className="stat-card-body">
                  <h3>{card.value}</h3>
                  <p>{card.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Section */}
      {stats.overdueItems > 0 && (
        <div className="alert-section">
          <div className="alert warning">
            <AlertTriangle size={20} />
            <div>
              <strong>Attention Required:</strong> You have {stats.overdueItems} overdue items that need immediate attention.
            </div>
            <button onClick={() => onViewChange('kanban')}>
              View Tasks
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Recent Clients */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Clients</h2>
            <button onClick={() => onViewChange('clients')} className="view-all-btn">
              View All
            </button>
          </div>
          <div className="client-list">
            {recentClients.slice(0, 5).map((client) => (
              <div key={client.id} className="client-item">
                <div className="client-avatar">
                  {client.avatar ? (
                    <img src={client.avatar} alt={client.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {client.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="client-info">
                  <h4>{client.name}</h4>
                  <p>{client.company}</p>
                </div>
                <div className="client-status">
                  <span className={`status ${client.isActive ? 'active' : 'inactive'}`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Workflows */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active Workflows</h2>
            <button onClick={() => onViewChange('workflows')} className="view-all-btn">
              View All
            </button>
          </div>
          <div className="workflow-list">
            {activeWorkflows.slice(0, 4).map((workflow) => {
              const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
              const totalSteps = workflow.steps.length;
              const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

              return (
                <div key={workflow.id} className="workflow-item">
                  <div className="workflow-header">
                    <h4>{workflow.name}</h4>
                    <span className={`workflow-status ${workflow.status}`}>
                      {workflow.status}
                    </span>
                  </div>
                  <p className="workflow-description">{workflow.description}</p>
                  <div className="workflow-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {completedSteps}/{totalSteps} steps completed
                    </span>
                  </div>
                  <div className="workflow-meta">
                    <span className="workflow-date">
                      <Calendar size={14} />
                      {workflow.expectedEndDate 
                        ? new Date(workflow.expectedEndDate).toLocaleDateString()
                        : 'No due date'
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 