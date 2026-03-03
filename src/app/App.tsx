import { useState, createContext, useContext, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'sonner';
import Landing from './components/Landing';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import DoctorPortal from './components/DoctorPortal';
import AssistantPortal from './components/AssistantPortal';
import AccountantDashboard from './components/AccountantDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import type { SystemUser, UserPermissions } from './components/UserDetailModal';
import { PractitionerTypeProvider } from './contexts/PractitionerTypeContext';
import { authService } from '../lib/services/authService';
import { getToken } from '../lib/api';

// Types
export type UserRole = 'superadmin' | 'admin' | 'doctor' | 'assistant' | 'accountant' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  practitionerTypeId?: string | null;
  doctorId?: string | null;
  permissions: UserPermissions;
  /** Module keys enabled for this user's role (from Super Admin Modules). Absent or true = visible. */
  moduleVisibility?: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  allUsers: SystemUser[];
  updateAllUsers: (users: SystemUser[]) => void;
}

// Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'forgot-password' | 'reset-password' | 'admin' | 'doctor' | 'assistant' | 'accountant' | 'superadmin'>('landing');
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);

  // Check for reset-password link from email (e.g. /reset-password?token=...&email=...)
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (path === '/reset-password' && params.get('token') && params.get('email')) {
      setCurrentPage('reset-password');
    }
  }, []);

  // Restore session on mount if token exists in localStorage
  useEffect(() => {
    if (getToken()) {
      authService.me()
        .then(me => {
          setUser(me);
          navigateForRole(me.role);
        })
        .catch(() => {
          // Token invalid/expired — stay on landing
        });
    }

    // Handle 401 Unauthorized from any API call
    const handle401 = () => {
      setUser(null);
      setCurrentPage('landing');
    };
    window.addEventListener('auth:unauthorized', handle401);
    return () => window.removeEventListener('auth:unauthorized', handle401);
  }, []);

  const navigateForRole = (role: UserRole) => {
    if (role === 'superadmin') setCurrentPage('superadmin');
    else if (role === 'admin') setCurrentPage('admin');
    else if (role === 'doctor') setCurrentPage('doctor');
    else if (role === 'assistant') setCurrentPage('assistant');
    else if (role === 'accountant') setCurrentPage('accountant');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: me } = await authService.login(email, password);
      setUser(me);
      navigateForRole(me.role);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    authService.logout().finally(() => {
      setUser(null);
      setCurrentPage('landing');
    });
  };

  const updateAllUsers = (users: SystemUser[]) => {
    setAllUsers(users);
  };

  const renderPage = () => {
    if (currentPage === 'landing') {
      return <Landing onLoginClick={() => setCurrentPage('login')} />;
    }
    if (currentPage === 'login') {
      return <Login onBack={() => setCurrentPage('landing')} onForgotPassword={() => setCurrentPage('forgot-password')} />;
    }
    if (currentPage === 'forgot-password') {
      return <ForgotPassword onBack={() => setCurrentPage('login')} />;
    }
    if (currentPage === 'reset-password') {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      return (
        <ResetPassword
          onBack={() => setCurrentPage('login')}
          token={params.get('token')}
          email={params.get('email')}
        />
      );
    }
    if (currentPage === 'admin' && user?.role === 'admin') {
      return <AdminDashboard />;
    }
    if (currentPage === 'doctor' && user?.role === 'doctor') {
      return <DoctorPortal />;
    }
    if (currentPage === 'assistant' && user?.role === 'assistant') {
      return <AssistantPortal />;
    }
    if (currentPage === 'accountant' && user?.role === 'accountant') {
      return <AccountantDashboard />;
    }
    if (currentPage === 'superadmin' && user?.role === 'superadmin') {
      return <SuperAdminDashboard />;
    }
    return <Landing onLoginClick={() => setCurrentPage('login')} />;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, allUsers, updateAllUsers }}>
      <PractitionerTypeProvider>
        <DndProvider backend={HTML5Backend}>
          <div className="min-h-screen bg-gray-50">
            {renderPage()}
            <Toaster position="top-right" richColors />
          </div>
        </DndProvider>
      </PractitionerTypeProvider>
    </AuthContext.Provider>
  );
}

export default App;
