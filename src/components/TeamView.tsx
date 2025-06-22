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
  AlertCircle,
  AlertTriangle,
  LayoutGrid,
  List
} from 'lucide-react';
import { TeamMember, Workflow } from '../types';

interface TeamViewProps {
  teamMembers: TeamMember[];
  onMemberCreate: () => void;
  onMemberEdit: (member: TeamMember) => void;
  onMemberDelete: (memberId: string) => void;
  onMemberStatusChange: (memberId: string, isActive: boolean) => void;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onStatusChange: (memberId: string, isActive: boolean) => void;
}

interface DeleteModalProps {
  member: TeamMember;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  onEdit, 
  onStatusChange 
}) => {
  // Mock data for tasks - in real app this would come from props
  const assignedTasks = 5;
  const completedTasks = 3;
  const inProgressTasks = 2;
  const overdueTasks = 0;

  const workloadScore = assignedTasks;
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
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md text-lg font-bold text-white">
              {member.name.charAt(0)}
            </div>
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

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <Award size={14} className="text-yellow-500" />
          <span className="text-gray-600 font-medium">Team Member</span>
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
  workflows?: Workflow[];
}

const TeamStats: React.FC<TeamStatsProps> = ({ teamMembers }) => {
  const activeMembers = teamMembers.filter(m => m.isActive).length;
  const totalMembers = teamMembers.length;
  const avgTasksPerMember = 5; // Mock data
  const uniqueSkills = new Set(teamMembers.flatMap(m => m.skills)).size;

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
      label: 'Unique Skills',
      value: uniqueSkills,
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
  onMemberCreate, 
  onMemberEdit,
  onMemberDelete,
  onMemberStatusChange 
}: TeamViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  const handleDeleteMember = () => {
    if (deletingMember) {
      onMemberDelete(deletingMember.id);
      setDeletingMember(null);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header Section - matching other pages */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white pt-16 lg:pt-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">Team Management</h1>
                  <p className="text-lg text-white/90 font-medium">Manage your team members and track their performance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-white/70" />
                  <span className="font-medium">{teamMembers.length} Total Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-white/70" />
                  <span className="font-medium">{teamMembers.filter(m => m.isActive).length} Active</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <LayoutGrid size={16} />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <List size={16} />
                  List
                </button>
              </div>
              
              <button
                onClick={onMemberCreate}
                className="flex items-center gap-2 px-6 py-3 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-semibold transition-all duration-200 shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Team Member
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 py-6">
        <TeamStats teamMembers={teamMembers} />
      </div>

      <div className="px-6 pb-6">
        {/* Filters Section - positioned like other pages */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 -mt-6 mb-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 bg-white"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 bg-white min-w-[140px]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="project-manager">Project Manager</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="analyst">Analyst</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 bg-white min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 bg-white min-w-[150px]"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Team Members Grid */}
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {sortedMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onEdit={onMemberEdit}
                onStatusChange={onMemberStatusChange}
              />
            ))}
          </div>

          {/* Empty State */}
          {sortedMembers.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || roleFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start building your team by adding your first member'
                }
              </p>
              {!searchTerm && roleFilter === 'all' && (
                <button 
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 mx-auto"
                  onClick={onMemberCreate}
                >
                  <Plus className="w-5 h-5" />
                  Add First Member
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deletingMember && (
        <DeleteModal
          member={deletingMember}
          isOpen={!!deletingMember}
          onClose={() => setDeletingMember(null)}
          onConfirm={handleDeleteMember}
        />
      )}
    </div>
  );
}