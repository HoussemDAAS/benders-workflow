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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {meeting ? 'Edit Meeting' : 'Schedule New Meeting'}
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

          <div className="space-y-2">
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar size={16} className="text-gray-400" />
              Meeting Title *
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
              placeholder="Weekly Project Review"
              disabled={isSubmitting}
            />
            {errors.title && <span className="text-sm text-red-600">{errors.title}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="client" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building size={16} className="text-gray-400" />
                Client *
              </label>
              <select
                id="client"
                value={formData.clientId}
                onChange={e => handleInputChange('clientId', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.clientId 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.company})
                  </option>
                ))}
              </select>
              {errors.clientId && <span className="text-sm text-red-600">{errors.clientId}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Meeting Type</label>
              <div className="flex gap-2">
                {(['video', 'phone', 'in-person'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('type', type)}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                      formData.type === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    disabled={isSubmitting}
                  >
                    {getMeetingTypeIcon(type)}
                    <span className="capitalize">{type === 'in-person' ? 'In Person' : type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="scheduledDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock size={16} className="text-gray-400" />
                Date & Time *
              </label>
              <input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={e => handleInputChange('scheduledDate', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.scheduledDate 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                disabled={isSubmitting}
              />
              {errors.scheduledDate && <span className="text-sm text-red-600">{errors.scheduledDate}</span>}
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock size={16} className="text-gray-400" />
                Duration (minutes) *
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={e => handleInputChange('duration', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.duration 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                disabled={isSubmitting}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
              {errors.duration && <span className="text-sm text-red-600">{errors.duration}</span>}
            </div>
          </div>

          {formData.type === 'in-person' && (
            <div className="space-y-2">
              <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin size={16} className="text-gray-400" />
                Location *
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.location 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="123 Business St, Suite 100"
                disabled={isSubmitting}
              />
              {errors.location && <span className="text-sm text-red-600">{errors.location}</span>}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              placeholder="Meeting agenda and notes..."
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users size={16} className="text-gray-400" />
              Attendees
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
              {teamMembers.map(member => (
                <label key={member.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.attendeeIds.includes(member.id)}
                    onChange={() => handleAttendeeToggle(member.id)}
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
                meeting ? 'Update Meeting' : 'Schedule Meeting'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 