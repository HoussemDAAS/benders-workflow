import React, { useState, useEffect } from 'react';
import { X, User, Mail, Briefcase, Plus, Trash2 } from 'lucide-react';
import { TeamMember } from '../types';

interface TeamMemberModalProps {
  member?: TeamMember;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamMemberData) => Promise<void>;
}

interface CreateTeamMemberData {
  name: string;
  email: string;
  role: string;
  skills: string[];
  isActive: boolean;
}

const PRESET_SKILLS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Git',
  'Project Management', 'UI/UX Design', 'Testing', 'DevOps',
  'Communication', 'Leadership', 'Problem Solving'
];

const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Project Manager',
  'UI/UX Designer',
  'DevOps Engineer',
  'QA Engineer',
  'Team Lead',
  'Product Manager',
  'Business Analyst'
];

export function TeamMemberModal({ member, isOpen, onClose, onSubmit }: TeamMemberModalProps) {
  const [formData, setFormData] = useState<CreateTeamMemberData>({
    name: '',
    email: '',
    role: '',
    skills: [],
    isActive: true
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        skills: [...member.skills],
        isActive: member.isActive
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: '',
        skills: [],
        isActive: true
      });
    }
    setErrors({});
    setNewSkill('');
  }, [member, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateTeamMemberData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleAddPresetSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving team member:', error);
      setErrors({ submit: 'Failed to save team member. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {member ? 'Edit Team Member' : 'Add New Team Member'}
          </h2>
          <button 
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User size={16} className="text-gray-400" />
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="Jane Smith"
                disabled={isSubmitting}
              />
              {errors.name && <span className="text-sm text-red-600">{errors.name}</span>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail size={16} className="text-gray-400" />
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="jane@company.com"
                disabled={isSubmitting}
              />
              {errors.email && <span className="text-sm text-red-600">{errors.email}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Briefcase size={16} className="text-gray-400" />
              Role *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={e => handleInputChange('role', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                errors.role 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                  : 'border-gray-200 focus:border-primary'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a role...</option>
              {COMMON_ROLES.map(role => (
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
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2"
                disabled={isSubmitting}
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-600">Quick Add:</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_SKILLS.filter(skill => !formData.skills.includes(skill)).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddPresetSkill(skill)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {formData.skills.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Selected Skills:</div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <div key={skill} className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:bg-primary/20 rounded-full p-1 transition-colors duration-200"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={12} />
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
                onChange={e => handleInputChange('isActive', e.target.checked)}
                className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary/20 focus:ring-2"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-700">Active Team Member</span>
            </label>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                member ? 'Update Member' : 'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 