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
  AlertCircle,
  Search
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
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-blue-600" />;
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-purple-600" />;
      case 'phone': return <Phone size={16} className="text-green-600" />;
      case 'in-person': return <MapPin size={16} className="text-blue-600" />;
      default: return <Video size={16} className="text-purple-600" />;
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

  const totalMeetings = meetings.length;
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white pt-16 lg:pt-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-white">Meetings</h1>
              </div>
              <p className="text-lg text-white/90 font-medium mb-4">
                Schedule and manage client meetings
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/80">{totalMeetings} Total Meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/80">{scheduledMeetings} Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/80">{completedMeetings} Completed</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onMeetingCreate}
              className="flex items-center gap-2 px-6 py-3 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-semibold transition-all duration-200 shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 -mt-6 mb-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 flex-1 lg:flex-none lg:min-w-[200px]"
            >
              <option value="all" className="text-gray-900">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id} className="text-gray-900">
                  {client.company}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 flex-1 lg:flex-none lg:min-w-[150px]"
            >
              <option value="all" className="text-gray-900">All Status</option>
              <option value="scheduled" className="text-gray-900">Scheduled</option>
              <option value="completed" className="text-gray-900">Completed</option>
              <option value="cancelled" className="text-gray-900">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Upcoming meetings summary */}
        {upcomingMeetings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Meetings ({upcomingMeetings.length})
            </h3>
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 3).map(meeting => {
                const client = clients.find(c => c.id === meeting.clientId);
                const isToday = new Date(meeting.scheduledDate).toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={meeting.id} 
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                      isToday 
                        ? 'bg-blue-50 border-2 border-blue-200 ring-2 ring-blue-100' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(meeting.scheduledDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{meeting.title}</h4>
                      <p className="text-sm text-gray-600 truncate">
                        {client?.company} - {client?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getMeetingTypeIcon(meeting.type)}
                      {isToday && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Meetings Content */}
        {filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Schedule your first client meeting to get started.</p>
            <button 
              className="btn-primary"
              onClick={onMeetingCreate}
            >
              <Plus className="w-5 h-5" />
              Schedule First Meeting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMeetings.map(meeting => {
              const client = clients.find(c => c.id === meeting.clientId);
              const meetingDate = new Date(meeting.scheduledDate);
              const isToday = meetingDate.toDateString() === new Date().toDateString();

              return (
                <div 
                  key={meeting.id} 
                  className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border ${
                    meeting.status === 'completed' ? 'border-green-200 bg-green-50/50' :
                    meeting.status === 'cancelled' ? 'border-red-200 bg-red-50/50' :
                    isToday ? 'border-blue-200 bg-blue-50/50 ring-2 ring-blue-100' :
                    'border-gray-100'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(meeting.status)}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        meeting.status === 'completed' ? 'status-completed' :
                        meeting.status === 'cancelled' ? 'status-inactive' :
                        'status-active'
                      }`}>
                        {meeting.status}
                      </span>
                      {isToday && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <button 
                      className="w-8 h-8 bg-gray-100 hover:bg-primary hover:text-white rounded-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                      onClick={() => onMeetingEdit(meeting)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meeting Details */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300">
                      {meeting.title}
                    </h3>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{meeting.description}</p>
                    )}
                  </div>

                  {/* Client Info */}
                  {client && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{client.company}</div>
                        <div className="text-xs text-gray-600 truncate">{client.name}</div>
                      </div>
                    </div>
                  )}

                  {/* Meeting Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{meetingDate.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getMeetingTypeIcon(meeting.type)}
                      <span className="capitalize">{meeting.type}</span>
                    </div>
                    {meeting.duration && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{meeting.duration} minutes</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {meeting.attendeeIds?.length || 0} attendees
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn-outline text-xs px-3 py-1"
                        onClick={() => onMeetingEdit(meeting)}
                      >
                        Edit
                      </button>
                      <select
                        value={meeting.status}
                        onChange={(e) => onMeetingStatusChange(meeting.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="scheduled" className="text-gray-900">Scheduled</option>
                        <option value="completed" className="text-gray-900">Completed</option>
                        <option value="cancelled" className="text-gray-900">Cancelled</option>
                      </select>
                    </div>
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