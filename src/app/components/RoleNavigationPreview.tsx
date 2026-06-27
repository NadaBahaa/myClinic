import {
  Calendar,
  Users,
  UserCog,
  Sparkles,
  Settings,
  Shield,
  Briefcase,
  Package,
  History,
  BarChart3,
  Bell,
  Tag,
  FolderOpen,
  DollarSign,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SystemModule, RoleTabPermissions } from '../../lib/services/superAdminService';
import {
  DASHBOARD_ROLES,
  type DashboardRole,
  type ResolvedNavTab,
  emptyPermissions,
  moduleVisibilityFromModules,
  resolveRoleNavigation,
} from '../../lib/navigation/roleNavigation';

const TAB_ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  patients: Users,
  'patients-day': Bell,
  'my-patients': FolderOpen,
  doctors: UserCog,
  services: Sparkles,
  coupons: Tag,
  'materials-tools': Package,
  'practitioner-types': Briefcase,
  users: Shield,
  backlog: History,
  reports: BarChart3,
  notifications: Bell,
  settings: Settings,
};

const ROLE_ACCENT: Record<DashboardRole, { badge: string; active: string; label: string }> = {
  admin: { badge: 'bg-purple-100 text-purple-700', active: 'bg-pink-50 text-pink-700', label: 'Admin' },
  doctor: { badge: 'bg-blue-100 text-blue-700', active: 'bg-pink-50 text-pink-700', label: 'Doctor' },
  assistant: { badge: 'bg-green-100 text-green-700', active: 'bg-pink-50 text-pink-700', label: 'Assistant' },
  accountant: { badge: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-50 text-emerald-800', label: 'Accountant' },
};

interface RoleNavigationPreviewProps {
  modules: SystemModule[];
  roleTabVisibility: RoleTabPermissions;
  title?: string;
  description?: string;
}

function PreviewTabRow({ tab, accent }: { tab: ResolvedNavTab; accent: string }) {
  const Icon = TAB_ICONS[tab.id] ?? Sparkles;
  if (tab.visible) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${accent}`}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{tab.label}</span>
      </div>
    );
  }

  const reason = tab.hiddenByModule ? 'Module off' : 'Tab off';
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-50 line-through decoration-gray-300"
      title={reason}
    >
      <Icon className="w-4 h-4 flex-shrink-0 opacity-50" />
      <span className="truncate">{tab.label}</span>
      <span className="ml-auto text-[10px] uppercase tracking-wide no-underline">{reason}</span>
    </div>
  );
}

function RolePreviewCard({
  role,
  modules,
  roleTabVisibility,
}: {
  role: DashboardRole;
  modules: SystemModule[];
  roleTabVisibility: RoleTabPermissions;
}) {
  const accent = ROLE_ACCENT[role];
  const moduleVisibility = moduleVisibilityFromModules(modules, role);
  const permissions = { ...emptyPermissions(), ...(roleTabVisibility[role] ?? {}) };
  const tabs = resolveRoleNavigation(role, moduleVisibility, permissions);
  const visibleCount = tabs.filter((t) => t.visible).length;
  const sidebarTabs = tabs.filter((t) => (t.placement ?? 'sidebar') === 'sidebar');
  const footerTabs = tabs.filter((t) => t.placement === 'footer');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[280px]">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${accent.badge}`}>
            {accent.label}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {visibleCount} of {tabs.length} tabs visible
          </p>
        </div>
        {role === 'accountant' && <DollarSign className="w-5 h-5 text-emerald-600" />}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        {sidebarTabs.map((tab) => (
          <PreviewTabRow key={tab.id} tab={tab} accent={accent.active} />
        ))}
        {sidebarTabs.length === 0 && (
          <p className="text-sm text-gray-400 italic px-2 py-4 text-center">No sidebar tabs enabled</p>
        )}
      </div>
      {footerTabs.length > 0 && (
        <div className="border-t border-gray-100 p-3 space-y-1 bg-gray-50/80">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 px-1 mb-1">Footer</p>
          {footerTabs.map((tab) => (
            <PreviewTabRow key={tab.id} tab={tab} accent={accent.active} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoleNavigationPreview({
  modules,
  roleTabVisibility,
  title = 'Live navigation preview',
  description = 'Shows the effective sidebar for each role: a tab appears only when its module is enabled and the role default tab permission is on.',
}: RoleNavigationPreviewProps) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {DASHBOARD_ROLES.map((role) => (
          <RolePreviewCard
            key={role}
            role={role}
            modules={modules}
            roleTabVisibility={roleTabVisibility}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Strikethrough items are hidden — &quot;Module off&quot; means disabled under Modules; &quot;Tab off&quot; means disabled under Tab visibility by role.
      </p>
    </section>
  );
}
