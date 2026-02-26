import { useState } from 'react';
import { Calendar, Users, UserCog, Sparkles, LogOut, Settings, Bell, Shield, Briefcase, Package, History, BarChart3 } from 'lucide-react';
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

type Tab = 'calendar' | 'patients' | 'doctors' | 'services' | 'users' | 'settings' | 'practitioner-types' | 'materials-tools' | 'backlog' | 'reports';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout, updateAllUsers } = useAuth();

  if (!user) return null;

  const tabs = [
    { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar, show: user.permissions.showCalendar },
    { id: 'patients' as Tab, label: 'Patients', icon: Users, show: user.permissions.showPatients },
    { id: 'doctors' as Tab, label: 'Doctors', icon: UserCog, show: user.permissions.showDoctors },
    { id: 'services' as Tab, label: 'Services', icon: Sparkles, show: user.permissions.showServices },
    { id: 'materials-tools' as Tab, label: 'Materials & Tools', icon: Package, show: user.role === 'admin' },
    { id: 'practitioner-types' as Tab, label: 'Practitioner Types', icon: Briefcase, show: user.role === 'admin' },
    { id: 'users' as Tab, label: 'Users', icon: Shield, show: user.permissions.showUsers },
    { id: 'backlog' as Tab, label: 'Activity Log', icon: History, show: user.role === 'admin' },
    { id: 'reports' as Tab, label: 'Sales & Export', icon: BarChart3, show: user.role === 'admin' },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings, show: user.permissions.showSettings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-white border-b md:border-r md:border-b-0 border-gray-200 w-full md:w-64 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
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

        <nav className="p-4">
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
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mt-8"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 relative">
        {/* Notification Bell - Fixed Position */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="fixed top-4 right-4 md:top-8 md:right-8 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-40 border border-gray-200"
        >
          <Bell className="w-5 h-5 text-gray-700" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {activeTab === 'calendar' && user.permissions.showCalendar && <CalendarView />}
        {activeTab === 'patients' && user.permissions.showPatients && <PatientsView />}
        {activeTab === 'doctors' && user.permissions.showDoctors && <DoctorsView />}
        {activeTab === 'services' && user.permissions.showServices && <ServicesView />}
        {activeTab === 'materials-tools' && user.role === 'admin' && <MaterialsToolsView />}
        {activeTab === 'practitioner-types' && user.role === 'admin' && <PractitionerTypesView />}
        {activeTab === 'users' && user.permissions.showUsers && <UsersView onUsersUpdate={updateAllUsers} />}
        {activeTab === 'backlog' && user.role === 'admin' && <BacklogView />}
        {activeTab === 'reports' && user.role === 'admin' && <AccountantDashboard embedded />}
        {activeTab === 'settings' && user.permissions.showSettings && <SettingsView />}

        {/* Notification Panel */}
        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </main>
    </div>
  );
}