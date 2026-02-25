import type { Appointment } from './CalendarView';

interface MonthlyCalendarProps {
  date: Date;
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
}

export default function MonthlyCalendar({ date, appointments, onDateSelect }: MonthlyCalendarProps) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return (
        aptDate.getDate() === day &&
        aptDate.getMonth() === month &&
        aptDate.getFullYear() === year
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="bg-gray-50 rounded-lg" />;
          }

          const dayAppointments = getAppointmentsForDay(day);
          const hasAppointments = dayAppointments.length > 0;

          return (
            <button
              key={day}
              onClick={() => onDateSelect(new Date(year, month, day))}
              className={`p-2 rounded-lg border transition-all hover:shadow-md ${
                isToday(day)
                  ? 'bg-pink-100 border-pink-300'
                  : 'bg-white border-gray-200 hover:border-pink-300'
              }`}
            >
              <div className="flex flex-col h-full">
                <span
                  className={`text-sm ${
                    isToday(day) ? 'font-semibold text-pink-700' : 'text-gray-700'
                  }`}
                >
                  {day}
                </span>
                {hasAppointments && (
                  <div className="mt-1 flex-1 flex flex-col gap-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-xs bg-blue-100 text-blue-900 rounded px-1 py-0.5 truncate"
                        title={`${apt.patientName} - ${apt.serviceName}`}
                      >
                        {apt.startTime} {apt.patientName}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-600">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
