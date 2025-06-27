/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2,
  Plus
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  [key: string]: any;
}

interface Workflow {
  id: string;
  name: string;
  [key: string]: any;
}

interface Client {
  id: string;
  name: string;
  [key: string]: any;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  className?: string[];
  extendedProps?: {
    type: 'task' | 'meeting' | 'break' | 'personal';
    taskId?: string;
    workflowId?: string;
    clientId?: string;
    description?: string;
  };
}

interface EventModalProps {
  isOpen: boolean;
  event?: CalendarEvent;
  selectedDate?: Date;
  onClose: () => void;
  onCreate: (eventData: Partial<CalendarEvent>) => void;
  onUpdate: (eventId: string, eventData: Partial<CalendarEvent>) => void;
  onDelete: (eventId: string) => void;
  tasks: Task[];
  workflows: Workflow[];
  clients: Client[];
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  selectedDate,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  tasks
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as 'task' | 'meeting' | 'break' | 'personal',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    taskId: ''
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode
        const startDate = new Date(event.start);
        const endDate = event.end ? new Date(event.end) : startDate;
        
        setFormData({
          title: event.title,
          description: event.extendedProps?.description || '',
          type: event.extendedProps?.type || 'task',
          startDate: startDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endDate: endDate.toISOString().split('T')[0],
          endTime: endDate.toTimeString().slice(0, 5),
          allDay: event.allDay || false,
          taskId: event.extendedProps?.taskId || ''
        });
      } else if (selectedDate) {
        // Create mode
        const date = selectedDate.toISOString().split('T')[0];
        const time = selectedDate.toTimeString().slice(0, 5);
        
        setFormData({
          title: '',
          description: '',
          type: 'task',
          startDate: date,
          startTime: time,
          endDate: date,
          endTime: time,
          allDay: false,
          taskId: ''
        });
      }
    }
  }, [isOpen, event, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = formData.allDay 
      ? new Date(formData.startDate)
      : new Date(`${formData.startDate}T${formData.startTime}`);
    
    const endDateTime = formData.allDay
      ? new Date(formData.endDate)
      : new Date(`${formData.endDate}T${formData.endTime}`);

    const eventData: Partial<CalendarEvent> = {
      title: formData.title,
      start: startDateTime,
      end: endDateTime,
      allDay: formData.allDay,
      extendedProps: {
        type: formData.type,
        description: formData.description,
        taskId: formData.taskId || undefined
      }
    };

    if (event) {
      onUpdate(event.id, eventData);
    } else {
      onCreate(eventData);
    }
  };

  const handleDelete = () => {
    if (event && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Enter event title..."
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              <option value="task">Work Task</option>
              <option value="meeting">Meeting</option>
              <option value="break">Break</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          {/* Link to Task */}
          {tasks.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Link to Task (Optional)
              </label>
              <select
                value={formData.taskId}
                onChange={(e) => setFormData(prev => ({ ...prev, taskId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="">Select a task...</option>
                {tasks.slice(0, 10).map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* All Day Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
              All day event
            </label>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
              />
            </div>
          </div>

          {!formData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
              rows={3}
              placeholder="Add event details..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {event && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-lg"
              >
                {event ? <Save size={16} /> : <Plus size={16} />}
                {event ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};