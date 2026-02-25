import { useState, createContext, useContext, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'sonner';
import Landing from './components/Landing';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DoctorPortal from './components/DoctorPortal';
import AssistantPortal from './components/AssistantPortal';
import type { SystemUser, UserPermissions } from './components/UserDetailModal';
import { PractitionerTypeProvider } from './contexts/PractitionerTypeContext';
import { authService } from '../lib/services/authService';
import { getToken } from '../lib/api';

// Types
export type UserRole = 'admin' | 'doctor' | 'assistant' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  practitionerTypeId?: string | null;
  permissions: UserPermissions;
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
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'admin' | 'doctor' | 'assistant'>('landing');
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);

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
    if (role === 'admin') setCurrentPage('admin');
    else if (role === 'doctor') setCurrentPage('doctor');
    else if (role === 'assistant') setCurrentPage('assistant');
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
      return <Login onBack={() => setCurrentPage('landing')} />;
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
