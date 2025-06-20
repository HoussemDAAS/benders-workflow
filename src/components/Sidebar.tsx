import React from 'react';
import { 
  LayoutDashboard, 
  Workflow, 
  Kanban, 
  Users, 
  Building2,
  Settings,
  Plus
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onNewWorkflow: () => void;
}

export function Sidebar({ currentView, onViewChange, onNewWorkflow }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'clients', label: 'Clients', icon: Building2 },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">
          <Workflow className="sidebar-logo" />
          WorkflowPro
        </h1>
      </div>

      <div className="sidebar-actions">
        <button className="new-workflow-btn" onClick={onNewWorkflow}>
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
} 