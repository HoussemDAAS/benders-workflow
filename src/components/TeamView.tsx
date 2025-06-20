import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  Settings,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Users
} from 'lucide-react';
import { TeamMember, Workflow, KanbanTask } from '../types';

interface TeamViewProps {
  teamMembers: TeamMember[];
  workflows: Workflow[];
  tasks: KanbanTask[];
  onMemberCreate: () => void;
  onMemberEdit: (member: TeamMember) => void;
  onMemberStatusChange: (memberId: string, isActive: boolean) => void;
}

interface TeamMemberCardProps {
  member: TeamMember;
  assignedTasks: KanbanTask[];
  activeWorkflows: Workflow[];
  onEdit: (member: TeamMember) => void;
  onStatusChange: (memberId: string, isActive: boolean) => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  assignedTasks, 
  activeWorkflows,
  onEdit, 
  onStatusChange 
}) => {
  const completedTasks = assignedTasks.filter(task => task.status === 'done').length;
  const inProgressTasks = assignedTasks.filter(task => task.status === 'in-progress').length;
  const overdueTasks = assignedTasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  ).length;

  const workloadScore = assignedTasks.length;
  const getWorkloadColor = (score: number) => {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  };

  return (
    <div className={`team-member-card ${!member.isActive ? 'inactive' : ''}`}>
      <div className="member-card-header">
        <div className="member-avatar-section">
          <div className="member-avatar large">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} />
            ) : (
              member.name.charAt(0)
            )}
          </div>
          <div className="member-basic-info">
            <h3 className="member-name">{member.name}</h3>
            <p className="member-role">{member.role}</p>
            <span className={`member-status ${member.isActive ? 'active' : 'inactive'}`}>
              {member.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="member-actions">
          <button 
            className="action-btn secondary"
            onClick={() => onEdit(member)}
          >
            <Edit3 size={16} />
          </button>
          <div className="member-menu">
            <button className="menu-trigger">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="member-contact">
        <div className="contact-item">
          <Mail size={14} />
          <span>{member.email}</span>
        </div>
        <div className="contact-item">
          <Calendar size={14} />
          <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="member-skills">
        <h4>Skills</h4>
        <div className="skills-list">
          {member.skills.slice(0, 4).map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
          {member.skills.length > 4 && (
            <span className="skill-tag more">
              +{member.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="member-workload">
        <div className="workload-header">
          <h4>Current Workload</h4>
          <span className={`workload-indicator ${getWorkloadColor(workloadScore)}`}>
            {workloadScore} tasks
          </span>
        </div>
        
        <div className="workload-stats">
          <div className="stat-item">
            <CheckCircle size={16} className="text-green-500" />
            <span>{completedTasks} completed</span>
          </div>
          <div className="stat-item">
            <Clock size={16} className="text-blue-500" />
            <span>{inProgressTasks} in progress</span>
          </div>
          {overdueTasks > 0 && (
            <div className="stat-item">
              <AlertTriangle size={16} className="text-red-500" />
              <span>{overdueTasks} overdue</span>
            </div>
          )}
        </div>
      </div>

      <div className="member-projects">
        <h4>Active Workflows</h4>
        <div className="projects-list">
          {activeWorkflows.slice(0, 3).map((workflow) => (
            <div key={workflow.id} className="project-item">
              <div className="project-name">{workflow.name}</div>
              <div className="project-client">
                {/* We'd normally get client name here */}
                Client Project
              </div>
            </div>
          ))}
          {activeWorkflows.length === 0 && (
            <div className="no-projects">No active workflows</div>
          )}
          {activeWorkflows.length > 3 && (
            <div className="more-projects">
              +{activeWorkflows.length - 3} more workflows
            </div>
          )}
        </div>
      </div>

      <div className="member-card-footer">
        <div className="performance-indicator">
          <Award size={14} />
          <span>Performance: Good</span>
        </div>
        
        <div className="status-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={member.isActive}
              onChange={(e) => onStatusChange(member.id, e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

interface TeamStatsProps {
  teamMembers: TeamMember[];
  tasks: KanbanTask[];
  workflows: Workflow[];
}

const TeamStats: React.FC<TeamStatsProps> = ({ teamMembers, tasks, workflows }) => {
  const activeMembers = teamMembers.filter(m => m.isActive).length;
  const totalMembers = teamMembers.length;
  const avgTasksPerMember = activeMembers > 0 ? Math.round(tasks.length / activeMembers) : 0;
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;

  const stats = [
    {
      label: 'Total Team Members',
      value: totalMembers,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Active Members',
      value: activeMembers,
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Avg Tasks per Member',
      value: avgTasksPerMember,
      icon: Clock,
      color: 'purple'
    },
    {
      label: 'Active Workflows',
      value: activeWorkflows,
      icon: Award,
      color: 'orange'
    }
  ];

  return (
    <div className="team-stats">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">
              <Icon size={24} />
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

export function TeamView({ 
  teamMembers, 
  workflows,
  tasks,
  onMemberCreate, 
  onMemberEdit,
  onMemberStatusChange 
}: TeamViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get unique roles for filter
  const uniqueRoles = Array.from(new Set(teamMembers.map(m => m.role)));

  return (
    <div className="team-view">
      <div className="team-header">
        <div className="header-content">
          <h1>Team Members</h1>
          <p>Manage your team, track workloads, and optimize assignments</p>
        </div>
        <button className="create-member-btn" onClick={onMemberCreate}>
          <Plus size={20} />
          Add Team Member
        </button>
      </div>

      <TeamStats 
        teamMembers={teamMembers}
        tasks={tasks}
        workflows={workflows}
      />

      <div className="team-controls">
        <div className="team-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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

      <div className={`team-grid ${viewMode}`}>
        {filteredMembers.map((member) => {
          const memberTasks = tasks.filter(task => 
            task.assignedMembers.includes(member.id)
          );
          const memberWorkflows = workflows.filter(workflow =>
            workflow.steps.some(step => step.assignedMembers.includes(member.id))
          );
          
          return (
            <TeamMemberCard
              key={member.id}
              member={member}
              assignedTasks={memberTasks}
              activeWorkflows={memberWorkflows}
              onEdit={onMemberEdit}
              onStatusChange={onMemberStatusChange}
            />
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="empty-state">
          <User size={48} />
          <h3>No team members found</h3>
          <p>Try adjusting your filters or add a new team member to get started.</p>
          <button className="create-member-btn" onClick={onMemberCreate}>
            <Plus size={20} />
            Add Your First Team Member
          </button>
        </div>
      )}
    </div>
  );
} 