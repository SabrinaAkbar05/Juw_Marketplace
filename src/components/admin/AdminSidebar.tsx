import React, { useEffect, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Package,
  ShoppingBag,
  Users,
  GraduationCap,
  ShieldAlert,
  Star,
  BarChart3,
  Bell,
  Settings,
  Store,
  Mail,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAdmin } from '../../context/AdminContext';

export interface AdminSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const {
    products,
    supportTickets,
    notifications,
    sellers,
    adminInvitations,
    sellerInvitations,
    categories,
  } = useAdmin();

  // Real data calculations for badge counters
  const pendingApprovalsCount = products.filter((p) => p.status === 'PENDING').length;
  const openTicketsCount = supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const pendingApplicationsCount = sellers.filter((s) => s.verificationStatus === 'PENDING_VERIFICATION').length;
  const pendingInvitationsCount =
    adminInvitations.filter((i) => i.status === 'PENDING').length +
    sellerInvitations.filter((i) => i.status === 'PENDING').length;

  // Close mobile drawer on Escape key press
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    },
    [isMobileOpen, onCloseMobile]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Navigation items grouped logically with exact routes
  const navGroups = [
    {
      title: 'Operations & Moderation',
      links: [
        {
          name: 'Dashboard',
          path: '/admin',
          icon: LayoutDashboard,
          end: true,
        },
        {
          name: 'Product Approvals',
          path: '/admin/approvals',
          icon: CheckSquare,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          name: 'Categories',
          path: '/admin/categories',
          icon: Layers,
          badge: categories.length > 0 ? categories.length : undefined,
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          name: 'Products & Stock',
          path: '/admin/products',
          icon: Package,
        },
        {
          name: 'Orders & Fulfillment',
          path: '/admin/orders',
          icon: ShoppingBag,
        },
        {
          name: 'Support & Disputes',
          path: '/admin/support',
          icon: ShieldAlert,
          badge: openTicketsCount > 0 ? openTicketsCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          name: 'Reviews Moderation',
          path: '/admin/reviews',
          icon: Star,
        },
      ],
    },
    {
      title: 'User Management',
      links: [
        {
          name: 'Seller Management',
          path: '/admin/users/sellers',
          icon: Store,
        },
        {
          name: 'Customer Management',
          path: '/admin/users/customers',
          icon: Users,
        },
        {
          name: 'Administrator Management',
          path: '/admin/users/administrators',
          icon: ShieldCheck,
        },
        {
          name: 'Seller Applications',
          path: '/admin/users/applications',
          icon: GraduationCap,
          badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined,
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          name: 'All Users',
          path: '/admin/users',
          icon: Users,
          end: true,
        },
        {
          name: 'Invitations & Pending',
          path: '/admin/users/invitations',
          icon: Mail,
          badge: pendingInvitationsCount > 0 ? pendingInvitationsCount : undefined,
          badgeColor: 'bg-blue-600 text-white',
        },
      ],
    },
    {
      title: 'System & Analytics',
      links: [
        {
          name: 'Analytics',
          path: '/admin/analytics',
          icon: BarChart3,
        },
        {
          name: 'Notifications',
          path: '/admin/notifications',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
          badgeColor: 'bg-blue-500 text-white',
        },
        {
          name: 'Settings',
          path: '/admin/settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* 1. Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar Shell */}
      <aside
        id="admin-sidebar"
        role="navigation"
        aria-label="Admin Navigation Sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-juw-navy-950 text-slate-300 border-r border-slate-800/90 flex flex-col transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 ${
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        } w-[260px] ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* ─── Header: 48px Logo & Controlled Branding ─── */}
        <div
          className={`h-18 px-3.5 border-b border-slate-800/80 flex items-center shrink-0 bg-juw-navy-950/95 backdrop-blur-xs transition-all duration-300 ${
            isCollapsed ? 'lg:justify-center' : 'justify-between'
          }`}
        >
          <div className="min-w-0 flex-1 flex items-center">
            {/* Desktop Collapsed View */}
            <div className="hidden lg:block w-full">
              {isCollapsed ? (
                <Logo
                  variant="light"
                  adminCompact={true}
                  adminCollapsed={true}
                  to="/admin"
                />
              ) : (
                <Logo
                  variant="light"
                  adminCompact={true}
                  adminCollapsed={false}
                  to="/admin"
                />
              )}
            </div>

            {/* Mobile / Tablet / Desktop Expanded View */}
            <div className="lg:hidden w-full">
              <Logo
                variant="light"
                adminCompact={true}
                adminCollapsed={false}
                to="/admin"
              />
            </div>
          </div>

          {/* Mobile Close Button (X) */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 -mr-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Navigation Scroll Area ─── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5 select-none scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {/* Group Title: Hidden when collapsed on desktop */}
              <p
                className={`text-[10px] font-bold uppercase tracking-wider text-slate-400/90 px-3 py-1 transition-opacity duration-200 ${
                  isCollapsed ? 'lg:hidden' : 'block'
                }`}
              >
                {group.title}
              </p>

              {/* Group Nav Items */}
              <div className="space-y-1">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.end
                    ? location.pathname === link.path
                    : location.pathname.startsWith(link.path);

                  return (
                    <div key={link.path + link.name} className="relative group">
                      <NavLink
                        to={link.path}
                        end={link.end}
                        onClick={onCloseMobile}
                        className={({ isActive: isLinkActive }) => {
                          const active = isLinkActive || isActive;
                          return `h-[44px] px-3 rounded-[10px] text-[14px] font-medium flex items-center transition-all duration-150 relative focus-visible:outline-2 focus-visible:outline-emerald-400 focus-visible:outline-offset-1 ${
                            isCollapsed
                              ? 'lg:justify-center lg:px-0'
                              : 'justify-between'
                          } ${
                            active
                              ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                          }`;
                        }}
                      >
                        <div
                          className={`flex items-center gap-3 min-w-0 ${
                            isCollapsed ? 'lg:justify-center' : ''
                          }`}
                        >
                          <Icon
                            className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-emerald-400'
                            }`}
                          />
                          <span
                            className={`truncate ${
                              isCollapsed ? 'lg:hidden' : 'block'
                            }`}
                          >
                            {link.name}
                          </span>
                        </div>

                        {/* Badge counter (real data only) */}
                        {link.badge !== undefined && (
                          <>
                            {/* Expanded badge */}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                link.badgeColor
                              } ${isCollapsed ? 'lg:hidden' : 'inline-block'}`}
                            >
                              {link.badge}
                            </span>

                            {/* Collapsed dot badge indicator */}
                            {isCollapsed && (
                              <span className="hidden lg:block absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-juw-navy-950 animate-pulse" />
                            )}
                          </>
                        )}
                      </NavLink>

                      {/* Tooltip in desktop collapsed mode */}
                      {isCollapsed && (
                        <div
                          role="tooltip"
                          className="hidden lg:group-hover:flex lg:group-focus-within:flex items-center gap-2 absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl border border-slate-700/80 pointer-events-none z-50 whitespace-nowrap animate-fade-in"
                        >
                          <span>{link.name}</span>
                          {link.badge !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${link.badgeColor}`}
                            >
                              {link.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Anchored Footer Section ─── */}
        <div className="shrink-0 p-3 border-t border-slate-800/80 bg-juw-navy-900/80 space-y-2.5">
          {/* Public Storefront Link Button */}
          <Link
            to="/"
            title="Switch to Public Marketplace"
            className={`flex items-center rounded-xl bg-emerald-950/90 hover:bg-emerald-900/90 border border-emerald-600/30 text-emerald-300 font-semibold transition-all duration-150 ${
              isCollapsed
                ? 'lg:justify-center lg:h-[40px] lg:px-0 p-2.5 justify-between text-xs'
                : 'p-2.5 justify-between text-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className="w-[17px] h-[17px] shrink-0 text-emerald-400" />
              <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                Public Storefront
              </span>
            </div>
            <ExternalLink
              className={`w-3.5 h-3.5 text-emerald-400/80 shrink-0 ${
                isCollapsed ? 'lg:hidden' : 'block'
              }`}
            />
          </Link>

          {/* Admin Operations Card (when expanded) */}
          <div
            className={`items-center gap-2.5 px-1 text-xs ${
              isCollapsed ? 'lg:hidden flex' : 'flex'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-[11px] shrink-0">
              JUW
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-white text-[11px] block truncate leading-tight">
                Admin Control Desk
              </span>
              <span className="text-[10px] text-slate-400 block truncate leading-tight">
                ORIC & Incubation
              </span>
            </div>
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (72px)'}
            className={`hidden lg:flex items-center w-full rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer text-xs font-medium ${
              isCollapsed
                ? 'justify-center h-[36px] px-0'
                : 'justify-between px-2.5 py-1.5'
            }`}
          >
            <span className={`${isCollapsed ? 'sr-only' : 'block'}`}>
              Collapse Sidebar
            </span>
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
