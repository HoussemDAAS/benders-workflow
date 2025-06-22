import React, { useState } from 'react';
import { 
  Plus, 
  Mail, 
  Calendar,
  Search,
  CheckCircle,
  Clock,
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
    if (score >= 8) return 'bg-red-500 text-red-700';
    if (score >= 5) return 'bg-yellow-500 text-yellow-700';
    return 'bg-green-500 text-green-700';
  };

  return (
    <div className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100 ${
      !member.isActive ? 'opacity-75 bg-gray-50' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {member.avatar ? (
              <img 
                src={member.avatar} 
                alt={member.name}
                className="w-14 h-14 rounded-xl object-cover shadow-md"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md text-lg font-bold text-white">
                {member.name.charAt(0)}
              </div>
            )}
            {member.isActive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary transition-colors duration-300">
              {member.name}
            </h3>
            <p className="text-sm text-gray-600 font-medium">{member.role}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold mt-1 ${
              member.isActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {member.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 bg-gray-100 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(member);
            }}
          >
            <Edit2 size={14} />
          </button>
          
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail size={14} className="text-gray-400" />
          <span className="truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>Joined {new Date(member.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Skills</h4>
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 4).map((skill, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {skill}
            </span>
          ))}
          {member.skills.length > 4 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              +{member.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Workload */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-gray-900">Current Workload</h4>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getWorkloadColor(workloadScore)}`}>
            {workloadScore} tasks
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle size={14} className="text-green-600" />
            </div>
            <div className="text-sm font-bold text-green-600">{completedTasks}</div>
            <div className="text-xs text-gray-600">Done</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={14} className="text-blue-600" />
            </div>
            <div className="text-sm font-bold text-blue-600">{inProgressTasks}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          {overdueTasks > 0 && (
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle size={14} className="text-red-600" />
              </div>
              <div className="text-sm font-bold text-red-600">{overdueTasks}</div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Active Workflows</h4>
        <div className="space-y-2">
          {activeWorkflows.slice(0, 3).map((workflow) => (
            <div key={workflow.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{workflow.name}</div>
                <div className="text-xs text-gray-500">Client Project</div>
              </div>
            </div>
          ))}
          {activeWorkflows.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-2">No active workflows</div>
          )}
          {activeWorkflows.length > 3 && (
            <div className="text-xs text-gray-500 text-center py-1">
              +{activeWorkflows.length - 3} more workflows
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <Award size={14} className="text-yellow-500" />
          <span className="text-gray-600 font-medium">Top Performer</span>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={member.isActive}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(member.id, e.target.checked);
            }}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
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
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 text-blue-600'
    },
    {
      label: 'Active Members',
      value: activeMembers,
      icon: CheckCircle,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100 text-green-600'
    },
    {
      label: 'Avg Tasks per Member',
      value: avgTasksPerMember,
      icon: Clock,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 text-purple-600'
    },
    {
      label: 'Active Workflows',
      value: activeWorkflows,
      icon: Award,
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <Icon size={24} />
              </div>
              <div className={`h-2 w-16 bg-gradient-to-r ${stat.gradient} rounded-full`}></div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {member ? 'Edit Team Member' : 'Add New Team Member'}
          </h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' : 'border-gray-200 focus:border-primary'
                }`}
              />
              {errors.name && <span className="text-sm text-red-600">{errors.name}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@company.com"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' : 'border-gray-200 focus:border-primary'
                }`}
              />
              {errors.email && <span className="text-sm text-red-600">{errors.email}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                errors.role ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' : 'border-gray-200 focus:border-primary'
              }`}
            >
              <option value="">Select a role</option>
              {ROLE_OPTIONS.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && <span className="text-sm text-red-600">{errors.role}</span>}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Skills</label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button 
                type="button" 
                onClick={addSkill} 
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.filter(skill => !formData.skills.includes(skill)).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addPresetSkill(skill)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors duration-200"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {formData.skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Selected skills:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <div key={skill} className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:bg-primary/20 rounded-full p-1 transition-colors duration-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary/20 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">Active member</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors duration-200"
            >
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Remove Team Member</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to remove <strong>{member?.name}</strong> from the team? 
            They will lose access to all assigned tasks and workflows.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors duration-200"
            >
              Remove Member
            </button>
          </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-accent to-primary rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Team Members</h1>
            <p className="text-white/90">Manage your team, track workloads, and optimize assignments</p>
          </div>
          <button 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={20} />
            Add Team Member
          </button>
        </div>
      </div>

      <TeamStats 
        teamMembers={teamMembers}
        tasks={tasks}
        workflows={workflows}
      />

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 w-full sm:w-64"
            />
          </div>
          
          {/* Role Filter */}
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          {/* Status Filter Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'all' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setStatusFilter('all')}
            >
              All ({teamMembers.length})
            </button>
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'active' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setStatusFilter('active')}
            >
              Active ({teamMembers.filter(m => m.isActive).length})
            </button>
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'inactive' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive ({teamMembers.filter(m => !m.isActive).length})
            </button>
          </div>
        </div>

        {/* View Controls */}
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

      {/* Team Grid */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      }`}>
        {filteredMembers.map((member) => {
          const stats = getMemberStats(member.id);
          
          return (
            <div 
              key={member.id} 
              className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 ${
                !member.isActive ? 'opacity-75 bg-gray-50' : ''
              } ${
                viewMode === 'list' ? 'flex items-center gap-6' : ''
              }`}
            >
              {/* Member Header */}
              <div className={`flex items-center gap-4 ${viewMode === 'list' ? 'flex-1' : 'mb-4'}`}>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {member.name.charAt(0)}
                  </div>
                  {member.isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{member.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase size={14} />
                    <span>{member.role}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    member.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      member.isActive 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => onMemberStatusChange(member.id, !member.isActive)}
                    title={member.isActive ? 'Deactivate member' : 'Activate member'}
                  >
                    {member.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </button>
                  <button 
                    className="w-8 h-8 bg-gray-100 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all duration-200"
                    onClick={() => setEditingMember(member)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="w-8 h-8 bg-gray-100 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200"
                    onClick={() => setDeletingMember(member)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {viewMode === 'grid' && (
                <>
                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      <span>Joined {new Date(member.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={12} className="text-gray-400" />
                      <h4 className="text-sm font-medium text-gray-900">Skills</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 4).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                      {member.skills.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          +{member.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="text-sm font-bold text-green-600">{stats.completedTasks}/{stats.totalTasks}</div>
                      <div className="text-xs text-gray-600">Tasks Done</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="text-sm font-bold text-blue-600">{stats.activeWorkflows}</div>
                      <div className="text-xs text-gray-600">Projects</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <div className="text-sm font-bold text-purple-600">
                        {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">Complete</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start building your team by adding members'
            }
          </p>
          {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
            <button 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
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