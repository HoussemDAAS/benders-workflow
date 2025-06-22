import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  Tag, 
  Workflow as WorkflowIcon,
  Save,
  Trash2,
  Plus,
  Check
} from 'lucide-react';
import { KanbanTask, TeamMember, Workflow, KanbanColumn } from '../types';

interface TaskEditModalProps {
  task: KanbanTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: KanbanTask) => void;
  onDelete?: (taskId: string) => void;
  teamMembers: TeamMember[];
  workflows: Workflow[];
  columns: KanbanColumn[];
  defaultColumnId?: string;
  defaultWorkflowId?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  workflowId: string;
  stepId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  tags: string[];
  dueDate: string;
  assignedMembers: string[];
}

export function TaskEditModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  teamMembers,
  workflows,
  columns,
  defaultColumnId,
  defaultWorkflowId
}: TaskEditModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    workflowId: '',
    stepId: '',
    priority: 'medium',
    status: 'todo',
    tags: [],
    dueDate: '',
    assignedMembers: []
  });
  
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        workflowId: task.workflowId,
        stepId: task.stepId || '',
        priority: task.priority,
        status: task.status,
        tags: task.tags || [],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedMembers: task.assignedMembers || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        workflowId: defaultWorkflowId || workflows[0]?.id || '',
        stepId: '',
        priority: 'medium',
        status: defaultColumnId || columns[0]?.id || 'todo',
        tags: [],
        dueDate: '',
        assignedMembers: []
      });
    }
    setErrors({});
  }, [task, workflows, columns, defaultColumnId, defaultWorkflowId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.workflowId) {
      newErrors.workflowId = 'Workflow is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
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

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMemberToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter(id => id !== memberId)
        : [...prev.assignedMembers, memberId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedTask: KanbanTask = {
        ...(task || {
          id: '', // Will be set by backend
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        title: formData.title,
        description: formData.description,
        workflowId: formData.workflowId,
        stepId: formData.stepId || undefined,
        priority: formData.priority,
        status: formData.status,
        tags: formData.tags,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        assignedMembers: formData.assignedMembers,
        updatedAt: new Date()
      };

      await onSave(updatedTask);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (task && onDelete && window.confirm('Are you sure you want to delete this task?')) {
      try {
        await onDelete(task.id);
        onClose();
      } catch (error) {
        console.error('Error deleting task:', error);
        setErrors({ submit: 'Failed to delete task. Please try again.' });
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const selectedWorkflow = workflows.find(w => w.id === formData.workflowId);
  const workflowSteps = selectedWorkflow?.steps || [];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-edit-form">
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                className={errors.title ? 'error' : ''}
                placeholder="Enter task title..."
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Enter task description..."
              rows={3}
            />
          </div>

          {/* Workflow & Step */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="workflow">
                <WorkflowIcon size={16} />
                Workflow *
              </label>
              <select
                id="workflow"
                value={formData.workflowId}
                onChange={e => handleInputChange('workflowId', e.target.value)}
                className={errors.workflowId ? 'error' : ''}
              >
                <option value="">Select workflow...</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
              {errors.workflowId && <span className="error-message">{errors.workflowId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="step">Workflow Step</label>
              <select
                id="step"
                value={formData.stepId}
                onChange={e => handleInputChange('stepId', e.target.value)}
                disabled={!selectedWorkflow}
              >
                <option value="">No specific step</option>
                {workflowSteps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">
                <Flag size={16} />
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={e => handleInputChange('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <div className={`priority-indicator ${getPriorityColor(formData.priority)}`} />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={e => handleInputChange('status', e.target.value)}
              >
                {columns.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="dueDate">
              <Calendar size={16} />
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={e => handleInputChange('dueDate', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>
              <Tag size={16} />
              Tags
            </label>
            <div className="tags-container">
              <div className="current-tags">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="remove-tag"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="add-tag">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Members */}
          <div className="form-group">
            <label>
              <User size={16} />
              Assigned Members
            </label>
            <div className="members-grid">
              {teamMembers.filter(member => member.isActive).map(member => (
                <div
                  key={member.id}
                  className={`member-option ${formData.assignedMembers.includes(member.id) ? 'selected' : ''}`}
                  onClick={() => handleMemberToggle(member.id)}
                >
                  <div className="member-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                  </div>
                  {formData.assignedMembers.includes(member.id) && (
                    <Check size={16} className="check-icon" />
                  )}
                </div>
              ))}
            </div>
          </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="error-banner">
                {errors.submit}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <div className="action-group">
              {task && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="delete-btn"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
            
            <div className="action-group">
              <button
                type="button"
                onClick={onClose}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="save-btn"
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 