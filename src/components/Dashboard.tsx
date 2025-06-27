
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
        value: `${Math.round(clientUtilization)}%`,
        isPositive: clientUtilization >= 75
      },
      workflows: {
        value: `${Math.round(workflowProgress)}%`,
        isPositive: workflowProgress >= 60
      },
      tasks: {
        value: `${Math.round(tasksPerWorkflow * 10) / 10}/wf`,
        isPositive: tasksPerWorkflow >= 3
      },
      team: {
        value: `${Math.round(teamUtilization)}%`,
        isPositive: teamUtilization >= 80
      }
    };
  };

  const trends = calculateTrends();

  const statCards = [
    {
      title: 'Clients',
      value: stats.totalClients,
      icon: Building2,
      gradient: 'from-primary to-accent',
      trend: trends.clients.value,
      trendUp: trends.clients.isPositive,
      action: () => onViewChange('clients')
    },
    {
      title: 'Workflows',
      value: stats.activeWorkflows,
      icon: Activity,
      gradient: 'from-secondary to-primary',
      trend: trends.workflows.value,
      trendUp: trends.workflows.isPositive,
      action: () => onViewChange('workflows')
    },
    {
      title: 'Tasks Done',
      value: stats.completedTasks,
      icon: CheckCircle,
      gradient: 'from-tertiary to-secondary',
      trend: trends.tasks.value,
      trendUp: trends.tasks.isPositive,
      action: () => onViewChange('kanban')
    },
    {
      title: 'Team',
      value: stats.teamMembers,
      icon: Users,
      gradient: 'from-accent to-tertiary',
      trend: trends.team.value,
      trendUp: trends.team.isPositive,
      action: () => onViewChange('team')
    }
  ];

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header Section - Simplified */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white pt-16 lg:pt-0">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-tertiary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  Dashboard
                </h1>
              </div>
              <p className="text-lg text-white/90 font-medium">
                Welcome back! Here's your business overview.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/80">System Online</span>
                <span className="text-white/60 mx-2">•</span>
                <Clock size={14} className="text-white/60" />
                <span className="text-sm text-white/60">Updated now</span>
              </div>
            </div>
            
           
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 -mt-6 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            const TrendIcon = card.trendUp ? ArrowUpRight : ArrowDownRight;
            return (
              <div 
                key={card.title} 
                className="group relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100"
                onClick={card.action}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    card.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <TrendIcon size={12} />
                    {card.trend}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                    {card.value.toLocaleString()}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert Section */}
        {stats.overdueItems > 0 && (
          <div className="mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {stats.overdueItems} Overdue Items
                  </h3>
                  <p className="text-gray-700">Items need immediate attention.</p>
                </div>
                <button 
                  onClick={() => onViewChange('kanban')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors duration-200"
                >
                  <Eye size={16} />
                  View
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Clients */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Clients</h2>
                    <p className="text-gray-600 text-sm">Latest partnerships</p>
                  </div>
                  <button 
                    onClick={() => onViewChange('clients')}
                    className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors duration-200"
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
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
                    onClick={() => onClientSelect?.(client.id)}
                  >
                    <div className="relative">
                      {client.avatar ? (
                        <img 
                          src={client.avatar} 
                          alt={client.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
                          {client.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {client.name}
                      </h4>
                      <p className="text-gray-600 text-sm truncate">{client.company}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">4.9</span>
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
                <h2 className="text-xl font-bold text-gray-900">Active Workflows</h2>
                <p className="text-gray-600 text-sm">Running processes</p>
              </div>
              
              <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                {activeWorkflows.slice(0, 4).map((workflow) => {
                  const steps = workflow.steps || [];
                  const completedSteps = steps.filter(step => step.status === 'completed').length;
                  const totalSteps = steps.length;
                  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

                  return (
                    <div key={workflow.id} className="p-3 rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200 group cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                            {workflow.name}
                          </h4>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            workflow.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {workflow.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-tertiary to-secondary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {totalSteps > 0 
                              ? `${completedSteps}/${totalSteps} steps`
                              : 'No steps'
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
                  className="w-full flex items-center justify-center gap-2 py-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                >
                  View All Workflows
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}