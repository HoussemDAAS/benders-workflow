import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Plus,
} from 'lucide-react';
import { CalendarView } from '../../pages/CalendarPage';

interface CalendarHeaderProps {
  view: CalendarView;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventCreate: () => void;
  calendarRef: React.RefObject<any>;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  selectedDate,
  onDateChange,
  onEventCreate,
  calendarRef
}) => {
  const formatDateTitle = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentDate = calendarApi.getDate();
      
      switch (view) {
        case 'day':
          return currentDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'week':
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          
          if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
          } else {
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endOfWeek.getFullYear()}`;
          }
        case 'month':
          return currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });
        case 'table':
          return 'Time Entries';
        default:
          return currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });
      }
    }
    
    // Fallback to selectedDate if calendar API not available
    return selectedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      if (direction === 'next') {
        calendarApi.next();
      } else {
        calendarApi.prev();
      }
      
      // Update the selected date in parent component
      onDateChange(calendarApi.getDate());
    }
  };

  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      onDateChange(new Date());
    }
  };

  const changeView = (newView: CalendarView) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const fullCalendarView = {
        day: 'timeGridDay',
        week: 'timeGridWeek',
        month: 'dayGridMonth',
        table: 'listWeek'
      }[newView];
      
      calendarApi.changeView(fullCalendarView);
    }
  };

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* Fixed spacing and responsive layout */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left side - Calendar title and navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {formatDateTitle()}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {view === 'table' ? 'Detailed time tracking view' : 'Navigate through your schedule'}
                </p>
              </div>
            </div>
            
            {/* Navigation controls - Better spacing */}
            {view !== 'table' && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                <button
                  onClick={() => navigateCalendar('prev')}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
                  aria-label="Previous period"
                >
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateCalendar('next')}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
                  aria-label="Next period"
                >
                  <ChevronRight size={18} className="text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center justify-center sm:justify-end gap-3">
            <button
              onClick={onEventCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Event</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};