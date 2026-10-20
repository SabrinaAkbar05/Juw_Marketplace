import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, UserCheck, Copy, Check, Search, AlertCircle, ShieldAlert } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { useAdmin } from '../../../context/AdminContext';
import { AddAdminPayload, UserSearchResult } from '../../../types';

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PERMISSION_OPTIONS = [
  { id: 'products', label: 'Product Approvals & Stock Moderation' },
  { id: 'orders', label: 'Orders & Fulfillment Oversight' },
  { id: 'support', label: 'Support Disputes & Customer Inquiries' },
  { id: 'sellers', label: 'Seller Verification & Registry' },
  { id: 'customers', label: 'Customer Management' },
  { id: 'settings', label: 'Marketplace Configuration & Rates' },
];

export const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addAdministrator, searchExistingUsers, currentUser } = useAdmin();

  const isSuperAdmin = currentUser?.isSuperAdmin ?? true;

  const [method, setMethod] = useState<'INVITE' | 'EXISTING_USER'>('INVITE');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN'>('ADMIN');
  const [permissions, setPermissions] = useState<string[]>(['products', 'orders', 'support', 'sellers', 'customers']);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMethod('INVITE');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setFullName('');
      setEmail('');
      setRole('ADMIN');
      setPermissions(['products', 'orders', 'support', 'sellers', 'customers']);
      setError(null);
      setCreatedInviteLink(null);
      setHasCopied(false);
    }
  }, [isOpen]);

  // Live user search debounce
  useEffect(() => {
    if (method !== 'EXISTING_USER' || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchExistingUsers(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, method, searchExistingUsers]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setFullName(user.name);
    setEmail(user.email);
  };

  const togglePermission = (permId: string) => {
    if (permissions.includes(permId)) {
      setPermissions(permissions.filter((p) => p !== permId));
    } else {
      setPermissions([...permissions, permId]);
    }
  };

  const handleRoleChange = (newRole: 'SUPER_ADMIN' | 'ADMIN') => {
    setRole(newRole);
    if (newRole === 'SUPER_ADMIN') {
      setPermissions(['all']);
    } else if (permissions.includes('all')) {
      setPermissions(['products', 'orders', 'support', 'sellers', 'customers']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSuperAdmin) {
      setError('Action forbidden: Only authenticated Super Administrators can appoint administrative users.');
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setError('Full Name and Email are mandatory.');
      return;
    }

    if (method === 'EXISTING_USER' && !selectedUser) {
      setError('Please search and select an existing account first.');
      return;
    }

    const payload: AddAdminPayload = {
      onboardingMethod: method,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      permissions: role === 'SUPER_ADMIN' ? ['all'] : permissions,
      existingUid: selectedUser?.uid,
    };

    setIsLoading(true);
    try {
      const res = await addAdministrator(payload);
      if (res.invitation) {
        const link = `${window.location.origin}/invitation/accept?token=${res.invitation.token}`;
        setCreatedInviteLink(link);
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to appoint administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (createdInviteLink) {
      navigator.clipboard.writeText(createdInviteLink);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-700" />
          <span>Appoint Administrator</span>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="p-6">
        {!isSuperAdmin ? (
          <div className="p-6 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Restricted Privileges</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Only authorized <strong>Super Administrators</strong> have the authority to invite or appoint administrators in compliance with JUW IT Governance rules.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : createdInviteLink ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Administrator Invitation Generated!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              An invitation token for <strong className="text-slate-800">{email}</strong> with role{' '}
              <strong className="text-indigo-700">{role}</strong> has been secured in the database.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-mono text-slate-800 break-all select-all text-left">
              <span className="flex-1 truncate">{createdInviteLink}</span>
              <Button
                variant={hasCopied ? 'emerald' : 'outline'}
                size="sm"
                onClick={handleCopyLink}
                leftIcon={hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {hasCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="pt-4 flex justify-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMethod('INVITE')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  method === 'INVITE'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Invitation Link</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('EXISTING_USER')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  method === 'EXISTING_USER'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign Existing Account</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Existing User Search */}
            {method === 'EXISTING_USER' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Search Registered Accounts (Name, Email, or UID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type at least 2 letters..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {isSearching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      Searching...
                    </span>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm">
                    {searchResults.map((usr) => (
                      <button
                        key={usr.uid}
                        type="button"
                        onClick={() => handleSelectUser(usr)}
                        className={`w-full text-left p-2.5 text-xs hover:bg-indigo-50/60 transition-colors flex items-center justify-between cursor-pointer ${
                          selectedUser?.uid === usr.uid ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                        }`}
                      >
                        <div>
                          <strong className="font-bold text-slate-900 block">{usr.name}</strong>
                          <span className="text-slate-500 text-[11px]">{usr.email}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                            {usr.isAdmin ? `Admin (${usr.adminRole})` : 'User'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="text-xs text-indigo-800 bg-indigo-50/80 p-2 rounded-lg font-medium flex items-center justify-between">
                    <span>Selected: <strong>{selectedUser.name}</strong> ({selectedUser.email})</span>
                    <span className="font-mono text-[10px] text-indigo-600">UID: {selectedUser.uid.slice(0, 10)}...</span>
                  </div>
                )}
              </div>
            )}

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Siddiqui"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled={method === 'EXISTING_USER' && !!selectedUser}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@juw.edu.pk or administrator email"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                />
              </div>
            </div>

            {/* Role Choice */}
            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Administrative Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'ADMIN'
                      ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="adminRole"
                    checked={role === 'ADMIN'}
                    onChange={() => handleRoleChange('ADMIN')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div className="text-xs">
                    <strong className="block font-bold text-slate-900">Administrator</strong>
                    <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                      Operational moderation, product approvals, ticket resolution, and order management.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'SUPER_ADMIN'
                      ? 'bg-white border-purple-500 shadow-xs ring-1 ring-purple-500'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="adminRole"
                    checked={role === 'SUPER_ADMIN'}
                    onChange={() => handleRoleChange('SUPER_ADMIN')}
                    className="mt-0.5 text-purple-600"
                  />
                  <div className="text-xs">
                    <strong className="block font-bold text-purple-900 flex items-center gap-1">
                      Super Administrator <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">Full Access</span>
                    </strong>
                    <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                      Complete governance, appointing or revoking admins, marketplace rate settings, and system security.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Granular Permissions (if regular Admin) */}
            {role === 'ADMIN' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Assigned Operational Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERMISSION_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(opt.id)}
                        onChange={() => togglePermission(opt.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isLoading}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
              >
                {method === 'INVITE' ? 'Generate Admin Invitation' : 'Assign Admin Role'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
