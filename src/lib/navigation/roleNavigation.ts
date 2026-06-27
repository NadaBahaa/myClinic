import type { UserPermissions } from '../../app/components/UserDetailModal';
import type { SystemModule } from '../services/superAdminService';

export type DashboardRole = 'admin' | 'doctor' | 'assistant' | 'accountant';

export type PermissionKey = keyof UserPermissions;

export interface NavTabDefinition {
  id: string;
  label: string;
  moduleKey: string;
  permissionKey?: PermissionKey;
  /** Footer actions (e.g. notifications) vs main sidebar */
  placement?: 'sidebar' | 'footer';
}

export interface ResolvedNavTab extends NavTabDefinition {
  visible: boolean;
  hiddenByModule: boolean;
  hiddenByPermission: boolean;
}

/** Sidebar tabs each role portal can show (icons are applied in each dashboard). */
export const ROLE_NAV_DEFINITIONS: Record<DashboardRole, NavTabDefinition[]> = {
  admin: [
    { id: 'calendar', label: 'Calendar', moduleKey: 'calendar', permissionKey: 'showCalendar' },
    { id: 'patients', label: 'Patients', moduleKey: 'patients', permissionKey: 'showPatients' },
    { id: 'doctors', label: 'Doctors', moduleKey: 'doctors', permissionKey: 'showDoctors' },
    { id: 'services', label: 'Services', moduleKey: 'services', permissionKey: 'showServices' },
    { id: 'coupons', label: 'Coupons', moduleKey: 'services', permissionKey: 'showServices' },
    { id: 'materials-tools', label: 'Materials & Tools', moduleKey: 'materials_tools', permissionKey: 'showMaterialsTools' },
    { id: 'practitioner-types', label: 'Practitioner Types', moduleKey: 'practitioner_types', permissionKey: 'showPractitionerTypes' },
    { id: 'users', label: 'Users', moduleKey: 'users', permissionKey: 'showUsers' },
    { id: 'backlog', label: 'Activity Log', moduleKey: 'activity_log', permissionKey: 'showActivityLog' },
    { id: 'reports', label: 'Sales & Export', moduleKey: 'reports', permissionKey: 'showReports' },
    { id: 'notifications', label: 'Notifications', moduleKey: 'notifications' },
    { id: 'settings', label: 'Settings', moduleKey: 'settings', permissionKey: 'showSettings' },
  ],
  doctor: [
    { id: 'calendar', label: 'My Schedule', moduleKey: 'calendar', permissionKey: 'showCalendar' },
    { id: 'patients-day', label: 'Patients of the Day', moduleKey: 'patients', permissionKey: 'showPatients' },
    { id: 'my-patients', label: 'My Patients', moduleKey: 'patients', permissionKey: 'showPatients' },
    { id: 'materials-tools', label: 'Materials & Tools', moduleKey: 'materials_tools', permissionKey: 'showMaterialsTools' },
  ],
  assistant: [
    { id: 'calendar', label: 'Calendar', moduleKey: 'calendar', permissionKey: 'showCalendar' },
    { id: 'patients-day', label: 'Patients of the Day', moduleKey: 'patients', permissionKey: 'showPatients', placement: 'sidebar' },
    { id: 'patients', label: 'All Patients', moduleKey: 'patients', permissionKey: 'showPatients' },
    { id: 'doctors', label: 'Doctors', moduleKey: 'doctors', permissionKey: 'showDoctors' },
    { id: 'services', label: 'Services', moduleKey: 'services', permissionKey: 'showServices' },
    { id: 'coupons', label: 'Coupons', moduleKey: 'services', permissionKey: 'showServices' },
    { id: 'materials-tools', label: 'Materials & Tools', moduleKey: 'materials_tools', permissionKey: 'showMaterialsTools' },
    { id: 'notifications', label: 'Notifications', moduleKey: 'notifications', placement: 'footer' },
  ],
  accountant: [
    { id: 'reports', label: 'Financial Reports', moduleKey: 'reports', permissionKey: 'showReports' },
  ],
};

export const DASHBOARD_ROLES: DashboardRole[] = ['admin', 'doctor', 'assistant', 'accountant'];

export function emptyPermissions(): UserPermissions {
  return {
    showCalendar: false,
    showPatients: false,
    showDoctors: false,
    showServices: false,
    showUsers: false,
    showSettings: false,
    showActivityLog: false,
    showReports: false,
    showMaterialsTools: false,
    showPractitionerTypes: false,
  };
}

/** Build moduleVisibility map from super-admin module toggles for a role. */
export function moduleVisibilityFromModules(
  modules: SystemModule[],
  role: string,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const m of modules) {
    const byRole = m.enabledForRoles;
    out[m.key] =
      byRole && role in byRole ? Boolean(byRole[role]) : m.enabled;
  }
  return out;
}

export function resolveTabVisibility(
  def: NavTabDefinition,
  moduleVisibility: Record<string, boolean>,
  permissions: UserPermissions,
): ResolvedNavTab {
  const moduleOn = moduleVisibility[def.moduleKey] !== false;
  const permissionOn = def.permissionKey ? Boolean(permissions[def.permissionKey]) : true;
  const visible = moduleOn && permissionOn;
  return {
    ...def,
    visible,
    hiddenByModule: !moduleOn,
    hiddenByPermission: moduleOn && !permissionOn,
  };
}

export function resolveRoleNavigation(
  role: DashboardRole,
  moduleVisibility: Record<string, boolean>,
  permissions: UserPermissions,
): ResolvedNavTab[] {
  return ROLE_NAV_DEFINITIONS[role].map((def) =>
    resolveTabVisibility(def, moduleVisibility, permissions),
  );
}

export function visibleTabs(
  role: DashboardRole,
  moduleVisibility: Record<string, boolean>,
  permissions: UserPermissions,
  placement: 'sidebar' | 'footer' | 'all' = 'sidebar',
): ResolvedNavTab[] {
  return resolveRoleNavigation(role, moduleVisibility, permissions).filter((tab) => {
    if (!tab.visible) return false;
    if (placement === 'all') return true;
    const tabPlacement = tab.placement ?? 'sidebar';
    return tabPlacement === placement;
  });
}

export function isNavTabVisible(
  tabId: string,
  role: DashboardRole,
  moduleVisibility: Record<string, boolean>,
  permissions: UserPermissions,
): boolean {
  const tab = resolveRoleNavigation(role, moduleVisibility, permissions).find((t) => t.id === tabId);
  return tab?.visible ?? false;
}
