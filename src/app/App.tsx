import { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster, toast } from 'sonner';
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
import { dispatchAuthSessionChanged, getToken } from '../lib/api';
import { resolveIdleLogoutMs, useIdleLogout } from '../lib/useIdleLogout';

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

export type LoginResult = { ok: true } | { ok: false; error: string };

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
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

type PageState =
  | 'landing'
  | 'login'
  | 'forgot-password'
  | 'reset-password'
  | 'admin'
  | 'doctor'
  | 'assistant'
  | 'accountant'
  | 'superadmin';

function roleToDashboardPage(role: UserRole): PageState | null {
  if (!role) return null;
  if (role === 'superadmin') return 'superadmin';
  if (role === 'admin') return 'admin';
  if (role === 'doctor') return 'doctor';
  if (role === 'assistant') return 'assistant';
  if (role === 'accountant') return 'accountant';
  return null;
}

function roleToPath(role: UserRole): string {
  if (!role) return '/';
  if (role === 'superadmin') return '/superadmin';
  if (role === 'admin') return '/admin';
  if (role === 'doctor') return '/doctor';
  if (role === 'assistant') return '/assistant';
  if (role === 'accountant') return '/accountant';
  return '/';
}

function pathToDashboardPage(path: string): PageState | null {
  if (path === '/admin') return 'admin';
  if (path === '/doctor' || path === '/appointments') return 'doctor';
  if (path === '/assistant') return 'assistant';
  if (path === '/accountant') return 'accountant';
  if (path === '/superadmin') return 'superadmin';
  return null;
}

function canRoleAccessPage(page: PageState, role: UserRole): boolean {
  if (!role) return false;
  if (page === 'admin') return role === 'admin';
  if (page === 'doctor') return role === 'doctor';
  if (page === 'assistant') return role === 'assistant';
  if (page === 'accountant') return role === 'accountant';
  if (page === 'superadmin') return role === 'superadmin';
  return false;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageState>('landing');
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);

  const goToDashboard = useCallback((role: UserRole) => {
    const page = roleToDashboardPage(role);
    if (!page) return;
    setCurrentPage(page);
    window.history.replaceState({}, '', roleToPath(role));
  }, []);

  /** Sync URL → SPA state (logged-in role guards, wrong-role redirects). */
  const syncLocationToState = useCallback(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === '/reset-password' && params.get('token') && params.get('email')) {
      setCurrentPage('reset-password');
      return;
    }

    if (!user) {
      if (path === '/login') setCurrentPage('login');
      else if (path === '/forgot-password') setCurrentPage('forgot-password');
      else setCurrentPage('landing');
      return;
    }

    const dash = pathToDashboardPage(path);
    if (dash && canRoleAccessPage(dash, user.role)) {
      setCurrentPage(dash);
      return;
    }
    if (dash && !canRoleAccessPage(dash, user.role)) {
      const correct = roleToPath(user.role);
      window.history.replaceState({}, '', correct);
      setCurrentPage(roleToDashboardPage(user.role)!);
      return;
    }
    if (path === '/login') {
      window.history.replaceState({}, '', roleToPath(user.role));
      setCurrentPage(roleToDashboardPage(user.role)!);
      return;
    }
    if (path === '/' || path === '') {
      window.history.replaceState({}, '', roleToPath(user.role));
      setCurrentPage(roleToDashboardPage(user.role)!);
      return;
    }
    window.history.replaceState({}, '', roleToPath(user.role));
    setCurrentPage(roleToDashboardPage(user.role)!);
  }, [user]);

  useEffect(() => {
    syncLocationToState();
  }, [syncLocationToState]);

  useEffect(() => {
    const onPop = () => syncLocationToState();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [syncLocationToState]);

  // Restore session on mount if token exists in localStorage
  useEffect(() => {
    if (getToken()) {
      authService
        .me()
        .then((me) => {
          setUser(me);
          goToDashboard(me.role);
          dispatchAuthSessionChanged();
        })
        .catch(() => {
          setAllUsers([]);
          if (!getToken()) {
            dispatchAuthSessionChanged();
          }
        });
    }

    // Handle 401 Unauthorized from any API call
    const handle401 = () => {
      setUser(null);
      setAllUsers([]);
      setCurrentPage('landing');
      window.history.replaceState({}, '', '/');
      dispatchAuthSessionChanged();
    };
    window.addEventListener('auth:unauthorized', handle401);
    return () => window.removeEventListener('auth:unauthorized', handle401);
  }, [goToDashboard]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { user: me } = await authService.login(email, password);
      setAllUsers([]);
      setUser(me);
      goToDashboard(me.role);
      dispatchAuthSessionChanged();
      return { ok: true };
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Login failed. Run `npm run dev:all` (API + Vite), or set VITE_API_BASE_URL if using XAMPP.';
      return { ok: false, error: msg };
    }
  };

  const logout = useCallback(() => {
    authService.logout().finally(() => {
      setUser(null);
      setAllUsers([]);
      setCurrentPage('landing');
      window.history.replaceState({}, '', '/');
      dispatchAuthSessionChanged();
    });
  }, []);

  const idleLogoutMs = resolveIdleLogoutMs();
  const handleIdleLogout = useCallback(() => {
    toast.info('You were logged out due to inactivity.');
    logout();
  }, [logout]);

  useIdleLogout({
    enabled: Boolean(user) && idleLogoutMs > 0,
    idleMs: idleLogoutMs,
    onIdle: handleIdleLogout,
  });

  const updateAllUsers = (users: SystemUser[]) => {
    setAllUsers(users);
  };

  const openLandingLogin = () => {
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
  };

  const renderPage = () => {
    if (currentPage === 'landing') {
      return <Landing onLoginClick={openLandingLogin} />;
    }
    if (currentPage === 'login') {
      return (
        <Login
          onBack={() => {
            setCurrentPage('landing');
            window.history.replaceState({}, '', '/');
          }}
          onForgotPassword={() => {
            setCurrentPage('forgot-password');
            window.history.replaceState({}, '', '/forgot-password');
          }}
        />
      );
    }
    if (currentPage === 'forgot-password') {
      return (
        <ForgotPassword
          onBack={() => {
            setCurrentPage('login');
            window.history.replaceState({}, '', '/login');
          }}
        />
      );
    }
    if (currentPage === 'reset-password') {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      return (
        <ResetPassword
          onBack={() => {
            setCurrentPage('login');
            window.history.replaceState({}, '', '/login');
          }}
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
    return <Landing onLoginClick={openLandingLogin} />;
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
