import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  CheckCheck,
  Search,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/common/Button';

export const AdminNotifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsRead } = useAdmin();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'ALL' && n.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            System Notification & Audit Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time event logging across product submissions, dispute escalations, and fulfillment triggers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={markAllNotificationsRead}
          leftIcon={<CheckCheck className="w-4 h-4 text-emerald-700" />}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        {['ALL', 'APPROVAL_REQUEST', 'SUPPORT_DISPUTE', 'NEW_ORDER', 'SYSTEM'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filterType === t
                ? 'bg-juw-navy-900 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t === 'ALL'
              ? 'All Events'
              : t === 'APPROVAL_REQUEST'
              ? 'Approvals'
              : t === 'SUPPORT_DISPUTE'
              ? 'Disputes'
              : t === 'NEW_ORDER'
              ? 'Orders'
              : 'System'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => markNotificationAsRead(notif.id)}
            className={`p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
              !notif.read ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-white hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {notif.type === 'APPROVAL_REQUEST' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {notif.type === 'SUPPORT_DISPUTE' && (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {notif.type === 'NEW_ORDER' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                )}
                {notif.type === 'SYSTEM' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="font-bold text-xs text-slate-900">{notif.title}</strong>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  {notif.message}
                </p>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
              {notif.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
