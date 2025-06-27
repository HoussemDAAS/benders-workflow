import React, { useState, useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CalendarView } from '../../pages/CalendarPage';
import { CalendarHeader } from './CalendarHeader';
import { EventModal } from './EventModal';
import { calendarService } from '../../services/calendarService';
import { timeEntriesService } from '../../services/timeTrackingService';
import { calendarTaskService } from '../../services/calendarTaskService';

// Import components directly to avoid module resolution issues


// FullCalendar types - define locally to avoid import issues
interface DateSelectInfo {
  start: Date;
  end: Date;
  view: {
    calendar: {
      unselect: () => void;
    };
  };
}

interface EventClickInfo {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
  };
}

interface EventChangeInfo {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
  };
}

interface DatesSetInfo {
  start: Date;
  end: Date;
}

interface Task {
  id: string;
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string | Date; // Allow both string and Date to match KanbanTask
}

interface Workflow {
  id: string;
  name: string;
  status?: string;
  description?: string;
}

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
}

interface CalendarContainerProps {
  view: CalendarView;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  workflows: Workflow[];
  clients: Client[];
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
    isLocalOnly?: boolean;
  };
}

export const CalendarContainer: React.FC<CalendarContainerProps> = ({
  view,
  selectedDate,
  onDateChange,
  tasks,
  workflows,
  clients
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const [eventModal, setEventModal] = useState<{
    isOpen: boolean;
    event?: CalendarEvent;
    selectedDate?: Date;
  }>({
    isOpen: false
  });

  // Fetch calendar events and time entries
  const fetchEvents = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setIsLoadingEvents(true);
      
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      

      
      // Fetch calendar events and time entries in parallel
      const [calendarEvents, timeEntries] = await Promise.all([
        calendarService.getEvents({ startDate: start, endDate: end }).catch(() => []),
        timeEntriesService.getTimeEntries({ start_date: start, end_date: end }).catch(() => [])
      ]);



      const allEvents: CalendarEvent[] = [];

      // Add Kanban tasks as calendar events (scheduled tasks)
      if (tasks && Array.isArray(tasks)) {
        tasks.forEach(task => {
          const isCompleted = task.status === 'done';
          const colors = getEventColors('task', isCompleted);
          
          // Show tasks with due dates or all tasks for today/this week
          const taskDate = task.dueDate ? new Date(task.dueDate) : new Date();
          
          allEvents.push({
            id: `task-${task.id}`,
            title: `📋 ${task.title}${isCompleted ? ' ✅' : ''}`,
            start: taskDate,
            end: taskDate,
            allDay: true,
            ...colors,
            className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all'],
            extendedProps: {
              type: 'task' as const,
              taskId: task.id,
              description: task.title,
              isCompleted,
              isTaskEvent: true
            }
          });
        });
      }

      // Add calendar events
      if (calendarEvents && Array.isArray(calendarEvents)) {
        calendarEvents.forEach(event => {
          // Check if this event is linked to a task
          const relatedTask = tasks.find(task => task.id === event.taskId);
          const isTaskCompleted = relatedTask?.status === 'done';
          
          // Check if the calendar event itself is completed (marked with [COMPLETED] in description or in localStorage)
          const isEventCompleted = !!(event.description && event.description.includes('[COMPLETED]')) || 
                                   calendarTaskService.isEventCompleted(event.id);
          const isCompleted = isTaskCompleted || isEventCompleted;
          
          const colors = getEventColors(event.eventType || 'task', isCompleted);
          allEvents.push({
            id: event.id,
            title: `${event.title}${isCompleted ? ' ✅' : ''}`,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            allDay: event.allDay,
            ...colors,
            className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all'],
            extendedProps: {
              type: event.eventType as 'task' | 'meeting' | 'break' | 'personal',
              taskId: event.taskId,
              description: event.description,
              isCompleted,
              isTaskEvent: !!event.taskId // True if linked to a task
            }
          });
        });
      }

      // Add time entries as events (representing actual work done)
      if (timeEntries && Array.isArray(timeEntries)) {
        timeEntries.forEach(entry => {
          const eventType = entry.isBreak ? 'break' : 'task';
          
          // Check if the task is completed
          const relatedTask = tasks.find(task => task.id === entry.taskId);
          const isCompleted = relatedTask?.status === 'done';
          
          const colors = getEventColors(eventType, isCompleted);
          const title = entry.taskTitle 
            ? `🎯 ${entry.taskTitle}${isCompleted ? ' ✅' : ''}` 
            : entry.isBreak 
              ? '☕ Break' 
              : '⚡ Work Session';
          
          allEvents.push({
            id: `time-entry-${entry.id}`,
            title,
            start: new Date(entry.startTime),
            end: new Date(entry.endTime),
            allDay: false,
            ...colors,
            className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all', 'opacity-75'],
            extendedProps: {
              type: eventType,
              taskId: entry.taskId,
              description: entry.description || `${entry.isBreak ? 'Break' : 'Work'} session`,
              isCompleted
            }
          });
        });
      }


      setEvents(allEvents);
      
    } catch (error) {
      console.error('❌ Error fetching calendar events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Fetch events when view or date changes
  useEffect(() => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    
    // Adjust date range based on view
    switch (view) {
      case 'day':
        // Keep same day for start and end
        break;
      case 'week': {
        // Get Monday of the week
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);
        endDate.setDate(diff + 6);
        break;
      }
      case 'month':
        // Get first and last day of month
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
      case 'table': {
        // Show current week
        const tableDayOfWeek = startDate.getDay();
        const tableDiff = startDate.getDate() - tableDayOfWeek + (tableDayOfWeek === 0 ? -6 : 1);
        startDate.setDate(tableDiff);
        endDate.setDate(tableDiff + 6);
        break;
      }
    }
    
    fetchEvents(startDate, endDate);
  }, [view, selectedDate, fetchEvents]);

  // Convert our view type to FullCalendar view
  const getFullCalendarView = useCallback(() => {
    switch (view) {
      case 'day': return 'timeGridDay';
      case 'week': return 'timeGridWeek';
      case 'month': return 'dayGridMonth';
      case 'table': return 'listWeek';
      default: return 'timeGridWeek';
    }
  }, [view]);

  // Update calendar view when view prop changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const newView = getFullCalendarView();
      if (calendarApi.view.type !== newView) {
        calendarApi.changeView(newView);
      }
    }
  }, [view, getFullCalendarView]);

  // Update calendar date when selectedDate prop changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentDate = calendarApi.getDate();
      if (currentDate.toDateString() !== selectedDate.toDateString()) {
        calendarApi.gotoDate(selectedDate);
      }
    }
  }, [selectedDate]);

  // Get event color based on type and completion status
  const getEventColors = (type: string, isCompleted?: boolean) => {
    if (isCompleted && type === 'task') {
      return {
        backgroundColor: '#22c55e', // green for completed tasks
        borderColor: '#22c55e',
        textColor: '#ffffff'
      };
    }
    
    switch (type) {
      case 'task':
        return {
          backgroundColor: '#3b82f6', // primary blue
          borderColor: '#3b82f6',
          textColor: '#ffffff'
        };
      case 'meeting':
        return {
          backgroundColor: '#f59e0b', // amber
          borderColor: '#f59e0b',
          textColor: '#ffffff'
        };
      case 'break':
        return {
          backgroundColor: '#ef4444', // red
          borderColor: '#ef4444',
          textColor: '#ffffff'
        };
      case 'personal':
        return {
          backgroundColor: '#8b5cf6', // purple
          borderColor: '#8b5cf6',
          textColor: '#ffffff'
        };
      default:
        return {
          backgroundColor: '#64748b', // gray
          borderColor: '#64748b',
          textColor: '#ffffff'
        };
    }
  };

  // Handle event creation
  const handleEventCreate = useCallback(async (eventData: Partial<CalendarEvent>) => {
    try {
      const createData = {
        title: eventData.title || 'New Event',
        startTime: eventData.start?.toISOString() || new Date().toISOString(),
        endTime: eventData.end?.toISOString() || new Date().toISOString(),
        allDay: eventData.allDay || false,
        taskId: eventData.extendedProps?.taskId,
        description: eventData.extendedProps?.description,
        eventType: eventData.extendedProps?.type || 'task'
      };


      
      // Save to database
      await calendarService.createEvent(createData);
      

      
      // Refresh events to show the new one
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      // Refresh current view
      fetchEvents(startDate, endDate);
      
      setEventModal({ isOpen: false });
    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      // For now, still add locally if database save fails
      const eventId = Date.now().toString();
      const isCompleted = calendarTaskService.isEventCompleted(eventId);
      const colors = getEventColors(eventData.extendedProps?.type || 'task', isCompleted);
      const newEvent: CalendarEvent = {
        id: eventId,
        title: `📅 ${eventData.title || 'New Event'}${isCompleted ? ' ✅' : ''} (Local)`,
        start: eventData.start || new Date(),
        end: eventData.end,
        allDay: eventData.allDay || false,
        ...colors,
        className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all', 'border-dashed'],
        extendedProps: {
          type: eventData.extendedProps?.type || 'task',
          description: eventData.extendedProps?.description,
          taskId: eventData.extendedProps?.taskId,
          workflowId: eventData.extendedProps?.workflowId,
          clientId: eventData.extendedProps?.clientId,
          isCompleted,
          isLocalOnly: true // Mark as local-only event
        }
      };
      
      setEvents(prev => [...prev, newEvent]);
      setEventModal({ isOpen: false });
    }
  }, [selectedDate, fetchEvents]);

  // Handle event update
  const handleEventUpdate = useCallback((eventId: string, eventData: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const colors = getEventColors(eventData.extendedProps?.type || event.extendedProps?.type || 'task');
        return { 
          ...event, 
          ...eventData,
          ...colors,
          className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all']
        };
      }
      return event;
    }));
    setEventModal({ isOpen: false });
  }, []);

  // Handle event deletion
  const handleEventDelete = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setEventModal({ isOpen: false });
  }, []);

  // Handle task completion
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      
      // Refresh events to update any task-related events
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      // Adjust date range based on current view
      switch (view) {
        case 'day':
          break;
        case 'week': {
          const dayOfWeek = startDate.getDay();
          const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate.setDate(diff);
          endDate.setDate(diff + 6);
          break;
        }
        case 'month':
          startDate.setDate(1);
          endDate.setMonth(endDate.getMonth() + 1, 0);
          break;
        case 'table': {
          const tableDayOfWeek = startDate.getDay();
          const tableDiff = startDate.getDate() - tableDayOfWeek + (tableDayOfWeek === 0 ? -6 : 1);
          startDate.setDate(tableDiff);
          endDate.setDate(tableDiff + 6);
          break;
        }
      }
      
      // Refresh events to show updated status
      await fetchEvents(startDate, endDate);
      
      // Also emit an event to refresh time stats if needed
      window.dispatchEvent(new CustomEvent('refreshTimeStats'));
      
      // Close the modal after completion
      setEventModal({ isOpen: false });
      
    } catch (error) {
      console.error('❌ Failed to refresh after task completion:', error);
    }
  }, [selectedDate, view, fetchEvents]);

  // FullCalendar event handlers with local types
  const handleDateSelect = useCallback((selectInfo: DateSelectInfo) => {
    setEventModal({
      isOpen: true,
      selectedDate: selectInfo.start
    });
    // Unselect using calendar API
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.unselect();
    }
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickInfo) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setEventModal({
        isOpen: true,
        event
      });
    }
  }, [events]);

  const handleEventDrop = useCallback((dropInfo: EventChangeInfo) => {
    const eventId = dropInfo.event.id;
    const updatedEvent = {
      start: dropInfo.event.start || new Date(),
      end: dropInfo.event.end || dropInfo.event.start || new Date()
    };
    
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updatedEvent } : event
    ));
  }, []);

  const handleEventResize = useCallback((resizeInfo: EventChangeInfo) => {
    const eventId = resizeInfo.event.id;
    const updatedEvent = {
      start: resizeInfo.event.start || new Date(),
      end: resizeInfo.event.end || resizeInfo.event.start || new Date()
    };
    
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updatedEvent } : event
    ));
  }, []);

  const handleDatesSet = useCallback((dateInfo: DatesSetInfo) => {
    onDateChange(dateInfo.start);
  }, [onDateChange]);

  return (
    <div className="h-full">
      <CalendarHeader 
        view={view}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onEventCreate={() => setEventModal({ isOpen: true, selectedDate: new Date() })}
        calendarRef={calendarRef}
      />
      
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Loading overlay */}
          {isLoadingEvents && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm font-medium">Loading events...</span>
              </div>
            </div>
          )}
          
          {/* Custom FullCalendar wrapper with Tailwind classes */}
          <div className="[&_.fc]:font-sans [&_.fc-theme-standard]:border-0 [&_.fc-scrollgrid]:border-0">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={getFullCalendarView()}
              initialDate={selectedDate}
              headerToolbar={false} // We use our custom header
              height="auto"
              events={events}
              selectable={true}
              selectMirror={true}
              editable={true}
              eventResizableFromStart={true}
              dayMaxEvents={true}
              weekends={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                startTime: '09:00',
                endTime: '18:00'
              }}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              slotDuration="01:00:00"
              allDaySlot={true}
              nowIndicator={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              datesSet={handleDatesSet}
              eventDisplay="block"
              displayEventTime={true}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }}
              slotLabelFormat={{
                hour: 'numeric',
                hour12: true
              }}
              dayHeaderFormat={{
                weekday: 'short',
                month: 'numeric',
                day: 'numeric'
              }}
              // Tailwind-based styling through class manipulation
              dayCellClassNames="hover:bg-gray-50 transition-colors"
              slotLaneClassNames="hover:bg-gray-50/50 transition-colors"
              // Responsive
              aspectRatio={1.35}
              contentHeight="calc(70vh - 100px)"
              // Custom styling for different views
              viewClassNames={view === 'table' ? 'list-view-custom' : ''}
            />
          </div>
        </div>
      </div>

      {/* Event Modal */}
              <EventModal
          isOpen={eventModal.isOpen}
          event={eventModal.event}
          selectedDate={eventModal.selectedDate}
          onClose={() => setEventModal({ isOpen: false })}
          onCreate={handleEventCreate}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
          onTaskComplete={handleTaskComplete}
          tasks={tasks}
          workflows={workflows}
          clients={clients}
        />
    </div>
  );
};