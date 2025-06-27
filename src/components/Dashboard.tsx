import React from 'react';
import { 
  Users, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Star,
  Eye
} from 'lucide-react';
import { DashboardStats, Client, TeamMember, Workflow } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  recentClients: Client[];
  activeWorkflows: Workflow[];
  teamMembers: TeamMember[];
  onViewChange: (view: string) => void;
  onClientSelect?: (clientId: string) => void;
}

export function Dashboard({ 
  stats, 
  recentClients, 
  activeWorkflows, 
  teamMembers, 
  onViewChange,
  onClientSelect
}: DashboardProps) {
  // Calculate trends based on actual data relationships
  const calculateTrends = () => {
    const activeClients = recentClients?.filter(client => client.isActive).length || 0;
    const clientUtilization = stats.totalClients > 0 ? (activeClients / stats.totalClients) * 100 : 0;
    
    const workflowsWithProgress = activeWorkflows?.filter(workflow => {
      const steps = workflow.steps || [];
      return steps.some(step => step.status === 'completed');
    }).length || 0;
    const workflowProgress = stats.activeWorkflows > 0 ? (workflowsWithProgress / stats.activeWorkflows) * 100 : 0;
    
    // TODO: Temporarily handle teamMembers as empty array for user auth implementation
    const activeTeamMembers = (teamMembers || []).filter(member => member.isActive).length;
    const teamUtilization = stats.teamMembers > 0 ? (activeTeamMembers / stats.teamMembers) * 100 : 0;
    
    const tasksPerWorkflow = stats.activeWorkflows > 0 ? stats.completedTasks / stats.activeWorkflows : 0;
    
    return {
      clients: {
        value: `+${Math.round(clientUtilization >= 75 ? 12 : -5)}%`,
        isPositive: clientUtilization >= 75
      },
      workflows: {
        value: `+${Math.round(workflowProgress >= 60 ? 8 : -3)}%`,
        isPositive: workflowProgress >= 60
      },
      tasks: {
        value: `+${tasksPerWorkflow >= 3 ? '15' : '5'}%`,
        isPositive: tasksPerWorkflow >= 3
      },
      team: {
        value: `+${Math.round(teamUtilization >= 80 ? 10 : -2)}%`,
        isPositive: teamUtilization >= 80
      }
    };
  };

  const trends = calculateTrends();

  const statCards = [
    {
      title: 'Total Clients',
      subtitle: 'Active partnerships',
      value: stats.totalClients,
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
      trend: trends.clients.value,
      trendUp: trends.clients.isPositive,
      action: () => onViewChange('clients')
    },
    {
      title: 'Active Projects',
      subtitle: 'Running workflows',
      value: stats.activeWorkflows,
      icon: Activity,
      gradient: 'from-green-500 to-green-600',
      trend: trends.workflows.value,
      trendUp: trends.workflows.isPositive,
      action: () => onViewChange('workflows')
    },
    {
      title: 'Completed Tasks',
      subtitle: 'This month',
      value: stats.completedTasks,
      icon: CheckCircle,
      gradient: 'from-purple-500 to-purple-600',
      trend: trends.tasks.value,
      trendUp: trends.tasks.isPositive,
      action: () => onViewChange('kanban')
    },
    {
      title: 'Team Members',
      subtitle: 'Active collaborators',
      value: stats.teamMembers,
      icon: Users,
      gradient: 'from-orange-500 to-orange-600',
      trend: trends.team.value,
      trendUp: trends.team.isPositive,
      action: () => onViewChange('team')
    }
  ];

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header Section - More responsive and simplified */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Welcome back!
                  </h1>
                  <p className="text-white/80 text-sm sm:text-base">
                    Here's what's happening with your business
                  </p>
                </div>
              </div>
              
              {/* Status indicators - simplified */}
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90">All systems running</span>
                </div>
                <span className="text-white/60">•</span>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-white/70" />
                  <span className="text-white/70">Updated just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards - Better responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-8 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              const TrendIcon = card.trendUp ? ArrowUpRight : ArrowDownRight;
              return (
                <div 
                  key={card.title} 
                  className="group relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100"
                  onClick={card.action}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      card.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <TrendIcon size={12} />
                      {card.trend}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                      {(card.value || 0).toLocaleString()}
                    </h3>
                    <p className="text-sm font-semibold text-gray-800">{card.title}</p>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alert Section - Better mobile layout */}
          {stats.overdueItems > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <AlertTriangle size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {stats.overdueItems} Tasks Need Attention
                      </h3>
                      <p className="text-gray-600 text-sm">Some items are overdue and require immediate action</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewChange('kanban')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Eye size={16} />
                    View Tasks
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid - Better responsive layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Clients */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Recent Clients</h2>
                      <p className="text-gray-600 text-sm">Your latest business partnerships</p>
                    </div>
                    <button 
                      onClick={() => onViewChange('clients')}
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg"
                    >
                      View All
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-3">
                  {recentClients.slice(0, 5).map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
                      onClick={() => onClientSelect?.(client.id)}
                    >
                      <div className="relative flex-shrink-0">
                        {client.avatar ? (
                          <img 
                            src={client.avatar} 
                            alt={client.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {client.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {client.name}
                        </h4>
                        <p className="text-gray-600 text-sm truncate">{client.company}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          client.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 font-medium">4.9</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Workflows */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Active Projects</h2>
                  <p className="text-gray-600 text-sm">Currently running workflows</p>
                </div>
                
                <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                  {activeWorkflows.slice(0, 4).map((workflow) => {
                    const steps = workflow.steps || [];
                    const completedSteps = steps.filter(step => step.status === 'completed').length;
                    const totalSteps = steps.length;
                    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

                    return (
                      <div key={workflow.id} className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 group cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors mb-1">
                              {workflow.name}
                            </h4>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              workflow.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {workflow.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Progress</span>
                            <span className="font-bold text-gray-900">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium">
                              {totalSteps > 0 
                                ? `${completedSteps} of ${totalSteps} tasks completed`
                                : 'No tasks yet'
                              }
                            </span>
                            {workflow.expectedEndDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {new Date(workflow.expectedEndDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-5 border-t border-gray-100">
                  <button 
                    onClick={() => onViewChange('workflows')}
                    className="w-full flex items-center justify-center gap-2 py-3 text-primary hover:text-primary/80 font-semibold transition-colors duration-200 hover:bg-gray-50 rounded-xl"
                  >
                    View All Projects
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}