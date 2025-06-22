import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Video,
  Phone,
  MapPin,
  Plus,
  Edit,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { meetingService, Meeting } from '../services';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface MeetingViewProps {
  meetings: Meeting[];
  clients: Client[];
  teamMembers: TeamMember[];
  onMeetingCreate: () => void;
  onMeetingEdit: (meeting: Meeting) => void;
  onMeetingDelete: (meetingId: string) => void;
  onMeetingStatusChange: (meetingId: string, status: string) => void;
}

export function MeetingView({ 
  meetings, 
  clients, 
  teamMembers, 
  onMeetingCreate, 
  onMeetingEdit, 
  onMeetingDelete, 
  onMeetingStatusChange 
}: MeetingViewProps) {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'cancelled': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-blue-500" />;
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

  const filteredMeetings = meetings.filter(meeting => {
    const matchesClient = selectedClient === 'all' || meeting.clientId === selectedClient;
    const matchesStatus = selectedStatus === 'all' || meeting.status === selectedStatus;
    const matchesSearch = !searchTerm || 
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clients.find(c => c.id === meeting.clientId)?.company.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesClient && matchesStatus && matchesSearch;
  });

  const upcomingMeetings = filteredMeetings.filter(meeting => 
    new Date(meeting.scheduledDate) > new Date() && meeting.status === 'scheduled'
  );

  return (
    <div className="meetings-view">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Calendar size={24} />
            Meetings
          </h1>
          <p>Schedule and manage client meetings</p>
        </div>
        <button className="btn-primary" onClick={onMeetingCreate}>
          <Plus size={20} />
          Schedule Meeting
        </button>
      </div>

      <div className="page-controls">
        <div className="search-bar">
          <Calendar size={20} />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Upcoming meetings summary */}
      {upcomingMeetings.length > 0 && (
        <div className="upcoming-meetings">
          <h3>Upcoming Meetings ({upcomingMeetings.length})</h3>
          <div className="upcoming-list">
            {upcomingMeetings.slice(0, 3).map(meeting => {
              const client = clients.find(c => c.id === meeting.clientId);
              const isToday = new Date(meeting.scheduledDate).toDateString() === new Date().toDateString();
              
              return (
                <div key={meeting.id} className={`upcoming-item ${isToday ? 'today' : ''}`}>
                  <div className="meeting-time">
                    <Clock size={14} />
                    {new Date(meeting.scheduledDate).toLocaleString()}
                  </div>
                  <div className="meeting-details">
                    <h4>{meeting.title}</h4>
                    <p>{client?.company} - {client?.name}</p>
                  </div>
                  <div className="meeting-type">
                    {getMeetingTypeIcon(meeting.type)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="meetings-content">
        {filteredMeetings.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No meetings found</h3>
            <p>Schedule your first client meeting to get started.</p>
            <button className="btn-primary" onClick={onMeetingCreate}>
              <Plus size={20} />
              Schedule First Meeting
            </button>
          </div>
        ) : (
          <div className="meetings-grid">
            {filteredMeetings.map(meeting => {
              const client = clients.find(c => c.id === meeting.clientId);
              const meetingDate = new Date(meeting.scheduledDate);
              const isToday = meetingDate.toDateString() === new Date().toDateString();

              return (
                <div key={meeting.id} className={`meeting-card ${meeting.status} ${isToday ? 'today' : ''}`}>
                  <div className="meeting-header">
                    <div className="meeting-status">
                      {getStatusIcon(meeting.status)}
                      <span className="status-text">{meeting.status}</span>
                    </div>
                    <div className="meeting-actions">
                      <button className="action-btn">
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="meeting-body">
                    <h3>{meeting.title}</h3>
                    {meeting.description && (
                      <p className="meeting-description">{meeting.description}</p>
                    )}
                    
                    <div className="meeting-info">
                      <div className="info-item">
                        <Building size={14} />
                        <span>{client?.company} - {client?.name}</span>
                      </div>
                      
                      <div className="info-item">
                        <Calendar size={14} />
                        <span>{meetingDate.toLocaleDateString()}</span>
                      </div>
                      
                      <div className="info-item">
                        <Clock size={14} />
                        <span>{meetingDate.toLocaleTimeString()} ({meeting.duration}m)</span>
                      </div>
                      
                      <div className="info-item">
                        {getMeetingTypeIcon(meeting.type)}
                        <span>{meeting.type}</span>
                      </div>
                      
                      {meeting.location && (
                        <div className="info-item">
                          <MapPin size={14} />
                          <span>{meeting.location}</span>
                        </div>
                      )}
                    </div>

                    {meeting.attendeeIds && meeting.attendeeIds.length > 0 && (
                      <div className="meeting-attendees">
                        <Users size={14} />
                        <span>{meeting.attendeeIds.length} attendees</span>
                      </div>
                    )}

                    {meeting.notes && (
                      <div className="meeting-notes">
                        <h5>Notes:</h5>
                        <p>{meeting.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 