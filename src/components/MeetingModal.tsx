import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, Phone, MapPin, Building, Users } from 'lucide-react';
import { Meeting, Client, TeamMember } from '../types';

interface MeetingModalProps {
  meeting?: Meeting;
  clients: Client[];
  teamMembers: TeamMember[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMeetingData) => Promise<void>;
}

interface CreateMeetingData {
  title: string;
  type: 'in-person' | 'video' | 'phone';
  scheduledDate: string;
  clientId: string;
  duration: number;
  description?: string;
  location?: string;
  attendeeIds: string[];
}

export function MeetingModal({ meeting, clients, teamMembers, isOpen, onClose, onSubmit }: MeetingModalProps) {
  const [formData, setFormData] = useState<CreateMeetingData>({
    title: '',
    type: 'video',
    scheduledDate: '',
    clientId: '',
    duration: 60,
    description: '',
    location: '',
    attendeeIds: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when meeting changes
  useEffect(() => {
    if (meeting) {
      const meetingDate = new Date(meeting.scheduledDate);
      const formattedDate = meetingDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format

      setFormData({
        title: meeting.title,
        type: meeting.type,
        scheduledDate: formattedDate,
        clientId: meeting.clientId,
        duration: meeting.duration,
        description: meeting.description || '',
        location: meeting.location || '',
        attendeeIds: meeting.attendeeIds || []
      });
    } else {
      // Set default date to next hour
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      const defaultDate = now.toISOString().slice(0, 16);

      setFormData({
        title: '',
        type: 'video',
        scheduledDate: defaultDate,
        clientId: clients[0]?.id || '',
        duration: 60,
        description: '',
        location: '',
        attendeeIds: []
      });
    }
    setErrors({});
  }, [meeting, isOpen, clients]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Meeting title is required';
    }
    
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Meeting date and time is required';
    } else {
      const meetingDate = new Date(formData.scheduledDate);
      const now = new Date();
      if (meetingDate <= now) {
        newErrors.scheduledDate = 'Meeting must be scheduled for a future date';
      }
    }
    
    if (formData.duration < 15 || formData.duration > 480) {
      newErrors.duration = 'Duration must be between 15 minutes and 8 hours';
    }
    
    if (formData.type === 'in-person' && !formData.location?.trim()) {
      newErrors.location = 'Location is required for in-person meetings';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateMeetingData, value: any) => {
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

  const handleAttendeeToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(memberId)
        ? prev.attendeeIds.filter(id => id !== memberId)
        : [...prev.attendeeIds, memberId]
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
      console.error('Error saving meeting:', error);
      setErrors({ submit: 'Failed to save meeting. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} />;
      case 'phone': return <Phone size={16} />;
      case 'in-person': return <MapPin size={16} />;
      default: return <Video size={16} />;
    }
  };

  if (!isOpen) return null;

  const selectedClient = clients.find(c => c.id === formData.clientId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{meeting ? 'Edit Meeting' : 'Schedule New Meeting'}</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">
              <Calendar size={16} />
              Meeting Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              className={errors.title ? 'error' : ''}
              placeholder="Weekly Project Review"
              disabled={isSubmitting}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="client">
                <Building size={16} />
                Client *
              </label>
              <select
                id="client"
                value={formData.clientId}
                onChange={e => handleInputChange('clientId', e.target.value)}
                className={errors.clientId ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Select a client...</option>
                {clients.filter(c => c.isActive).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company} - {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <span className="error-message">{errors.clientId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="type">
                Meeting Type *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={e => handleInputChange('type', e.target.value as 'in-person' | 'video' | 'phone')}
                disabled={isSubmitting}
              >
                <option value="video">🎥 Video Call</option>
                <option value="phone">📞 Phone Call</option>
                <option value="in-person">📍 In Person</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scheduledDate">
                <Calendar size={16} />
                Date & Time *
              </label>
              <input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={e => handleInputChange('scheduledDate', e.target.value)}
                className={errors.scheduledDate ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.scheduledDate && <span className="error-message">{errors.scheduledDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="duration">
                <Clock size={16} />
                Duration (minutes) *
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={e => handleInputChange('duration', parseInt(e.target.value))}
                className={errors.duration ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
              {errors.duration && <span className="error-message">{errors.duration}</span>}
            </div>
          </div>

          {formData.type === 'in-person' && (
            <div className="form-group">
              <label htmlFor="location">
                <MapPin size={16} />
                Location *
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                className={errors.location ? 'error' : ''}
                placeholder="123 Main St, Conference Room A"
                disabled={isSubmitting}
              />
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Meeting agenda, notes, or additional details..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>
              <Users size={16} />
              Team Attendees
            </label>
            <div className="attendees-selection">
              {teamMembers.filter(m => m.isActive).map(member => (
                <label key={member.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.attendeeIds.includes(member.id)}
                    onChange={() => handleAttendeeToggle(member.id)}
                    disabled={isSubmitting}
                  />
                  <span>{member.name} ({member.role})</span>
                </label>
              ))}
            </div>
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
              {isSubmitting ? 'Saving...' : (meeting ? 'Update Meeting' : 'Schedule Meeting')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 