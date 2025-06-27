import React, { useState, useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CalendarView } from '../../pages/CalendarPage';
import { CalendarHeader } from './CalendarHeader';
import { EventModal } from './EventModal';

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
  const [events, setEvents] = useState<CalendarEvent[]>([
    // Sample events with your design system colors
    {
      id: '1',
      title: 'Team Meeting',
      start: new Date(2025, 5, 27, 10, 0),
      end: new Date(2025, 5, 27, 11, 0),
      backgroundColor: '#f59e0b',
      borderColor: '#f59e0b',
      textColor: '#ffffff',
      className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all'],
      extendedProps: {
        type: 'meeting',
        description: 'Weekly team standup meeting'
      }
    },
    {
      id: '2',
      title: 'Development Work',
      start: new Date(2025, 5, 27, 14, 0),
      end: new Date(2025, 5, 27, 17, 0),
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      textColor: '#ffffff',
      className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all'],
      extendedProps: {
        type: 'task',
        taskId: 'task-1',
        description: 'Working on calendar integration'
      }
    },
    {
      id: '3',
      title: 'Client Call',
      start: new Date(2025, 5, 28, 15, 30),
      end: new Date(2025, 5, 28, 16, 30),
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      textColor: '#ffffff',
      className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all'],
      extendedProps: {
        type: 'meeting',
        clientId: 'client-1',
        description: 'Project review with client'
      }
    }
  ]);

  const [eventModal, setEventModal] = useState<{
    isOpen: boolean;
    event?: CalendarEvent;
    selectedDate?: Date;
  }>({
    isOpen: false
  });

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

  // Get event color based on type
  const getEventColors = (type: string) => {
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
  const handleEventCreate = useCallback((eventData: Partial<CalendarEvent>) => {
    const colors = getEventColors(eventData.extendedProps?.type || 'task');
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: eventData.title || 'New Event',
      start: eventData.start || new Date(),
      end: eventData.end,
      allDay: eventData.allDay || false,
      ...colors,
      className: ['font-medium', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 'transition-all'],
      extendedProps: {
        type: eventData.extendedProps?.type || 'task',
        description: eventData.extendedProps?.description,
        taskId: eventData.extendedProps?.taskId,
        workflowId: eventData.extendedProps?.workflowId,
        clientId: eventData.extendedProps?.clientId
      }
    };
    
    setEvents(prev => [...prev, newEvent]);
    setEventModal({ isOpen: false });
  }, []);

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
        tasks={tasks}
        workflows={workflows}
        clients={clients}
      />
    </div>
  );
};