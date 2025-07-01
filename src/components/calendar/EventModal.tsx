/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2,
  Plus,
  CheckCircle
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { calendarTaskService } from '../../services/calendarTaskService';
import { ApiError } from '../../services/api';

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
    isCompleted?: boolean;
    isTaskEvent?: boolean;
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
  onTaskComplete?: (taskId: string) => void;
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
  onTaskComplete,
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

  const handleMarkAsDone = async () => {
    if (event && onTaskComplete) {
      try {
        if (event.extendedProps?.taskId) {
          // If linked to a kanban task, mark that as done
          await taskService.move(event.extendedProps.taskId, 'done');
        } else {
          // If it's a standalone calendar event, mark it as completed
          await calendarTaskService.markAsCompleted(event.id);
        }
        
        // Always trigger completion callback to refresh the UI
        onTaskComplete(event.id);
        
        // Close the modal
        onClose();
      } catch (error) {
        console.error('Failed to mark task as done:', error);
        // For local events that fail server update, still mark locally
        if (error instanceof ApiError && error.status === 404) {
          // The local completion was already handled in calendarTaskService
          // Still trigger UI refresh
          onTaskComplete(event.id);
          onClose();
        }
        // Could add error notification here for other errors
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {event ? 'Update event details' : 'Add a new event to your calendar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter event title..."
                required
              />
            </div>

            {/* Event Type and Task Link Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="task">Work Task</option>
                  <option value="meeting">Meeting</option>
                  <option value="break">Break</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              {/* Link to Task */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link to Task (Optional)
                </label>
                {tasks.length > 0 ? (
                  <select
                    value={formData.taskId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taskId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">None</option>
                    {tasks.slice(0, 10).map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
                    No tasks available
                  </div>
                )}
              </div>
            </div>

            {/* Task Event Info */}
            {formData.type === 'task' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 <strong>Task events</strong> can be marked as completed and will count towards your daily productivity metrics.
                </p>
              </div>
            )}

            {/* All Day Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                All day event
              </label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
                {!formData.allDay && (
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors mt-2"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
                {!formData.allDay && (
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors mt-2"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                rows={3}
                placeholder="Add event details..."
              />
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0 gap-4 sm:gap-0">
          {/* Left Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {event && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-red-200 hover:border-red-300"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
            {event && formData.type === 'task' && (
              event?.extendedProps?.isCompleted ? (
                <div className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 text-green-600 bg-green-50 rounded-lg font-medium border border-green-200">
                  <CheckCircle size={16} />
                  Completed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkAsDone}
                  className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors border border-green-200 hover:border-green-300"
                >
                  <CheckCircle size={16} />
                  Mark Done
                </button>
              )
            )}
          </div>
          
          {/* Right Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-first sm:order-last">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors border border-gray-200 hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              {event ? <Save size={16} /> : <Plus size={16} />}
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};