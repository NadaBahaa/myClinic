import { useDrag, useDrop } from 'react-dnd';
import { Clock, Trash2, Edit } from 'lucide-react';
import type { Appointment } from './CalendarView';

interface DailyCalendarProps {
  date: Date;
  appointments: Appointment[];
  onAppointmentUpdate: (appointment: Appointment) => void;
  onAppointmentDelete: (id: string) => void;
  onAppointmentEdit: (appointment: Appointment) => void;
}

const ITEM_TYPE = 'APPOINTMENT';

const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8; // 8 AM to 8 PM
  return `${hour.toString().padStart(2, '0')}:00`;
});

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}

function AppointmentCard({ appointment, onEdit, onDelete }: AppointmentCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: appointment,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const statusColors = {
    scheduled: 'bg-blue-100 border-blue-300 text-blue-900',
    completed: 'bg-green-100 border-green-300 text-green-900',
    cancelled: 'bg-gray-100 border-gray-300 text-gray-900',
  };

  return (
    <div
      ref={drag}
      className={`p-3 rounded-lg border-2 mb-2 cursor-move ${statusColors[appointment.status]} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{appointment.patientName}</p>
          <p className="text-sm truncate">{appointment.serviceName}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 hover:bg-white/50 rounded"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-white/50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <Clock className="w-3 h-3" />
        <span>{appointment.startTime} - {appointment.endTime}</span>
      </div>
      <p className="text-sm mt-1">{appointment.doctorName}</p>
    </div>
  );
}

interface TimeSlotProps {
  time: string;
  appointments: Appointment[];
  onDrop: (appointment: Appointment, newTime: string) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

function TimeSlot({ time, appointments, onDrop, onEdit, onDelete }: TimeSlotProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: Appointment) => onDrop(item, time),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`border-b border-gray-200 min-h-[80px] p-2 transition-colors ${
        isOver ? 'bg-pink-50' : ''
      }`}
    >
      <div className="text-sm text-gray-500 mb-2">{time}</div>
      {appointments.map((apt) => (
        <AppointmentCard
          key={apt.id}
          appointment={apt}
          onEdit={() => onEdit(apt)}
          onDelete={() => onDelete(apt.id)}
        />
      ))}
    </div>
  );
}

export default function DailyCalendar({
  date,
  appointments,
  onAppointmentUpdate,
  onAppointmentDelete,
  onAppointmentEdit,
}: DailyCalendarProps) {
  const dailyAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return (
      aptDate.getDate() === date.getDate() &&
      aptDate.getMonth() === date.getMonth() &&
      aptDate.getFullYear() === date.getFullYear()
    );
  });

  const handleDrop = (appointment: Appointment, newTime: string) => {
    const [hours, minutes] = newTime.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours), parseInt(minutes));

    const endTime = new Date(newDate);
    endTime.setMinutes(endTime.getMinutes() + appointment.duration);

    const updatedAppointment: Appointment = {
      ...appointment,
      date: newDate,
      startTime: newTime,
      endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
    };

    onAppointmentUpdate(updatedAppointment);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[300px]">
        {timeSlots.map((time) => {
          const slotHour = time.slice(0, 2);
          const slotAppointments = dailyAppointments.filter(
            (apt) => apt.startTime === time || apt.startTime.startsWith(slotHour + ':')
          );
          return (
            <TimeSlot
              key={time}
              time={time}
              appointments={slotAppointments}
              onDrop={handleDrop}
              onEdit={onAppointmentEdit}
              onDelete={onAppointmentDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
