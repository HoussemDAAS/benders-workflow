import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Workflow, 
  Kanban, 
  Users, 
  Building2,
  Settings,
  Plus,
  CheckSquare,
  Calendar,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  User,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  onNewTask?: () => void;
}

export function Sidebar({ onNewTask }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get current view from URL path
  const currentView = location.pathname.slice(1) || 'dashboard';

  const handleViewChange = (view: string) => {
    navigate(`/${view}`);
    setIsMobileMenuOpen(false);
  };

  const handleNewWorkflow = () => {
    navigate('/workflows');
    setIsMobileMenuOpen(false);
  };

  const handleNewTask = () => {
    if (onNewTask) {
      onNewTask();
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      badge: null
    },
    { 
      id: 'workflows', 
      label: 'Workflows', 
      icon: Workflow, 
      badge: '3'
    },
    { 
      id: 'kanban', 
      label: 'Kanban', 
      icon: Kanban, 
      badge: '12'
    },
    { 
      id: 'meetings', 
      label: 'Meetings', 
      icon: Calendar, 
      badge: null
    },
    { 
      id: 'team', 
      label: 'Team', 
      icon: Users, 
      badge: null
    },
    { 
      id: 'clients', 
      label: 'Clients', 
      icon: Building2, 
      badge: '8'
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-tertiary to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                WorkflowPro
              </h1>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2 border-b border-white/10">
        <button 
          className="w-full group flex items-center gap-3 px-4 py-3 bg-secondary hover:bg-secondary/90 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20"
          onClick={handleNewWorkflow}
        >
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Plus size={14} />
          </div>
          <span className="text-sm">New Workflow</span>
          <ChevronRight size={14} className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
        
        {onNewTask && (
          <button 
            className="w-full group flex items-center gap-3 px-4 py-3 bg-tertiary hover:bg-tertiary/90 text-primary rounded-xl font-medium transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-tertiary/30"
            onClick={handleNewTask}
          >
            <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <CheckSquare size={14} />
            </div>
            <span className="text-sm">Quick Task</span>
            <ChevronRight size={14} className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto nav-scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <div key={item.id} className="relative">
              <button
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/15 text-white shadow-lg border border-white/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => handleViewChange(item.id)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/5 group-hover:bg-white/15'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <span className="px-1.5 py-0.5 bg-tertiary text-primary text-xs font-bold rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></div>
                )}
              </button>
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-tertiary rounded-r-full"></div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile & Settings */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* User Profile - Enhanced with real user data */}
        <div className="flex items-center gap-2 p-2 bg-white/10 rounded-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-secondary to-tertiary rounded-lg flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-white/60 capitalize">
              {user?.role || 'Member'}
            </div>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
        </div>

        {/* Settings */}
        <button className="w-full group flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200">
          <div className="w-6 h-6 bg-white/5 group-hover:bg-white/15 rounded-lg flex items-center justify-center transition-colors">
            <Settings size={14} />
          </div>
          <span className="text-sm">Settings</span>
        </button>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full group flex items-center gap-3 px-3 py-2 text-white/70 hover:text-red-200 hover:bg-red-500/20 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-6 h-6 bg-white/5 group-hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
            {isLoggingOut ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <LogOut size={14} />
            )}
          </div>
          <span className="text-sm">
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </span>
        </button>
        
        {/* Version info - Simplified */}
        <div className="px-3 py-2 text-center">
          <div className="text-xs text-white/40 font-medium">v2.1.0</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300">
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] transform transition-transform duration-300">
            <div className="w-full h-full bg-gradient-to-b from-primary via-accent to-primary/95 text-white flex flex-col shadow-2xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                <SidebarContent />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 bg-gradient-to-b from-primary via-accent to-primary/95 text-white flex-col shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}