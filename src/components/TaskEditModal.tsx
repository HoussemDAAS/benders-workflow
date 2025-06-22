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
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const selectedWorkflow = workflows.find(w => w.id === formData.workflowId);
  const availableSteps = selectedWorkflow?.steps || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <div className="flex gap-2">
            {task && onDelete && (
              <button 
                onClick={handleDelete}
                className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                title="Delete Task"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Task Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                errors.title 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                  : 'border-gray-200 focus:border-primary'
              }`}
              placeholder="Enter task title..."
              disabled={isSubmitting}
            />
            {errors.title && <span className="text-sm text-red-600">{errors.title}</span>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              placeholder="Task description and details..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="workflow" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <WorkflowIcon size={16} className="text-gray-400" />
                Workflow *
              </label>
              <select
                id="workflow"
                value={formData.workflowId}
                onChange={e => handleInputChange('workflowId', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.workflowId 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select a workflow...</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
              {errors.workflowId && <span className="text-sm text-red-600">{errors.workflowId}</span>}
            </div>

            <div className="space-y-2">
              <label htmlFor="step" className="text-sm font-medium text-gray-700">
                Workflow Step
              </label>
              <select
                id="step"
                value={formData.stepId}
                onChange={e => handleInputChange('stepId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                disabled={isSubmitting || !selectedWorkflow}
              >
                <option value="">Select a step...</option>
                {availableSteps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Flag size={16} className="text-gray-400" />
                Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map(priority => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handleInputChange('priority', priority)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      formData.priority === priority
                        ? getPriorityColor(priority)
                        : 'border border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    disabled={isSubmitting}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={e => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                disabled={isSubmitting}
              >
                {columns.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="dueDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar size={16} className="text-gray-400" />
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={e => handleInputChange('dueDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Tag size={16} className="text-gray-400" />
              Tags
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2"
                disabled={isSubmitting}
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-primary/20 rounded-full p-1 transition-colors duration-200"
                      disabled={isSubmitting}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User size={16} className="text-gray-400" />
              Assigned Members
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
              {teamMembers.filter(m => m.isActive).map(member => (
                <label key={member.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedMembers.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary/20 focus:ring-2"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">{member.name}</span>
                  <span className="text-xs text-gray-500">({member.role})</span>
                </label>
              ))}
            </div>
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
                <>
                  <Save size={16} />
                  {task ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 