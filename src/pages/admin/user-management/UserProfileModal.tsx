import React from 'react';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Store,
  Shield,
  ShieldCheck,
  Calendar,
  Clock,
  Key,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { AdminUserRecord, SellerRecord, CustomerRecord } from '../../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: (AdminUserRecord & { sellerRecord?: SellerRecord; customerRecord?: CustomerRecord }) | null;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  onRevokeRole?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onEdit,
  onToggleStatus,
  onRevokeRole,
}) => {
  if (!user) return null;

  const isSuspended = user.status === 'SUSPENDED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-juw-navy-900" />
          <span>User Account File & Security Profile</span>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="p-6 space-y-5">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-juw-navy-900 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                {user.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                user.role === 'SUPER_ADMIN'
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : user.role === 'ADMIN'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  : user.role === 'SELLER'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              {user.role}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                user.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : user.status === 'SUSPENDED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {user.status}
            </span>
          </div>
        </div>

        {/* Identity & Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Firebase Auth UID
            </span>
            <span className="font-mono text-slate-800 break-all select-all block">
              {user.uid || user.id}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Contact Phone
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {user.phone || 'Not registered'}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Department / Affiliation
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              {user.departmentOrAffiliation || 'General Patron'}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Member Since
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Seller Info if applicable */}
        {user.sellerRecord && (
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-700" />
                Verified Student Creator File
              </h4>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                {user.sellerRecord.sellerCode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Roll Number</span>
                <span className="font-bold text-slate-800">{user.sellerRecord.studentRollNumber}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Store Name</span>
                <span className="font-bold text-slate-800">{user.sellerRecord.storeName}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Products Listed</span>
                <span className="font-bold text-slate-800">{user.sellerRecord.totalProductsListed}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Lifetime Revenue</span>
                <span className="font-extrabold text-emerald-700">
                  Rs. {user.sellerRecord.lifetimeRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            {user.sellerRecord.storeDescription && (
              <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-emerald-100">
                {user.sellerRecord.storeDescription}
              </p>
            )}
          </div>
        )}

        {/* Customer Patron Info if applicable */}
        {user.customerRecord && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Patron Activity:</span>
            <div className="flex gap-4">
              <span>
                Orders: <strong>{user.customerRecord.totalOrders}</strong>
              </span>
              <span>
                Spend:{' '}
                <strong className="text-emerald-700">
                  Rs. {user.customerRecord.totalSpent.toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Administrative Permissions if Admin */}
        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              Administrative Permissions & Scope
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(user.permissions || ['all']).map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-[11px] font-semibold text-indigo-800"
                >
                  {p}
                </span>
              ))}
            </div>
            {user.roleAssignedBy && (
              <p className="text-[11px] text-slate-500 mt-1">
                Assigned by <strong>{user.roleAssignedBy}</strong> on{' '}
                {user.roleAssignedAt ? new Date(user.roleAssignedAt).toLocaleDateString() : 'N/A'}
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {onToggleStatus && (
              <Button
                variant={isSuspended ? 'emerald' : 'danger'}
                size="sm"
                onClick={onToggleStatus}
              >
                {isSuspended ? 'Reactivate Account' : 'Suspend Account'}
              </Button>
            )}
            {onRevokeRole && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'SELLER') && (
              <Button variant="outline" size="sm" onClick={onRevokeRole}>
                Revoke Role
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                Edit Details
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
