import { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, UserCog, Sparkles, LogOut, Bell as BellIcon, Tag, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../App';
import CalendarView, { Appointment, toCalendarAppointment } from './CalendarView';
import PatientsView from './PatientsView';
import DoctorsView from './DoctorsView';
import ServicesView from './ServicesView';
import NotificationPanel from './NotificationPanel';
import PatientsOfDayView from './PatientsOfDayView';
import CouponsView from './CouponsView';
import MaterialsToolsView from './MaterialsToolsView';
import { appointmentService } from '../../lib/services/appointmentService';
import { formatLocalDateYYYYMMDD } from '../../lib/date';
import { useRoleNavigation, useSyncActiveTab } from '../../lib/navigation/useRoleNavigation';

type Tab = 'calendar' | 'patients' | 'doctors' | 'services' | 'coupons' | 'patients-day' | 'materials-tools';

const TAB_ICONS: Record<Tab, LucideIcon> = {
  calendar: Calendar,
  patients: Users,
  doctors: UserCog,
  services: Sparkles,
  coupons: Tag,
  'patients-day': BellIcon,
  'materials-tools': Package,
};

export default function AssistantPortal() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [showNotifications, setShowNotifications] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user, logout } = useAuth();
  const { sidebarTabs, footerTabs, isTabVisible } = useRoleNavigation('assistant');

  useSyncActiveTab(activeTab, setActiveTab, sidebarTabs);

  const loadPatientsOfDayAppointments = useCallback(() => {
    const today = new Date();
    const todayStr = formatLocalDateYYYYMMDD(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatLocalDateYYYYMMDD(tomorrow);
    Promise.all([appointmentService.byDate(todayStr), appointmentService.byDate(tomorrowStr)])
      .then(([a, b]) =>
        setAppointments([...a.map(toCalendarAppointment), ...b.map(toCalendarAppointment)]),
      )
      .catch(() => toast.error('Failed to load appointments'));
  }, []);

  useEffect(() => {
    if (activeTab === 'patients-day') {
      loadPatientsOfDayAppointments();
    }
  }, [activeTab, loadPatientsOfDayAppointments]);

  if (!user) return null;

  const showNotificationsFooter = footerTabs.some((t) => t.id === 'notifications');

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
            {sidebarTabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id as Tab] ?? Sparkles;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
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
          {showNotificationsFooter && (
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors relative"
            >
              <BellIcon className="w-5 h-5" />
              <span>Notifications</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          )}
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
        {sidebarTabs.length === 0 && (
          <p className="text-gray-500">No modules are enabled for your account. Contact a super admin.</p>
        )}

        {activeTab === 'calendar' && isTabVisible('calendar') && <CalendarView />}
        {activeTab === 'patients-day' && isTabVisible('patients-day') && (
          <PatientsOfDayView
            appointments={appointments}
            userRole="assistant"
            currentUserId={user.id}
            onAppointmentsChange={loadPatientsOfDayAppointments}
          />
        )}
        {activeTab === 'patients' && isTabVisible('patients') && <PatientsView />}
        {activeTab === 'doctors' && isTabVisible('doctors') && <DoctorsView />}
        {activeTab === 'services' && isTabVisible('services') && <ServicesView />}
        {activeTab === 'coupons' && isTabVisible('coupons') && <CouponsView />}
        {activeTab === 'materials-tools' && isTabVisible('materials-tools') && (
          <MaterialsToolsView />
        )}

        {/* Notification Panel */}
        {showNotifications && showNotificationsFooter && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </main>
    </div>
  );
}
