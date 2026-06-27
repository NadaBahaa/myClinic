import { useEffect, useMemo } from 'react';
import { useAuth } from '../../app/App';
import {
  type DashboardRole,
  type ResolvedNavTab,
  emptyPermissions,
  resolveRoleNavigation,
  visibleTabs,
} from './roleNavigation';

export function useRoleNavigation(role: DashboardRole) {
  const { user } = useAuth();

  const moduleVisibility = user?.moduleVisibility ?? {};
  const permissions = user?.permissions ?? emptyPermissions();

  const moduleVisibilityKey = useMemo(
    () => JSON.stringify(moduleVisibility),
    [moduleVisibility],
  );
  const permissionsKey = useMemo(
    () => JSON.stringify(permissions),
    [permissions],
  );

  const parsedModuleVisibility = useMemo(
    () => JSON.parse(moduleVisibilityKey) as Record<string, boolean>,
    [moduleVisibilityKey],
  );
  const parsedPermissions = useMemo(
    () => JSON.parse(permissionsKey) as typeof permissions,
    [permissionsKey],
  );

  const allTabs = useMemo(
    () => resolveRoleNavigation(role, parsedModuleVisibility, parsedPermissions),
    [role, parsedModuleVisibility, parsedPermissions],
  );

  const sidebarTabs = useMemo(
    () => visibleTabs(role, parsedModuleVisibility, parsedPermissions, 'sidebar'),
    [role, parsedModuleVisibility, parsedPermissions],
  );

  const footerTabs = useMemo(
    () => visibleTabs(role, parsedModuleVisibility, parsedPermissions, 'footer'),
    [role, parsedModuleVisibility, parsedPermissions],
  );

  const isTabVisible = (tabId: string) =>
    allTabs.some((tab) => tab.id === tabId && tab.visible);

  return {
    moduleVisibility: parsedModuleVisibility,
    permissions: parsedPermissions,
    allTabs,
    sidebarTabs,
    footerTabs,
    isTabVisible,
  };
}

/** Keep active tab on first visible item when super-admin changes module/tab settings. */
export function useSyncActiveTab<T extends string>(
  activeTab: T,
  setActiveTab: (tab: T) => void,
  visibleTabIds: ResolvedNavTab[],
) {
  const visibleTabIdsKey = visibleTabIds.map((t) => t.id).join('|');

  useEffect(() => {
    const ids = visibleTabIdsKey ? visibleTabIdsKey.split('|') : [];
    if (ids.length === 0) return;
    if (!ids.includes(activeTab)) {
      setActiveTab(ids[0] as T);
    }
  }, [activeTab, setActiveTab, visibleTabIdsKey]);
}
