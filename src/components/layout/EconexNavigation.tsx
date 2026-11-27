/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V18.0 - Complete Role-Aware Navigation System (Top Bar, Collapsible Sidebar, Breadcrumbs, Mobile Drawer & Bottom Bar)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Coins,
  Compass,
  Cpu,
  CreditCard,
  Database,
  Eye,
  Factory,
  FileLock2,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Flag,
  Gauge,
  Gavel,
  GitCompare,
  Globe,
  Hammer,
  HardDrive,
  HelpCircle,
  Home,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  Lock,
  MapPin,
  Menu,
  MessageSquare,
  Network,
  PackageCheck,
  PiggyBank,
  Plug,
  QrCode,
  Radar,
  Radio,
  Receipt,
  Route,
  Scale,
  ScrollText,
  Search,
  Server,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Sprout,
  Store,
  Trees,
  TrendingUp,
  Truck,
  User,
  UserPlus,
  Users,
  Vault,
  Wallet,
  Warehouse,
  WifiOff,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useOffline } from '../../context/OfflineContext.tsx';
import { useExperience, type ExperienceMode } from '../../context/ExperienceContext.tsx';
import { LanguageSelector } from '../ux/LanguageSelector.tsx';
import {
  ALL_USER_ROLES,
  getBreadcrumbsForNavItem,
  getNavItemById,
  getV29DisplayLabel,
  getV29MenuCategories,
  resolveV29MenuCategory,
} from '../../navigation/navigationRegistry.ts';
import type { UserRole } from '../../types/index.ts';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onOpenAuth: () => void;
  onOpenSearch?: () => void;
  totalTestsCount: number;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Coins,
  Compass,
  Cpu,
  CreditCard,
  Database,
  Eye,
  Factory,
  FileLock2,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Flag,
  Gauge,
  Gavel,
  GitCompare,
  Globe,
  Hammer,
  HardDrive,
  HelpCircle,
  Home,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  Lock,
  MapPin,
  MessageSquare,
  Network,
  PackageCheck,
  PiggyBank,
  Plug,
  QrCode,
  Radar,
  Radio,
  Receipt,
  Route,
  Scale,
  ScrollText,
  Search,
  Server,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Sprout,
  Store,
  Trees,
  TrendingUp,
  Truck,
  User,
  UserPlus,
  Users,
  Vault,
  Wallet,
  Warehouse,
  Workflow,
  Zap,
};

function renderNavIcon(iconName: string, size = 16): React.ReactNode {
  const IconComp = ICON_MAP[iconName] || Compass;
  return <IconComp size={size} aria-hidden="true" className="shrink-0" />;
}

const ROLE_LABELS: Record<UserRole, string> = {
  FARMER: 'Farmer / Producer',
  BUYER: 'Buyer / Trader',
  AGRO_DEALER: 'Agro-Dealer',
  COOPERATIVE_ADMIN: 'Cooperative Admin',
  TRANSPORTER: 'Transporter / Carrier',
  PLATFORM_ADMIN: 'Platform Admin',
};

const MODE_LABELS: Record<ExperienceMode, string> = {
  SIMPLE: 'Simple View',
  STANDARD: 'Standard View',
  PROFESSIONAL: 'Enterprise View',
  ADMINISTRATOR: 'Administrator View',
};

export const EconexTopBar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenAuth,
  onOpenSearch,
}) => {
  const { currentUser, role, switchRole } = useAuth();
  const { isSimulatedOffline, pendingCount } = useOffline();
  const { mode, setMode, canAccessMode } = useExperience();
  const [roleError, setRoleError] = useState<string | null>(null);

  const handleModeChange = (nextMode: ExperienceMode) => {
    const res = setMode(nextMode, role, currentUser?.id);
    if (!res.ok) {
      setRoleError(res.error || 'Cannot switch to that workspace level.');
      setTimeout(() => setRoleError(null), 4000);
    } else {
      setRoleError(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 bg-[#050505]/95 backdrop-blur-md border-b border-[#27272a]">
      <div className="max-w-[1440px] mx-auto h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#181818] border border-[#D4AF37]/60 flex items-center justify-center font-bold text-base text-[#D4AF37] shrink-0">
              E
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-base tracking-wide text-[#F5F5F5] leading-none">
                ECONEX
              </div>
              <div className="text-[11px] text-[#A0A0A0] hidden sm:block mt-0.5 truncate">
                Universal Economic Platform
              </div>
            </div>
          </button>

          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Open global search (Ctrl+K)"
              className="hidden md:flex items-center gap-2 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer ml-2"
            >
              <Search size={14} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Search businesses, products, services, opportunities...</span>
              <kbd className="ml-2 px-1.5 py-0.5 rounded bg-[#181818] border border-[#27272a] text-[10px] font-mono text-[#A0A0A0]">
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Open global search"
              className="md:hidden min-h-[40px] min-w-[40px] rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] flex items-center justify-center cursor-pointer"
            >
              <Search size={16} className="text-[#D4AF37]" aria-hidden="true" />
            </button>
          )}

          {(isSimulatedOffline || pendingCount > 0) && (
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className="min-h-[38px] px-2.5 py-1 rounded-xl bg-[#181818] border border-[#D4AF37]/50 text-xs text-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
            >
              <WifiOff size={13} aria-hidden="true" />
              <span className="tabular-nums">{isSimulatedOffline ? 'Offline' : `${pendingCount} Drafts`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            aria-label={`Notifications and tasks (${unreadCount} unread)`}
            className={`relative min-h-[40px] min-w-[40px] px-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#121212] text-[#F5F5F5] border-[#27272a] hover:border-[#D4AF37]'
            }`}
          >
            <Bell size={16} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className={`text-xs font-mono font-bold tabular-nums ${
                  activeTab === 'tasks' ? 'text-[#050505]' : 'text-[#D4AF37]'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <div className="hidden xl:flex items-center gap-1.5">
            <label htmlFor="econex-mode-select" className="sr-only">
              Workspace View Level
            </label>
            <select
              id="econex-mode-select"
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as ExperienceMode)}
              className="min-h-[38px] px-2.5 py-1 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {(['SIMPLE', 'STANDARD', 'PROFESSIONAL', 'ADMINISTRATOR'] as ExperienceMode[]).map((m) => (
                <option key={m} value={m} disabled={!canAccessMode(m, role)}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>

            <label htmlFor="econex-role-select" className="sr-only">
              Active Account Role
            </label>
            <select
              id="econex-role-select"
              value={role}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="min-h-[38px] px-2.5 py-1 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {ALL_USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:block">
            <LanguageSelector compact />
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('help')}
            aria-label="Open Help Centre"
            className={`hidden sm:flex min-h-[40px] px-3 py-1.5 rounded-xl border text-xs sm:text-sm items-center gap-1.5 cursor-pointer ${
              activeTab === 'help'
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#181818] text-[#F5F5F5] border-[#27272a] hover:border-[#D4AF37]'
            }`}
          >
            <HelpCircle size={15} aria-hidden="true" />
            <span>Help</span>
          </button>

          <button
            type="button"
            onClick={() => (currentUser ? setActiveTab('account') : onOpenAuth())}
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <span className="w-6 h-6 rounded-full bg-[#181818] border border-[#3f3f46] flex items-center justify-center font-semibold text-[#D4AF37] shrink-0">
              {(currentUser?.name || 'U').slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline truncate max-w-[100px]">
              {currentUser?.name?.split(' ')[0] || 'Account'}
            </span>
          </button>
        </div>
      </div>

      {roleError && (
        <div
          role="status"
          className="bg-[#181818] border-b border-[#D4AF37]/50 px-4 py-1.5 text-center text-xs text-[#D4AF37]"
        >
          {roleError}
        </div>
      )}
    </header>
  );
};

export const EconexDesktopSidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenSearch,
}) => {
  const { role } = useAuth();
  const { mode } = useExperience();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('econex_sidebar_collapsed') === 'true';
  });
  const [showAllPermitted, setShowAllPermitted] = useState<boolean>(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    BUSINESS: true,
    TRADE: true,
    FINANCE: true,
    NETWORK: true,
    SUPPORT: true,
    ADMINISTRATION: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('econex_sidebar_collapsed', String(collapsed));
    }
  }, [collapsed]);

  const activeItem = getNavItemById(activeTab);
  const activeCategoryId = activeItem ? resolveV29MenuCategory(activeItem) : 'BUSINESS';

  const categories = getV29MenuCategories(role, mode, {
    includeTechnicalForAdmin: showAllPermitted && role === 'PLATFORM_ADMIN',
  });

  const toggleGroup = (categoryId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [categoryId]: !(prev[categoryId] ?? categoryId === activeCategoryId),
    }));
  };

  return (
    <aside
      aria-label="Primary desktop navigation"
      className={`hidden lg:flex flex-col shrink-0 border-r border-[#27272a] bg-[#0a0a0c] transition-all duration-150 ${
        collapsed ? 'w-[72px] p-2.5' : 'w-68 p-3.5'
      }`}
    >
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#27272a]">
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#D4AF37] truncate">
              {ROLE_LABELS[role]}
            </div>
            <div className="text-[11px] text-[#A0A0A0] truncate">
              {MODE_LABELS[mode]}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="min-h-[38px] min-w-[38px] rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] flex items-center justify-center cursor-pointer mx-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="py-2.5 border-b border-[#27272a] space-y-2">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#A0A0A0] hover:text-[#F5F5F5] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search size={14} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Quick Search</span>
              </span>
              <span className="text-[10px] font-mono">Ctrl+K</span>
            </button>
          )}
          {role === 'PLATFORM_ADMIN' && (
            <label className="flex items-center justify-between px-1 text-[11px] text-[#A0A0A0] cursor-pointer select-none">
              <span>Show admin &amp; developer tools</span>
              <input
                type="checkbox"
                checked={showAllPermitted}
                onChange={(e) => setShowAllPermitted(e.target.checked)}
                className="accent-[#D4AF37] w-3.5 h-3.5 cursor-pointer"
              />
            </label>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 space-y-3" aria-label="Workspace sections">
        {categories.map((cat) => {
          const isOpen = collapsed || (expandedGroups[cat.id] ?? cat.id === activeCategoryId);
          return (
            <div key={cat.id} className="space-y-1">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(cat.id)}
                  aria-expanded={isOpen}
                  className="w-full px-2.5 py-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
                >
                  <span className="truncate">{cat.label}</span>
                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}

              {isOpen && (
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const active = activeTab === item.id;
                    const badgeText =
                      item.id === 'tasks' && unreadCount > 0 ? String(unreadCount) : null;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        title={collapsed ? item.displayLabel : item.description}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full min-h-[40px] ${
                          collapsed ? 'px-0 justify-center' : 'px-3 justify-between'
                        } py-2 rounded-xl text-xs sm:text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#181818] text-[#D4AF37] border border-[#D4AF37]/50 font-semibold'
                            : 'text-[#C0C0C0] hover:text-[#F5F5F5] hover:bg-[#121212] border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          {renderNavIcon(item.iconName, 16)}
                          {!collapsed && <span className="truncate">{item.displayLabel}</span>}
                        </span>
                        {!collapsed && badgeText && (
                          <span className="text-[10px] font-mono text-[#D4AF37] tabular-nums shrink-0">
                            {badgeText}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export const EconexBreadcrumbs: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}> = ({ activeTab, setActiveTab, onGoBack, canGoBack }) => {
  const { role } = useAuth();
  const { mode } = useExperience();
  const activeItem = getNavItemById(activeTab);
  const rawTrail = getBreadcrumbsForNavItem(activeTab);

  if (!activeItem && activeTab === 'home') return null;

  const isAdminTechView = role === 'PLATFORM_ADMIN' && mode === 'ADMINISTRATOR';
  const currentTitle = activeItem ? getV29DisplayLabel(activeItem) : 'Workspace';
  const trail = rawTrail.map((crumb) => {
    const matched = getNavItemById(crumb.id);
    return {
      ...crumb,
      label: matched ? getV29DisplayLabel(matched) : crumb.label,
    };
  });

  return (
    <div className="mb-5 pb-3 border-b border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {canGoBack && onGoBack && activeTab !== 'home' && (
          <button
            type="button"
            onClick={onGoBack}
            aria-label="Go back"
            className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#F5F5F5] flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Back</span>
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap text-xs">
          {trail.map((crumb, idx) => {
            const isLast = idx === trail.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <span className="text-[#52525b]">/</span>}
                {isLast ? (
                  <span className="text-[#D4AF37] font-medium truncate max-w-[260px]">
                    {currentTitle}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab(crumb.id)}
                    className="text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 text-xs text-[#A0A0A0] shrink-0">
        {activeItem?.availability === 'SANDBOX_ONLY' && (
          <span className="text-[#D4AF37] font-medium">Sandbox environment</span>
        )}
        {isAdminTechView && activeItem?.route && (
          <span className="font-mono text-[11px] text-[#A0A0A0]">{activeItem.route}</span>
        )}
        <span className="text-[#C0C0C0]">{ROLE_LABELS[role]}</span>
      </div>
    </div>
  );
};

export const EconexMobileBottomNav: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onOpenMobileMenu: () => void;
}> = ({ activeTab, setActiveTab, unreadCount, onOpenMobileMenu }) => {
  const { t } = useExperience();
  const items = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'explore', label: t('nav_explore'), icon: Compass },
    { id: 'activity', label: t('nav_activity'), icon: ClipboardList },
    { id: 'tasks', label: 'Tasks', icon: Bell, badge: unreadCount },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#0a0a0c]/95 backdrop-blur-md border-t border-[#27272a] grid grid-cols-5"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer ${
              active ? 'text-[#D4AF37] font-semibold' : 'text-[#A0A0A0]'
            }`}
          >
            <span className="relative">
              <Icon size={18} aria-hidden="true" />
              {item.badge ? (
                <span className="absolute -top-1 -right-2 text-[9px] font-bold text-[#D4AF37] tabular-nums">
                  {item.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[11px] leading-none">{item.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="Open full navigation menu"
        className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
      >
        <Menu size={18} aria-hidden="true" />
        <span className="text-[11px] leading-none">Menu</span>
      </button>
    </nav>
  );
};

export const EconexMobileDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
}> = ({ isOpen, onClose, activeTab, setActiveTab, onOpenSearch }) => {
  const { currentUser, role, switchRole } = useAuth();
  const { mode, setMode, canAccessMode } = useExperience();

  if (!isOpen) return null;

  const categories = getV29MenuCategories(role, mode, {
    includeTechnicalForAdmin: role === 'PLATFORM_ADMIN',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ECONEX full navigation menu"
      className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex"
    >
      <div className="w-full max-w-sm bg-[#0a0a0c] border-r border-[#27272a] h-full flex flex-col">
        <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
          <div>
            <div className="font-display font-bold text-base text-[#F5F5F5]">ECONEX Menu</div>
            <div className="text-xs text-[#A0A0A0]">{ROLE_LABELS[role]} · {MODE_LABELS[mode]}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-[#27272a] bg-[#121212] text-[#F5F5F5] flex items-center justify-center cursor-pointer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 border-b border-[#27272a] space-y-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#121212] border border-[#27272a] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <Search size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Search businesses, products, services...</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="mobile-role-select" className="block text-[11px] text-[#A0A0A0] mb-1">
                Role
              </label>
              <select
                id="mobile-role-select"
                value={role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="w-full min-h-[40px] px-2.5 rounded-xl bg-[#121212] border border-[#27272a] text-xs text-[#D4AF37]"
              >
                {ALL_USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mobile-mode-select" className="block text-[11px] text-[#A0A0A0] mb-1">
                Experience
              </label>
              <select
                id="mobile-mode-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as ExperienceMode, role, currentUser?.id)}
                className="w-full min-h-[40px] px-2.5 rounded-xl bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
              >
                {(['SIMPLE', 'STANDARD', 'PROFESSIONAL', 'ADMINISTRATOR'] as ExperienceMode[]).map((m) => (
                  <option key={m} value={m} disabled={!canAccessMode(m, role)}>
                    {MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <LanguageSelector />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">
                {cat.label}
              </div>
              <div className="space-y-1">
                {cat.items.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        onClose();
                      }}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm flex items-center justify-between cursor-pointer ${
                        active
                          ? 'bg-[#181818] text-[#D4AF37] border border-[#D4AF37]/50 font-semibold'
                          : 'bg-[#121212] text-[#F5F5F5] border border-[#27272a]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        {renderNavIcon(item.iconName, 16)}
                        <span className="truncate">{item.displayLabel}</span>
                      </span>
                      <ChevronRight size={14} className="text-[#A0A0A0] shrink-0" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Close menu backdrop"
        onClick={onClose}
        className="flex-1 h-full cursor-default"
      />
    </div>
  );
};
