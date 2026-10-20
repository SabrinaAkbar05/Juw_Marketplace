import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Store,
  Mail,
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Ban,
  Clock,
  Sparkles,
  ChevronDown,
  Shield,
  FileCheck,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminUserRecord, SellerRecord, CustomerRecord, AdminInvitation, SellerInvitation } from '../../types';
import { Button } from '../../components/common/Button';
import { AddSellerModal } from './user-management/AddSellerModal';
import { AddAdminModal } from './user-management/AddAdminModal';
import { EditUserModal } from './user-management/EditUserModal';
import { UserProfileModal } from './user-management/UserProfileModal';
import { ConfirmActionModal } from './user-management/ConfirmActionModal';
import { AuditLogModal } from './user-management/AuditLogModal';

type UserTab = 'all' | 'customers' | 'sellers' | 'administrators' | 'applications' | 'invitations';

export const AdminUserManagement: React.FC = () => {
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const {
    users,
    customers,
    sellers,
    adminInvitations,
    sellerInvitations,
    auditLogs,
    currentUser,
    refreshRemote,
    updateUserStatus,
    revokeUserRole,
    cancelInvitation,
    verifySeller,
  } = useAdmin();

  const activeTab: UserTab = useMemo(() => {
    if (urlTab === 'customers') return 'customers';
    if (urlTab === 'sellers') return 'sellers';
    if (urlTab === 'administrators') return 'administrators';
    if (urlTab === 'applications') return 'applications';
    if (urlTab === 'invitations') return 'invitations';
    return 'all';
  }, [urlTab]);

  const handleTabChange = (newTab: UserTab) => {
    if (newTab === 'all') navigate('/admin/users');
    else navigate(`/admin/users/${newTab}`);
  };

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Modals state
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'primary' | 'emerald';
    requiresReason?: boolean;
    onConfirm: (reason?: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    onConfirm: async () => {},
  });

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync data refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRemote();
    setIsRefreshing(false);
  };

  // Build unified user directory combining users, customers, and sellers
  const unifiedUsers = useMemo(() => {
    const userMap = new Map<string, any>();

    // 1. Base customers
    for (const c of customers) {
      const uid = c.uid || c.id;
      userMap.set(uid, {
        id: uid,
        uid: uid,
        name: c.name,
        email: c.email,
        phone: c.phone,
        departmentOrAffiliation: c.departmentOrAffiliation,
        role: c.role || 'STUDENT',
        status: c.status || 'ACTIVE',
        joinedDate: c.joinedDate,
        createdAt: c.createdAt || c.joinedDate,
        customerRecord: c,
      });
    }

    // 2. Overlay admin users
    for (const u of users) {
      const uid = u.uid || u.id;
      const existing = userMap.get(uid);
      userMap.set(uid, {
        ...existing,
        ...u,
        id: uid,
        uid: uid,
        name: u.name || existing?.name || 'Administrator',
        email: u.email || existing?.email || '',
        role: u.role || 'ADMIN',
        status: u.status || existing?.status || 'ACTIVE',
      });
    }

    // 3. Overlay sellers
    for (const s of sellers) {
      const uid = s.firebaseUid;
      if (uid) {
        const existing = userMap.get(uid);
        userMap.set(uid, {
          ...existing,
          id: existing?.id || s.id,
          uid: uid,
          name: s.studentName || existing?.name,
          email: s.contactEmail || existing?.email,
          phone: s.contactPhone || existing?.phone,
          departmentOrAffiliation: s.department || existing?.departmentOrAffiliation,
          role: existing?.role === 'SUPER_ADMIN' || existing?.role === 'ADMIN' ? existing.role : 'SELLER',
          status: s.verificationStatus === 'SUSPENDED' ? 'SUSPENDED' : (existing?.status || 'ACTIVE'),
          sellerRecord: s,
        });
      }
    }

    return Array.from(userMap.values());
  }, [users, customers, sellers]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    unifiedUsers.forEach((u) => {
      if (u.departmentOrAffiliation) set.add(u.departmentOrAffiliation);
    });
    return Array.from(set).sort();
  }, [unifiedUsers]);

  // Tab filtering
  const filteredUsers = useMemo(() => {
    return unifiedUsers.filter((u) => {
      // Tab check
      if (activeTab === 'customers' && u.role !== 'STUDENT' && u.role !== 'CUSTOMER') return false;
      if (activeTab === 'sellers' && !u.sellerRecord && u.role !== 'SELLER') return false;
      if (activeTab === 'administrators' && u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') return false;

      // Status filter
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

      // Department filter
      if (departmentFilter !== 'ALL' && u.departmentOrAffiliation !== departmentFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (u.name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesDept = (u.departmentOrAffiliation || '').toLowerCase().includes(q);
        const matchesUid = (u.uid || '').toLowerCase().includes(q);
        const matchesStore = (u.sellerRecord?.storeName || '').toLowerCase().includes(q);
        const matchesRoll = (u.sellerRecord?.studentRollNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesUid && !matchesStore && !matchesRoll) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedUsers, activeTab, statusFilter, departmentFilter, searchTerm]);

  // Pending applications
  const pendingApplications = useMemo(() => {
    return sellers.filter((s) => s.verificationStatus === 'PENDING_VERIFICATION');
  }, [sellers]);

  // Combined invitations list
  const allInvitations = useMemo(() => {
    const list: Array<
      (AdminInvitation | SellerInvitation) & { invCategory: 'ADMIN' | 'SELLER' }
    > = [
      ...adminInvitations.map((i) => ({ ...i, invCategory: 'ADMIN' as const })),
      ...sellerInvitations.map((i) => ({ ...i, invCategory: 'SELLER' as const })),
    ];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [adminInvitations, sellerInvitations]);

  // Action handlers
  const handleToggleStatus = (user: any) => {
    const isCurrentlySuspended = user.status === 'SUSPENDED';
    const nextStatus = isCurrentlySuspended ? 'ACTIVE' : 'SUSPENDED';

    setConfirmConfig({
      isOpen: true,
      title: `${isCurrentlySuspended ? 'Reactivate' : 'Suspend'} User Account`,
      message: isCurrentlySuspended
        ? `Are you sure you want to reactivate access for ${user.name} (${user.email})? They will immediately regain marketplace privileges.`
        : `Are you sure you want to suspend access for ${user.name} (${user.email})? Their sessions will be invalidated, listed items will be temporarily unavailable, and they will be barred from backend access.`,
      confirmLabel: isCurrentlySuspended ? 'Reactivate User' : 'Suspend User',
      confirmVariant: isCurrentlySuspended ? 'emerald' : 'danger',
      requiresReason: !isCurrentlySuspended,
      onConfirm: async (reason) => {
        await updateUserStatus(user.uid || user.id, nextStatus, reason);
      },
    });
  };

  const handleRevokeRole = (user: any) => {
    const roleToRevoke = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? user.role : 'SELLER';
    setConfirmConfig({
      isOpen: true,
      title: `Revoke ${roleToRevoke} Privileges`,
      message: `Are you sure you want to revoke ${roleToRevoke} status for ${user.name} (${user.email})? Their permissions and custom claims will be permanently stripped and reverted to regular student status.`,
      confirmLabel: 'Revoke Role',
      confirmVariant: 'danger',
      requiresReason: true,
      onConfirm: async () => {
        await revokeUserRole(user.uid || user.id, roleToRevoke);
      },
    });
  };

  const handleCancelInvitation = (inv: (AdminInvitation | SellerInvitation) & { invCategory: 'ADMIN' | 'SELLER' }) => {
    const type = inv.invCategory === 'ADMIN' ? 'admin' : 'seller';
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Invitation',
      message: `Are you sure you want to revoke the invitation token for ${inv.email}? The link will immediately expire.`,
      confirmLabel: 'Cancel Invitation',
      confirmVariant: 'danger',
      onConfirm: async () => {
        await cancelInvitation(type, inv.id);
      },
    });
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invitation/accept?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-900 mb-2">
            <Shield className="w-3.5 h-3.5 text-indigo-700" />
            <span>JUW University Administration • Role & Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            User & Role Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Govern registered patrons, verified student creators, administrators, and pending invitation tokens across JUW Marketplace.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuditModalOpen(true)}
            leftIcon={<History className="w-3.5 h-3.5 text-slate-600" />}
          >
            Audit Trail ({auditLogs.length})
          </Button>

          {/* Add User Dropdown */}
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
            >
              Add User
            </Button>

            {isAddMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsAddMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-2 space-y-1 animate-fade-in">
                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setIsAddSellerOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 transition-colors flex items-center gap-2.5 text-xs font-bold cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <span>Add Seller</span>
                      <span className="block text-[10px] font-normal text-slate-400">
                        Student store onboarding
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setIsAddAdminOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 transition-colors flex items-center gap-2.5 text-xs font-bold cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span>Add Administrator</span>
                      <span className="block text-[10px] font-normal text-slate-400">
                        Super Admin privileged
                      </span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => handleTabChange('all')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-juw-navy-700 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Users
          </span>
          <span className="text-xl font-extrabold text-slate-900 block mt-1">
            {unifiedUsers.length}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Across all roles</span>
        </div>

        <div
          onClick={() => handleTabChange('customers')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-juw-navy-700 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Customers
          </span>
          <span className="text-xl font-extrabold text-slate-900 block mt-1">
            {customers.length}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Patrons & buyers</span>
        </div>

        <div
          onClick={() => handleTabChange('sellers')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-700 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Student Sellers
          </span>
          <span className="text-xl font-extrabold text-emerald-800 block mt-1">
            {sellers.length}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Campus stores</span>
        </div>

        <div
          onClick={() => handleTabChange('administrators')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-700 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
            Administrators
          </span>
          <span className="text-xl font-extrabold text-indigo-900 block mt-1">
            {users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length || 1}
          </span>
          <span className="text-[10px] text-indigo-600 font-medium">Staff & Super Admins</span>
        </div>

        <div
          onClick={() => handleTabChange('applications')}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            pendingApplications.length > 0
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
            Applications
          </span>
          <span className="text-xl font-extrabold text-amber-900 block mt-1">
            {pendingApplications.length}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">Needs verification</span>
        </div>

        <div
          onClick={() => handleTabChange('invitations')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-700 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            Invitations
          </span>
          <span className="text-xl font-extrabold text-blue-900 block mt-1">
            {allInvitations.filter((i) => i.status === 'PENDING').length}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Pending links</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Users', count: unifiedUsers.length },
          { id: 'customers', label: 'Customers', count: customers.length },
          { id: 'sellers', label: 'Sellers', count: sellers.length },
          {
            id: 'administrators',
            label: 'Administrators',
            count: users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length || 1,
          },
          {
            id: 'applications',
            label: 'Seller Applications',
            count: pendingApplications.length,
            badgeColor: pendingApplications.length > 0 ? 'bg-amber-500 text-white' : undefined,
          },
          {
            id: 'invitations',
            label: 'Invitations & Pending',
            count: allInvitations.filter((i) => i.status === 'PENDING').length,
            badgeColor: 'bg-blue-500 text-white',
          },
        ].map((tabItem) => {
          const isActive = activeTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => handleTabChange(tabItem.id as UserTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-juw-navy-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tabItem.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tabItem.badgeColor || 'bg-slate-200 text-slate-700'
                }`}
              >
                {tabItem.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Applications View */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Pending Student Seller Applications
            </h3>
            <span className="text-xs text-slate-500">
              {pendingApplications.length} awaiting ID verification
            </span>
          </div>

          {pendingApplications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <FileCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Verification Queue Cleared</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No students are currently waiting for seller verification. All applications have been processed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApplications.map((seller) => (
                <div
                  key={seller.id}
                  className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-card space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold">
                        Pending Verification
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {seller.studentName}
                      </h4>
                      <p className="text-xs font-mono font-bold text-emerald-700">
                        Roll: {seller.studentRollNumber}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {seller.sellerCode}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <strong className="text-slate-800">{seller.department}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Semester:</span>
                      <span className="text-slate-700">{seller.semester}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Store Name:</span>
                      <strong className="text-emerald-800">{seller.storeName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="text-slate-700">{seller.contactPhone || seller.contactEmail}</span>
                    </div>
                    {seller.storeDescription && (
                      <p className="pt-1.5 text-slate-600 text-[11px] border-t border-slate-200">
                        "{seller.storeDescription}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUserForProfile(unifiedUsers.find((u) => u.uid === seller.firebaseUid) || seller)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => verifySeller(seller.id)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve & Verify ID
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Invitations View */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Invitations & Pending Registrations
            </h3>
            <span className="text-xs text-slate-500">
              {allInvitations.length} total invitations recorded
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Invited Member</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Invitation Status</th>
                    <th className="p-4">Invited By</th>
                    <th className="p-4">Expires In</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No invitations recorded in the database.
                      </td>
                    </tr>
                  ) : (
                    allInvitations.map((inv) => {
                      const isPending = inv.status === 'PENDING';
                      const isAccepted = inv.status === 'ACCEPTED';
                      const isCancelled = inv.status === 'CANCELLED';
                      const hasCopiedThis = copiedToken === inv.token;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4">
                            <strong className="font-bold text-slate-900 block text-sm">
                              {inv.fullName}
                            </strong>
                            <span className="text-slate-500 text-xs block">{inv.email}</span>
                            {'storeName' in inv && (
                              <span className="text-emerald-700 font-medium text-[11px] block mt-0.5">
                                Store: {inv.storeName}
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                inv.invCategory === 'ADMIN'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {inv.invCategory === 'ADMIN' ? (
                                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                              ) : (
                                <Store className="w-3 h-3 text-emerald-600" />
                              )}
                              <span>{'role' in inv ? inv.role : 'STUDENT SELLER'}</span>
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-block font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border ${
                                isAccepted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isPending
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : isCancelled
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>

                          <td className="p-4 text-slate-600">
                            <span className="block font-medium">{inv.createdByEmail}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="text-slate-600 text-[11px] flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <Button
                                    variant={hasCopiedThis ? 'emerald' : 'outline'}
                                    size="sm"
                                    onClick={() => handleCopyInviteLink(inv.token)}
                                    leftIcon={
                                      hasCopiedThis ? (
                                        <Check className="w-3.5 h-3.5" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )
                                    }
                                  >
                                    {hasCopiedThis ? 'Copied' : 'Link'}
                                  </Button>

                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleCancelInvitation(inv)}
                                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: User Directory (All, Customers, Sellers, Administrators) */}
      {(activeTab === 'all' ||
        activeTab === 'customers' ||
        activeTab === 'sellers' ||
        activeTab === 'administrators') && (
        <div className="space-y-4">
          {/* Search & Filters Controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by name, email, roll #, store, UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-juw-navy-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DISABLED">Disabled</option>
              </select>

              {/* Department filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-juw-navy-900 max-w-[180px] truncate"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {(searchTerm || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setDepartmentFilter('ALL');
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}

              <span className="text-xs text-slate-400 font-medium hidden sm:inline ml-2">
                {filteredUsers.length} matches
              </span>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">User & Contact</th>
                    <th className="p-4">System Role</th>
                    <th className="p-4">Department / Affiliation</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Activity Metrics</th>
                    <th className="p-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 text-xs">
                        No user accounts found matching current query or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => {
                      const isSuper = usr.role === 'SUPER_ADMIN';
                      const isAdmin = usr.role === 'ADMIN';
                      const isSeller = usr.role === 'SELLER' || !!usr.sellerRecord;
                      const isSuspended = usr.status === 'SUSPENDED';

                      return (
                        <tr key={usr.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                                  isSuper
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : isAdmin
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                    : isSeller
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {(usr.name || usr.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className="font-bold text-slate-900 block text-sm">
                                  {usr.name}
                                </strong>
                                <span className="text-slate-500 text-xs block">{usr.email}</span>
                                {usr.sellerRecord && (
                                  <span className="text-emerald-700 font-mono text-[10px] font-bold block">
                                    Roll: {usr.sellerRecord.studentRollNumber} • {usr.sellerRecord.storeName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-full text-[10px] border ${
                                isSuper
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : isAdmin
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : isSeller
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isSuper ? (
                                <ShieldCheck className="w-3 h-3 text-purple-700" />
                              ) : isAdmin ? (
                                <Shield className="w-3 h-3 text-indigo-700" />
                              ) : isSeller ? (
                                <Store className="w-3 h-3 text-emerald-700" />
                              ) : (
                                <Users className="w-3 h-3 text-slate-500" />
                              )}
                              <span>{usr.role}</span>
                            </span>
                          </td>

                          <td className="p-4 text-slate-700">
                            <span className="font-medium block">{usr.departmentOrAffiliation || 'General Patron'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              UID: {(usr.uid || usr.id).slice(0, 10)}...
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-block font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border ${
                                usr.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : usr.status === 'SUSPENDED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {usr.status}
                            </span>
                          </td>

                          <td className="p-4">
                            {usr.sellerRecord ? (
                              <div className="text-slate-800 font-semibold">
                                <span>{usr.sellerRecord.totalProductsListed} items</span>
                                <span className="block text-[11px] text-emerald-700 font-extrabold">
                                  Rs. {usr.sellerRecord.lifetimeRevenue.toLocaleString()}
                                </span>
                              </div>
                            ) : usr.customerRecord ? (
                              <div className="text-slate-800 font-semibold">
                                <span>{usr.customerRecord.totalOrders} orders</span>
                                <span className="block text-[11px] text-slate-500">
                                  Rs. {usr.customerRecord.totalSpent.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Standard</span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUserForProfile(usr)}
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                              >
                                View
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedUserForEdit(usr)}
                                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                              >
                                Edit
                              </Button>

                              <Button
                                variant={isSuspended ? 'emerald' : 'outline'}
                                size="sm"
                                onClick={() => handleToggleStatus(usr)}
                                leftIcon={isSuspended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5 text-rose-600" />}
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </Button>

                              {(isAdmin || isSuper || isSeller) && (
                                <button
                                  onClick={() => handleRevokeRole(usr)}
                                  title="Revoke Role"
                                  className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddSellerModal
        isOpen={isAddSellerOpen}
        onClose={() => setIsAddSellerOpen(false)}
        onSuccess={() => refreshRemote()}
      />

      <AddAdminModal
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        onSuccess={() => refreshRemote()}
      />

      <EditUserModal
        isOpen={!!selectedUserForEdit}
        user={selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        onSuccess={() => refreshRemote()}
      />

      <UserProfileModal
        isOpen={!!selectedUserForProfile}
        user={selectedUserForProfile}
        onClose={() => setSelectedUserForProfile(null)}
        onEdit={() => {
          setSelectedUserForEdit(selectedUserForProfile);
          setSelectedUserForProfile(null);
        }}
        onToggleStatus={() => {
          const u = selectedUserForProfile;
          setSelectedUserForProfile(null);
          handleToggleStatus(u);
        }}
        onRevokeRole={() => {
          const u = selectedUserForProfile;
          setSelectedUserForProfile(null);
          handleRevokeRole(u);
        }}
      />

      <ConfirmActionModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        confirmVariant={confirmConfig.confirmVariant}
        requiresReason={confirmConfig.requiresReason}
        onConfirm={confirmConfig.onConfirm}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={auditLogs}
      />
    </div>
  );
};
