import React, { useState, useEffect } from 'react';
import {
  Shield,
  LogOut,
  LayoutGrid,
  ToggleLeft,
  History,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Terminal,
  Network,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../App';
import CalendarView from './CalendarView';
import { authService } from '../../lib/services/authService';
import {
  superAdminService,
  type SystemModule,
  type SystemFeatureFlag,
  type SystemUser,
} from '../../lib/services/superAdminService';
import { userService } from '../../lib/services/userService';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

const DEFAULT_PERMISSIONS: Record<string, { showCalendar: boolean; showPatients: boolean; showDoctors: boolean; showServices: boolean; showUsers: boolean; showSettings: boolean }> = {
  superadmin: { showCalendar: true, showPatients: true, showDoctors: true, showServices: true, showUsers: true, showSettings: true },
  admin: { showCalendar: true, showPatients: true, showDoctors: true, showServices: true, showUsers: true, showSettings: true },
  doctor: { showCalendar: true, showPatients: true, showDoctors: false, showServices: true, showUsers: false, showSettings: false },
  assistant: { showCalendar: true, showPatients: true, showDoctors: true, showServices: true, showUsers: false, showSettings: false },
  accountant: { showCalendar: false, showPatients: false, showDoctors: false, showServices: false, showUsers: false, showSettings: false },
};

type Tab = 'calendar' | 'modules' | 'features' | 'activity' | 'users' | 'api-log' | 'tinker';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('modules');

  const [modules, setModules] = useState<SystemModule[]>([]);
  const [featureFlags, setFeatureFlags] = useState<SystemFeatureFlag[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityMeta, setActivityMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityExpandedId, setActivityExpandedId] = useState<number | null>(null);

  const [moduleDirty, setModuleDirty] = useState(false);
  const [flagsDirty, setFlagsDirty] = useState(false);

  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', password: '', role: 'assistant' as string });
  const [savingUser, setSavingUser] = useState(false);

  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [apiLogMeta, setApiLogMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [apiLogPage, setApiLogPage] = useState(1);
  const [apiLogExpandedId, setApiLogExpandedId] = useState<number | null>(null);

  const [tinkerCommand, setTinkerCommand] = useState('cache:clear');
  const [tinkerOutput, setTinkerOutput] = useState('');
  const [tinkerRunning, setTinkerRunning] = useState(false);

  useEffect(() => {
    if (activeTab === 'modules') {
      setLoading(true);
      superAdminService.getModules().then(setModules).catch(() => toast.error('Failed to load modules')).finally(() => setLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'features') {
      setLoading(true);
      superAdminService.getFeatureFlags().then(setFeatureFlags).catch(() => toast.error('Failed to load features')).finally(() => setLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      setLoading(true);
      superAdminService.getUsers().then(setUsers).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'activity') {
      setLoading(true);
      superAdminService.getActivityLog({ page: activityPage }).then((res) => {
        setActivityLogs(res.data);
        setActivityMeta(res.meta);
      }).catch(() => toast.error('Failed to load activity')).finally(() => setLoading(false));
    }
  }, [activeTab, activityPage]);

  useEffect(() => {
    if (activeTab === 'api-log') {
      setLoading(true);
      superAdminService.getApiLog({ page: apiLogPage }).then((res) => {
        setApiLogs(res.data);
        setApiLogMeta(res.meta);
      }).catch(() => toast.error('Failed to load API log')).finally(() => setLoading(false));
    }
  }, [activeTab, apiLogPage]);

  const handleModuleToggle = (key: string, enabled: boolean) => {
    setModules((prev) => prev.map((m) => (m.key === key ? { ...m, enabled } : m)));
    setModuleDirty(true);
  };

  const saveModules = async () => {
    try {
      await superAdminService.updateModules(modules.map((m) => ({ key: m.key, enabled: m.enabled })));
      setModuleDirty(false);
      toast.success('Modules updated');
    } catch {
      toast.error('Failed to save modules');
    }
  };

  const handleFlagToggle = (key: string, enabled: boolean) => {
    setFeatureFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
    setFlagsDirty(true);
  };

  const saveFlags = async () => {
    try {
      await superAdminService.updateFeatureFlags(featureFlags.map((f) => ({ key: f.key, enabled: f.enabled })));
      setFlagsDirty(false);
      toast.success('Feature flags updated');
    } catch {
      toast.error('Failed to save feature flags');
    }
  };

  const handleUserActiveToggle = async (u: SystemUser, isActive: boolean) => {
    try {
      await superAdminService.setUserActive(u.id, isActive);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive } : x)));
      toast.success(isActive ? 'User activated' : 'User deactivated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update user');
    }
  };

  const handleAddUser = async () => {
    if (!addUserForm.name.trim() || !addUserForm.email.trim() || !addUserForm.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setSavingUser(true);
    try {
      const perms = DEFAULT_PERMISSIONS[addUserForm.role] ?? DEFAULT_PERMISSIONS.assistant;
      await userService.create({
        name: addUserForm.name.trim(),
        email: addUserForm.email.trim(),
        password: addUserForm.password,
        role: addUserForm.role as any,
        permissions: perms,
      });
      toast.success('User created');
      setShowAddUser(false);
      setAddUserForm({ name: '', email: '', password: '', role: 'assistant' });
      const list = await superAdminService.getUsers();
      setUsers(list);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create user');
    } finally {
      setSavingUser(false);
    }
  };

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'modules', label: 'Modules', icon: LayoutGrid },
    { id: 'features', label: 'Features & Fields', icon: ToggleLeft },
    { id: 'activity', label: 'Activity Log', icon: History },
    { id: 'api-log', label: 'API Log', icon: Network },
    { id: 'tinker', label: 'Tinker', icon: Terminal },
    { id: 'users', label: 'Users & Roles', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <aside className="bg-white border-b md:border-r border-gray-200 w-full md:w-64 flex-shrink-0 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-amber-600" />
          <span className="text-lg font-semibold text-gray-900">Super Admin</span>
        </div>
        <p className="text-sm text-gray-600">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
        <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
          Full system control
        </span>
        <nav className="mt-6 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-amber-50 text-amber-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <button
          onClick={() => authService.logout().then(() => logout())}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 mt-8"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'modules' && (
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Modules</h1>
            <p className="text-gray-600 mb-6">Enable or disable entire modules for the system. Disabled modules are hidden from all roles.</p>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                  {modules.map((m) => (
                    <div key={m.key} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        {m.description && <p className="text-sm text-gray-500">{m.description}</p>}
                      </div>
                      <Switch
                        checked={m.enabled}
                        onCheckedChange={(checked) => handleModuleToggle(m.key, checked)}
                      />
                    </div>
                  ))}
                </div>
                {moduleDirty && (
                  <button
                    onClick={saveModules}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Save changes
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Features & Fields</h1>
            <p className="text-gray-600 mb-6">Enable or disable specific features or fields across the system.</p>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                  {featureFlags.map((f) => (
                    <div key={f.key} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{f.label}</p>
                        <p className="text-xs text-gray-500">{f.moduleKey}</p>
                        {f.description && <p className="text-sm text-gray-500 mt-0.5">{f.description}</p>}
                      </div>
                      <Switch
                        checked={f.enabled}
                        onCheckedChange={(checked) => handleFlagToggle(f.key, checked)}
                      />
                    </div>
                  ))}
                </div>
                {flagsDirty && (
                  <button
                    onClick={saveFlags}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Save changes
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Activity Log</h1>
            <p className="text-gray-600 mb-6">All actions by all users and roles across the system.</p>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : activityLogs.length === 0 ? (
              <p className="text-gray-500">No activity yet.</p>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log: any) => (
                        <React.Fragment key={log.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-gray-600">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                            </td>
                            <td className="py-3 px-4">{log.userName ?? '—'}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  log.action === 'created' ? 'bg-green-100 text-green-800' :
                                  log.action === 'updated' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4">{log.subjectType} {log.subjectId ? `(${log.subjectId})` : ''}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setActivityExpandedId(activityExpandedId === log.id ? null : log.id)}
                                className="text-amber-600 hover:underline text-xs"
                              >
                                {activityExpandedId === log.id ? 'Hide' : 'Show'}
                              </button>
                            </td>
                          </tr>
                          {activityExpandedId === log.id && (
                            <tr className="bg-gray-50">
                              <td colSpan={5} className="py-3 px-4">
                                <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                                  {JSON.stringify({ old: log.oldValues, new: log.newValues }, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  {activityMeta.last_page > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 border-t">
                      <span className="text-sm text-gray-600">
                        Page {activityMeta.current_page} of {activityMeta.last_page} ({activityMeta.total} total)
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={activityMeta.current_page <= 1}
                          onClick={() => setActivityPage((p) => p - 1)}
                          className="p-2 rounded border border-gray-300 disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          disabled={activityMeta.current_page >= activityMeta.last_page}
                          onClick={() => setActivityPage((p) => p + 1)}
                          className="p-2 rounded border border-gray-300 disabled:opacity-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'api-log' && (
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">API Request Log</h1>
            <p className="text-gray-600 mb-6">Request, payload, response, and timestamp for all API calls.</p>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : apiLogs.length === 0 ? (
              <p className="text-gray-500">No API logs yet.</p>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Path</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Ms</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiLogs.map((log: any) => (
                        <React.Fragment key={log.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-gray-600">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                            <td className="py-3 px-4 font-mono text-xs">{log.method}</td>
                            <td className="py-3 px-4 font-mono text-xs max-w-[200px] truncate" title={log.path}>{log.path}</td>
                            <td className="py-3 px-4">{log.userName ?? '—'}</td>
                            <td className="py-3 px-4">
                              <span className={log.responseStatus >= 400 ? 'text-red-600' : 'text-green-600'}>{log.responseStatus}</span>
                            </td>
                            <td className="py-3 px-4">{log.responseTimeMs ?? '—'}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setApiLogExpandedId(apiLogExpandedId === log.id ? null : log.id)}
                                className="text-amber-600 hover:underline text-xs"
                              >
                                {apiLogExpandedId === log.id ? 'Hide' : 'Show'}
                              </button>
                            </td>
                          </tr>
                          {apiLogExpandedId === log.id && (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="py-3 px-4">
                                <div className="space-y-2 text-xs">
                                  {log.requestPayload && (
                                    <div>
                                      <p className="font-medium text-gray-700">Request payload</p>
                                      <pre className="bg-white p-2 rounded border overflow-auto max-h-32">{log.requestPayload}</pre>
                                    </div>
                                  )}
                                  {log.responseBody && (
                                    <div>
                                      <p className="font-medium text-gray-700">Response body</p>
                                      <pre className="bg-white p-2 rounded border overflow-auto max-h-48 whitespace-pre-wrap break-all">{log.responseBody}</pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  {apiLogMeta.last_page > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 border-t">
                      <span className="text-sm text-gray-600">Page {apiLogMeta.current_page} of {apiLogMeta.last_page}</span>
                      <div className="flex gap-2">
                        <button disabled={apiLogMeta.current_page <= 1} onClick={() => setApiLogPage((p) => p - 1)} className="p-2 rounded border border-gray-300 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button disabled={apiLogMeta.current_page >= apiLogMeta.last_page} onClick={() => setApiLogPage((p) => p + 1)} className="p-2 rounded border border-gray-300 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'tinker' && (
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Tinker / System</h1>
            <p className="text-gray-600 mb-6">Run safe Artisan commands (e.g. clear caches).</p>
            <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Command</label>
              <select
                value={tinkerCommand}
                onChange={(e) => setTinkerCommand(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-4"
              >
                <option value="cache:clear">cache:clear</option>
                <option value="config:clear">config:clear</option>
                <option value="view:clear">view:clear</option>
                <option value="route:clear">route:clear</option>
                <option value="optimize:clear">optimize:clear</option>
              </select>
              <button
                disabled={tinkerRunning}
                onClick={async () => {
                  setTinkerRunning(true);
                  setTinkerOutput('');
                  try {
                    const res = await superAdminService.runArtisan(tinkerCommand);
                    setTinkerOutput(res.output || res.message || 'Done.');
                    toast.success('Command completed');
                  } catch (e: any) {
                    setTinkerOutput(e?.message || 'Failed');
                    toast.error('Command failed');
                  } finally {
                    setTinkerRunning(false);
                  }
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {tinkerRunning ? 'Running…' : 'Run'}
              </button>
              {tinkerOutput && (
                <pre className="mt-4 p-4 bg-gray-100 rounded border text-sm overflow-auto max-h-48">{tinkerOutput}</pre>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl text-gray-900 mb-2">Users & Roles</h1>
                <p className="text-gray-600">View all users, activate or deactivate accounts. Deactivated users cannot log in.</p>
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" />
                Add user
              </button>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium">{u.name}</td>
                        <td className="py-3 px-4 text-gray-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={u.isActive ? 'text-green-600 font-medium' : 'text-red-600'}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.role !== 'superadmin' && u.id !== user?.id && (
                            <Switch
                              checked={u.isActive}
                              onCheckedChange={(checked) => handleUserActiveToggle(u, checked)}
                            />
                          )}
                          {u.role === 'superadmin' && <span className="text-xs text-gray-400">—</span>}
                          {u.id === user?.id && <span className="text-xs text-gray-400">You</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showAddUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h2 className="text-lg font-semibold mb-4">Add user</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={addUserForm.name}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, name: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={addUserForm.email}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={addUserForm.password}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, password: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={addUserForm.role}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, role: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      >
                        <option value="superadmin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="assistant">Assistant</option>
                        <option value="accountant">Accountant</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleAddUser}
                      disabled={savingUser}
                      className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                      {savingUser ? 'Creating…' : 'Create'}
                    </button>
                    <button
                      onClick={() => { setShowAddUser(false); setAddUserForm({ name: '', email: '', password: '', role: 'assistant' }); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
