import { useState } from 'react';
import { Calendar, Users, UserCog, Sparkles, LogOut, Settings, Bell, Shield, Briefcase, Package, History, BarChart3, Tag } from 'lucide-react';
import { useAuth } from '../App';
import CalendarView from './CalendarView';
import PatientsView from './PatientsView';
import DoctorsView from './DoctorsView';
import ServicesView from './ServicesView';
import SettingsView from './SettingsView';
import UsersView from './UsersView';
import NotificationPanel from './NotificationPanel';
import PractitionerTypesView from './PractitionerTypesView';
import MaterialsToolsView from './MaterialsToolsView';
import BacklogView from './BacklogView';
import AccountantDashboard from './AccountantDashboard';
import CouponsView from './CouponsView';
import AdminNotificationsView from './AdminNotificationsView';

type Tab = 'calendar' | 'patients' | 'doctors' | 'services' | 'coupons' | 'users' | 'settings' | 'practitioner-types' | 'materials-tools' | 'backlog' | 'reports' | 'notifications';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout, updateAllUsers } = useAuth();

  if (!user) return null;

  const mv = user.moduleVisibility ?? {};
  const tabs = [
    { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar, moduleKey: 'calendar', show: mv.calendar !== false && user.permissions.showCalendar },
    { id: 'patients' as Tab, label: 'Patients', icon: Users, moduleKey: 'patients', show: mv.patients !== false && user.permissions.showPatients },
    { id: 'doctors' as Tab, label: 'Doctors', icon: UserCog, moduleKey: 'doctors', show: mv.doctors !== false && user.permissions.showDoctors },
    { id: 'services' as Tab, label: 'Services', icon: Sparkles, moduleKey: 'services', show: mv.services !== false && user.permissions.showServices },
    { id: 'coupons' as Tab, label: 'Coupons', icon: Tag, moduleKey: 'services', show: mv.services !== false && user.permissions.showServices },
    { id: 'materials-tools' as Tab, label: 'Materials & Tools', icon: Package, moduleKey: 'materials_tools', show: mv.materials_tools !== false && user.permissions.showMaterialsTools },
    { id: 'practitioner-types' as Tab, label: 'Practitioner Types', icon: Briefcase, moduleKey: 'practitioner_types', show: mv.practitioner_types !== false && user.permissions.showPractitionerTypes },
    { id: 'users' as Tab, label: 'Users', icon: Shield, moduleKey: 'users', show: mv.users !== false && user.permissions.showUsers },
    { id: 'backlog' as Tab, label: 'Activity Log', icon: History, moduleKey: 'activity_log', show: mv.activity_log !== false && user.permissions.showActivityLog },
    { id: 'reports' as Tab, label: 'Sales & Export', icon: BarChart3, moduleKey: 'reports', show: mv.reports !== false && user.permissions.showReports },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell, moduleKey: 'notifications', show: true },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings, moduleKey: 'settings', show: mv.settings !== false && user.permissions.showSettings },
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
            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              Admin
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

        <div className="p-4 flex-shrink-0 border-t border-gray-200">
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
      <main className="flex-1 p-4 md:p-8 relative" data-testid="admin-dashboard">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Admin Dashboard</h1>
        {/* Notification Bell - Fixed Position */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="fixed top-4 right-4 md:top-8 md:right-8 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-40 border border-gray-200"
        >
          <Bell className="w-5 h-5 text-gray-700" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {activeTab === 'calendar' && mv.calendar !== false && user.permissions.showCalendar && <CalendarView />}
        {activeTab === 'patients' && mv.patients !== false && user.permissions.showPatients && <PatientsView />}
        {activeTab === 'doctors' && mv.doctors !== false && user.permissions.showDoctors && <DoctorsView />}
        {activeTab === 'services' && mv.services !== false && user.permissions.showServices && <ServicesView />}
        {activeTab === 'coupons' && mv.services !== false && user.permissions.showServices && <CouponsView />}
        {activeTab === 'materials-tools' && mv.materials_tools !== false && user.permissions.showMaterialsTools && <MaterialsToolsView />}
        {activeTab === 'practitioner-types' && mv.practitioner_types !== false && user.permissions.showPractitionerTypes && <PractitionerTypesView />}
        {activeTab === 'users' && mv.users !== false && user.permissions.showUsers && <UsersView onUsersUpdate={updateAllUsers} />}
        {activeTab === 'backlog' && mv.activity_log !== false && user.permissions.showActivityLog && <BacklogView />}
        {activeTab === 'reports' && mv.reports !== false && user.permissions.showReports && <AccountantDashboard embedded />}
        {activeTab === 'notifications' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Notifications</h2>
            <p className="text-sm text-gray-500 mb-6">View per-patient notification counts, sent messages, and send reminders to upcoming appointments.</p>
            <AdminNotificationsView />
          </div>
        )}
        {activeTab === 'settings' && mv.settings !== false && user.permissions.showSettings && <SettingsView />}

        {/* Notification Panel */}
        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </main>
    </div>
  );
}