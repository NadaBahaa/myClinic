import { useState } from 'react';
import { Calendar, Users, UserCog, Sparkles, LogOut, Bell as BellIcon, FolderOpen } from 'lucide-react';
import { useAuth } from '../App';
import CalendarView, { Appointment } from './CalendarView';
import PatientsView from './PatientsView';
import DoctorsView from './DoctorsView';
import ServicesView from './ServicesView';
import NotificationPanel from './NotificationPanel';
import PatientsOfDayView from './PatientsOfDayView';

type Tab = 'calendar' | 'patients' | 'doctors' | 'services' | 'patients-day';

// Mock appointments for all doctors
const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: 'p1',
    patientName: 'Emma Wilson',
    doctorId: '2',
    doctorName: 'Dr. Sarah Johnson',
    serviceId: 's1',
    serviceName: 'Facial Treatment',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    status: 'scheduled',
  },
  {
    id: '2',
    patientId: 'p2',
    patientName: 'Olivia Brown',
    doctorId: '3',
    doctorName: 'Dr. Michael Chen',
    serviceId: 's2',
    serviceName: 'Laser Hair Removal',
    date: new Date(),
    startTime: '10:30',
    endTime: '11:30',
    duration: 60,
    status: 'scheduled',
  },
];

export default function AssistantPortal() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [showNotifications, setShowNotifications] = useState(false);
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const { user, logout } = useAuth();

  if (!user) return null;

  const mv = user.moduleVisibility ?? {};
  const tabs = [
    { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar, show: mv.calendar !== false && user.permissions.showCalendar },
    { id: 'patients-day' as Tab, label: 'Patients of the Day', icon: BellIcon, show: mv.patients !== false && user.permissions.showPatients },
    { id: 'patients' as Tab, label: 'All Patients', icon: Users, show: mv.patients !== false && user.permissions.showPatients },
    { id: 'doctors' as Tab, label: 'Doctors', icon: UserCog, show: mv.doctors !== false && user.permissions.showDoctors },
    { id: 'services' as Tab, label: 'Services', icon: Sparkles, show: mv.services !== false && user.permissions.showServices },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-white border-b md:border-r md:border-b-0 border-gray-200 w-full md:w-64 flex-shrink-0 flex flex-col min-h-0">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-pink-600" />
            <span className="text-lg text-gray-900">BeautyClinic</span>
          </div>
          <p className="text-sm text-gray-600">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
          <div className="mt-2">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Assistant
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto min-h-0 p-4">
          <div className="space-y-1">
            {tabs.filter(tab => tab.show).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-pink-50 text-pink-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-left truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 flex-shrink-0 border-t border-gray-200 space-y-1">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors relative"
          >
            <BellIcon className="w-5 h-5" />
            <span>Notifications</span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 relative">
        {activeTab === 'calendar' && mv.calendar !== false && user.permissions.showCalendar && <CalendarView />}
        {activeTab === 'patients-day' && mv.patients !== false && user.permissions.showPatients && (
          <PatientsOfDayView
            appointments={appointments}
            userRole="assistant"
            currentUserId={user.id}
          />
        )}
        {activeTab === 'patients' && mv.patients !== false && user.permissions.showPatients && <PatientsView />}
        {activeTab === 'doctors' && mv.doctors !== false && user.permissions.showDoctors && <DoctorsView />}
        {activeTab === 'services' && mv.services !== false && user.permissions.showServices && <ServicesView />}

        {/* Notification Panel */}
        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </main>
    </div>
  );
}