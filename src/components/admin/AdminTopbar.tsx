import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Store,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../common/Button';

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onOpenMobileSidebar,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const { notifications, markNotificationAsRead, markAllNotificationsRead } = useAdmin();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getPageInfo = (pathname: string) => {
    if (pathname === '/admin') return { title: 'Executive Overview', section: 'Overview' };
    if (pathname.startsWith('/admin/approvals')) return { title: 'Product Moderation & Approvals', section: 'Operations' };
    if (pathname.startsWith('/admin/categories')) return { title: 'Category Taxonomy Management', section: 'Catalog' };
    if (pathname.startsWith('/admin/products')) return { title: 'Product Catalog & Inventory', section: 'Catalog' };
    if (pathname.startsWith('/admin/orders')) return { title: 'Orders & Fulfillment Center', section: 'Operations' };
    if (pathname.startsWith('/admin/support')) return { title: 'Dispute & Support Resolution Desk', section: 'Customer Support' };
    if (pathname.startsWith('/admin/reviews')) return { title: 'Product Reviews & Ratings Moderation', section: 'Operations' };
    if (pathname.startsWith('/admin/users/sellers')) return { title: 'Student Sellers Registry (Confidential)', section: 'Users' };
    if (pathname.startsWith('/admin/users/customers')) return { title: 'Customer Registry Directory', section: 'Users' };
    if (pathname.startsWith('/admin/users/administrators')) return { title: 'Administrator Roles & Permissions', section: 'Security' };
    if (pathname.startsWith('/admin/users/applications')) return { title: 'Student Seller Verification Applications', section: 'Users' };
    if (pathname.startsWith('/admin/users/invitations')) return { title: 'Staff & Seller Access Invitations', section: 'Security' };
    if (pathname === '/admin/users') return { title: 'All Registered Marketplace Accounts', section: 'Users' };
    if (pathname.startsWith('/admin/analytics')) return { title: 'Marketplace Performance Analytics', section: 'Analytics' };
    if (pathname.startsWith('/admin/notifications')) return { title: 'System Activity & Audit Logs', section: 'Audit' };
    if (pathname.startsWith('/admin/settings')) return { title: 'Marketplace Global Configuration', section: 'Settings' };
    return { title: 'Admin Control Desk', section: 'Management' };
  };

  const pageInfo = getPageInfo(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 sm:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-200">
      {/* Left: Mobile hamburger & Page Breadcrumb/Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
            <span className="hidden sm:inline">JUW Administration</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-emerald-700 font-semibold uppercase tracking-wider">{pageInfo.section}</span>
            <span>/</span>
            <span className="text-slate-600 truncate">{pageInfo.title}</span>
          </div>
          <h1 className="text-sm sm:text-base lg:text-lg font-bold font-display text-slate-900 leading-tight truncate">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: Quick actions & Notifications */}
      <div className="flex items-center gap-3">
        {/* Public Storefront Link Button */}
        <Link to="/" className="hidden sm:inline-flex">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Store className="w-4 h-4 text-emerald-700" />}
            rightIcon={<ExternalLink className="w-3 h-3 text-slate-400" />}
          >
            Public Marketplace
          </Button>
        </Link>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-40 animate-fade-in">
                <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-display text-slate-900">
                      System Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                        n.read ? 'bg-white opacity-70' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'APPROVAL_REQUEST' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        )}
                        {n.type === 'SUPPORT_DISPUTE' && (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        {n.type === 'NEW_ORDER' && (
                          <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        )}
                        {n.type === 'SYSTEM' && (
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <strong className="font-bold text-slate-900 truncate">{n.title}</strong>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 px-4 border-t border-slate-100 text-center">
                  <Link
                    to="/admin/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    View All Activity Logs →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-juw-navy-900 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
            A
          </div>
          <div className="hidden md:block text-left text-xs">
            <span className="font-bold text-slate-900 block leading-tight">ORIC Admin</span>
            <span className="text-[10px] text-emerald-700 font-semibold block">University Staff</span>
          </div>
        </div>
      </div>
    </header>
  );
};
