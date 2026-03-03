import { useState } from 'react';
import { Plus, Search, Mail, Shield, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import UserDetailModal, { SystemUser, UserPermissions } from './UserDetailModal';

const initialUsers: SystemUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@clinic.com',
    password: 'admin123',
    role: 'admin',
    permissions: {
      showCalendar: true,
      showPatients: true,
      showDoctors: true,
      showServices: true,
      showUsers: true,
      showSettings: true,
    },
  },
  {
    id: '2',
    name: 'Dr. Sarah Johnson',
    email: 'sarah@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    permissions: {
      showCalendar: true,
      showPatients: true,
      showDoctors: false,
      showServices: true,
      showUsers: false,
      showSettings: false,
    },
  },
  {
    id: '3',
    name: 'Dr. Michael Chen',
    email: 'michael@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    permissions: {
      showCalendar: true,
      showPatients: true,
      showDoctors: false,
      showServices: true,
      showUsers: false,
      showSettings: false,
    },
  },
  {
    id: '4',
    name: 'Jessica Smith',
    email: 'assistant@clinic.com',
    password: 'assistant123',
    role: 'assistant',
    permissions: {
      showCalendar: true,
      showPatients: true,
      showDoctors: true,
      showServices: false,
      showUsers: false,
      showSettings: false,
    },
  },
];

interface UsersViewProps {
  onUsersUpdate: (users: SystemUser[]) => void;
}

export default function UsersView({ onUsersUpdate }: UsersViewProps) {
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (user: SystemUser) => {
    let updatedUsers: SystemUser[];
    if (selectedUser) {
      // Update existing user
      updatedUsers = users.map(u => u.id === user.id ? user : u);
    } else {
      // Add new user
      updatedUsers = [...users, user];
    }
    setUsers(updatedUsers);
    onUsersUpdate(updatedUsers);
    toast.success(selectedUser ? 'User updated successfully' : 'User added successfully');
  };

  const handleDeleteUser = (id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    onUsersUpdate(updatedUsers);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'doctor': return 'bg-blue-100 text-blue-700';
      case 'assistant': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPermissionsCount = (permissions: UserPermissions) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">User Management</h1>
          <p className="text-gray-600">{users.length} total users</p>
        </div>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search */}
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

      {/* Users Grid */}
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
              {user.id !== '1' && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                      handleDeleteUser(user.id);
                      toast.success('User deleted successfully');
                    }
                  }}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No users found matching your search.
        </div>
      )}

      {/* User Detail Modal */}
      {isModalOpen && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          existingEmails={users.filter(u => u.id !== selectedUser?.id).map(u => u.email)}
        />
      )}
    </div>
  );
}
