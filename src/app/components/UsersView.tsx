import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Mail, Shield, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import UserDetailModal, { SystemUser, UserPermissions } from './UserDetailModal';
import { userService } from '../../lib/services/userService';
import { authService } from '../../lib/services/authService';
import { useAuth } from '../App';
import { useAuthStore } from '../../lib/stores/authStore';
import { dispatchAuthSessionChanged } from '../../lib/api';

export default function UsersView() {
  const { user: currentUser } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const setAllUsers = useAuthStore((s) => s.setAllUsers);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await userService.getAll();
      if (!mountedRef.current) return;
      setUsers(list);
      setAllUsers(list);
    } catch {
      if (mountedRef.current) toast.error('Failed to load users');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [setAllUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const refreshSessionIfSelf = async (userId: string) => {
    if (currentUser?.id === userId) {
      try {
        const me = await authService.me();
        setUser(me);
        dispatchAuthSessionChanged();
      } catch {
        // ignore
      }
    }
  };

  const handleSaveUser = async (user: SystemUser) => {
    setSaving(true);
    try {
      if (selectedUser) {
        await userService.update(user.id, {
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          practitionerTypeId: user.practitionerTypeId,
          ...(user.password?.trim() ? { password: user.password } : {}),
        });
        toast.success('User updated successfully');
        await refreshSessionIfSelf(user.id);
      } else {
        if (!user.password?.trim()) {
          toast.error('Password is required for new users');
          return;
        }
        await userService.create({
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          permissions: user.permissions,
          practitionerTypeId: user.practitionerTypeId,
        });
        toast.success('User added successfully');
      }
      await loadUsers();
      setIsModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await userService.remove(id);
      toast.success('User deleted successfully');
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'doctor':
        return 'bg-blue-100 text-blue-700';
      case 'assistant':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPermissionsCount = (permissions: UserPermissions) =>
    Object.values(permissions).filter(Boolean).length;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">User Management</h1>
          <p className="text-gray-600">{users.length} total users</p>
        </div>
        <button
          onClick={handleAddUser}
          disabled={loading || saving}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading users...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg text-gray-900 mb-1">{user.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getRoleBadgeColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Permissions:</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {user.permissions.showCalendar && <div>• Calendar</div>}
                  {user.permissions.showPatients && <div>• Patients</div>}
                  {user.permissions.showDoctors && <div>• Doctors</div>}
                  {user.permissions.showServices && <div>• Services</div>}
                  {user.permissions.showUsers && <div>• Users</div>}
                  {user.permissions.showSettings && <div>• Settings</div>}
                  {user.permissions.showActivityLog && <div>• Activity Log</div>}
                  {user.permissions.showReports && <div>• Sales & Export</div>}
                  {user.permissions.showMaterialsTools && <div>• Materials & Tools</div>}
                  {user.permissions.showPractitionerTypes && <div>• Practitioner Types</div>}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {getPermissionsCount(user.permissions)} of 10 permissions enabled
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEditUser(user)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-600">No users found matching your search.</div>
      )}

      {isModalOpen && (
        <UserDetailModal
          user={selectedUser}
          saving={saving}
          onClose={() => !saving && setIsModalOpen(false)}
          onSave={handleSaveUser}
          existingEmails={users.filter((u) => u.id !== selectedUser?.id).map((u) => u.email)}
        />
      )}
    </div>
  );
}
