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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{member ? 'Edit Team Member' : 'Add New Team Member'}</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                <User size={16} />
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={errors.name ? 'error' : ''}
                placeholder="Jane Smith"
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} />
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                placeholder="jane@company.com"
                disabled={isSubmitting}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="role">
              <Briefcase size={16} />
              Role *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={e => handleInputChange('role', e.target.value)}
              className={errors.role ? 'error' : ''}
              disabled={isSubmitting}
            >
              <option value="">Select a role...</option>
              {COMMON_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && <span className="error-message">{errors.role}</span>}
          </div>
          
          <div className="form-group">
            <label>Skills</label>
            <div className="skills-input">
              <div className="skill-adder">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddSkill}
                  disabled={isSubmitting}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              
              <div className="skill-presets">
                <p>Common Skills:</p>
                <div className="preset-skills">
                  {PRESET_SKILLS.filter(skill => !formData.skills.includes(skill)).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      className="skill-preset"
                      onClick={() => handleAddPresetSkill(skill)}
                      disabled={isSubmitting}
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
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      disabled={isSubmitting}
                    >
                      <Trash2 size={12} />
                    </button>
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
                onChange={e => handleInputChange('isActive', e.target.checked)}
                disabled={isSubmitting}
              />
              Active Team Member
            </label>
          </div>
          
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (member ? 'Update Member' : 'Add Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 