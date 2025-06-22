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
  Users,
  Edit2,
  Trash2,
  XCircle,
  AlertCircle,
  Briefcase,
  Star
} from 'lucide-react';
import { TeamMember, Workflow, KanbanTask } from '../types';

interface TeamViewProps {
  teamMembers: TeamMember[];
  workflows: Workflow[];
  tasks: KanbanTask[];
  onMemberCreate: (member: CreateMemberData) => void;
  onMemberEdit: (member: TeamMember) => void;
  onMemberDelete: (memberId: string) => void;
  onMemberStatusChange: (memberId: string, isActive: boolean) => void;
}

interface TeamMemberCardProps {
  member: TeamMember;
  assignedTasks: KanbanTask[];
  activeWorkflows: Workflow[];
  onEdit: (member: TeamMember) => void;
  onStatusChange: (memberId: string, isActive: boolean) => void;
}

interface CreateMemberData {
  name: string;
  email: string;
  role: string;
  skills: string[];
  isActive: boolean;
}

interface MemberModalProps {
  member?: TeamMember;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMemberData) => void;
}

interface DeleteModalProps {
  member: TeamMember;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
          <span>Joined {new Date(member.createdAt || member.created_at || Date.now()).toLocaleDateString()}</span>
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

const ROLE_OPTIONS = [
  'Project Manager',
  'Frontend Developer', 
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'DevOps Engineer',
  'QA Engineer',
  'Business Analyst',
  'Scrum Master',
  'Product Manager'
];

const SKILL_OPTIONS = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'PHP', 'C#',
  'JavaScript', 'TypeScript', 'HTML/CSS', 'MongoDB', 'PostgreSQL', 'MySQL',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'CI/CD', 'Testing', 'Agile',
  'Scrum', 'Design Systems', 'Figma', 'Adobe Creative Suite', 'Project Management'
];

const MemberModal: React.FC<MemberModalProps> = ({ member, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateMemberData>({
    name: member?.name || '',
    email: member?.email || '',
    role: member?.role || '',
    skills: member?.skills || [],
    isActive: member?.isActive ?? true
  });

  const [errors, setErrors] = useState<Partial<CreateMemberData>>({});
  const [skillInput, setSkillInput] = useState('');

  const validateForm = () => {
    const newErrors: Partial<CreateMemberData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    
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

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        skills: [...prev.skills, skillInput.trim()] 
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const addPresetSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({ 
        ...prev, 
        skills: [...prev.skills, skill] 
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{member ? 'Edit Team Member' : 'Add New Team Member'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@company.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className={errors.role ? 'error' : ''}
            >
              <option value="">Select a role</option>
              {ROLE_OPTIONS.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          <div className="form-group">
            <label>Skills</label>
            <div className="skills-input">
              <div className="skill-adder">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button type="button" onClick={addSkill} className="btn-secondary">
                  Add
                </button>
              </div>
              <div className="skill-presets">
                <p>Quick add:</p>
                <div className="preset-skills">
                  {SKILL_OPTIONS.filter(skill => !formData.skills.includes(skill)).slice(0, 8).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addPresetSkill(skill)}
                      className="skill-preset"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="selected-skills">
                {formData.skills.map(skill => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              Active Team Member
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {member ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal: React.FC<DeleteModalProps> = ({ member, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
        <div className="modal-header">
          <h2>Remove Team Member</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-body">
          <div className="delete-warning">
            <AlertCircle size={48} className="warning-icon" />
            <p>Are you sure you want to remove <strong>{member.name}</strong> from the team?</p>
            <p className="warning-text">This will unassign them from all tasks and workflows.</p>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Remove Member
          </button>
        </div>
      </div>
    </div>
  );
};

export function TeamView({ 
  teamMembers, 
  workflows,
  tasks,
  onMemberCreate, 
  onMemberEdit,
  onMemberDelete,
  onMemberStatusChange 
}: TeamViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const uniqueRoles = Array.from(new Set(teamMembers.map(member => member.role)));

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter(task => 
      task.assignedMembers && task.assignedMembers.includes(memberId)
    );
    const memberWorkflows = workflows.filter(workflow =>
      workflow.steps && workflow.steps.some(step => 
        step.assignedMembers && step.assignedMembers.includes(memberId)
      )
    );

    return {
      totalTasks: memberTasks.length,
      completedTasks: memberTasks.filter(t => t.status === 'done').length,
      activeWorkflows: memberWorkflows.filter(w => w.status === 'active').length
    };
  };

  const handleCreateMember = (data: CreateMemberData) => {
    onMemberCreate(data);
    setIsCreateModalOpen(false);
  };

  const handleEditMember = (member: TeamMember) => {
    onMemberEdit(member);
    setEditingMember(null);
  };

  const handleDeleteMember = () => {
    if (deletingMember) {
      onMemberDelete(deletingMember.id);
      setDeletingMember(null);
    }
  };

  return (
    <div className="team-view">
      <div className="team-header">
        <div className="header-content">
          <h1>Team Members</h1>
          <p>Manage your team, track workloads, and optimize assignments</p>
        </div>
        <button className="create-member-btn" onClick={() => setIsCreateModalOpen(true)}>
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

            <div className="filter-tabs">
              <button 
                className={statusFilter === 'all' ? 'active' : ''}
                onClick={() => setStatusFilter('all')}
              >
                All ({teamMembers.length})
              </button>
              <button 
                className={statusFilter === 'active' ? 'active' : ''}
                onClick={() => setStatusFilter('active')}
              >
                Active ({teamMembers.filter(m => m.isActive).length})
              </button>
              <button 
                className={statusFilter === 'inactive' ? 'active' : ''}
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive ({teamMembers.filter(m => !m.isActive).length})
              </button>
            </div>
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
          const stats = getMemberStats(member.id);
          
          return (
            <div key={member.id} className={`member-card ${!member.isActive ? 'inactive' : ''}`}>
              <div className="member-header">
                <div className="member-avatar">
                  <User size={24} />
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p className="role">
                    <Briefcase size={14} />
                    {member.role}
                  </p>
                </div>
                <div className="member-actions">
                  <button 
                    className={`status-toggle ${member.isActive ? 'active' : 'inactive'}`}
                    onClick={() => onMemberStatusChange(member.id, !member.isActive)}
                    title={member.isActive ? 'Deactivate member' : 'Activate member'}
                  >
                    {member.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </button>
                  <div className="dropdown">
                    <button className="dropdown-trigger">
                      <MoreVertical size={16} />
                    </button>
                    <div className="dropdown-menu">
                      <button onClick={() => setEditingMember(member)}>
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeletingMember(member)}
                        className="danger"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
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
                <label>
                  <Star size={12} />
                  Skills:
                </label>
                <div className="skills-list">
                  {member.skills.slice(0, 4).map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > 4 && (
                    <span className="skill-more">
                      +{member.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="member-stats">
                <div className="stat-item">
                  <span className="stat-value">{stats.completedTasks}/{stats.totalTasks}</span>
                  <span className="stat-label">Tasks Done</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.activeWorkflows}</span>
                  <span className="stat-label">Active Projects</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                  </span>
                  <span className="stat-label">Completion</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No team members found</h3>
          <p>
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start building your team by adding members'
            }
          </p>
          {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
            <button 
              className="btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={20} />
              Add First Member
            </button>
          )}
        </div>
      )}

      <MemberModal
        member={editingMember}
        isOpen={isCreateModalOpen || !!editingMember}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingMember(null);
        }}
        onSubmit={editingMember ? handleEditMember : handleCreateMember}
      />

      <DeleteModal
        member={deletingMember!}
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteMember}
      />
    </div>
  );
} 