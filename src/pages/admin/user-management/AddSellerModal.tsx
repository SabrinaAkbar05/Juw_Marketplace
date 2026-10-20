import React, { useState, useEffect } from 'react';
import { Store, Mail, UserCheck, Copy, Check, Search, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { useAdmin } from '../../../context/AdminContext';
import { AddSellerPayload, UserSearchResult } from '../../../types';

interface AddSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const JUW_DEPARTMENTS = [
  'Department of Computer Science & Information Technology',
  'Department of Software Engineering',
  'Department of Visual Studies & Textile Design',
  'Department of Business Administration (BBA)',
  'Department of Biochemistry & Biotechnology',
  'Department of Food Science & Technology',
  'Department of Pharmacy (Pharm-D)',
  'Department of Media Studies & Mass Communication',
  'Department of Fashion Design',
  'Department of Education',
];

export const AddSellerModal: React.FC<AddSellerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addSeller, searchExistingUsers } = useAdmin();

  const [method, setMethod] = useState<'INVITE' | 'EXISTING_USER'>('INVITE');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentRollNumber, setStudentRollNumber] = useState('');
  const [department, setDepartment] = useState(JUW_DEPARTMENTS[0]);
  const [semester, setSemester] = useState('5th Semester');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'PENDING_VERIFICATION'>('VERIFIED');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMethod('INVITE');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setFullName('');
      setEmail('');
      setStudentRollNumber('');
      setDepartment(JUW_DEPARTMENTS[0]);
      setSemester('5th Semester');
      setPhone('');
      setStoreName('');
      setStoreDescription('');
      setVerificationStatus('VERIFIED');
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
    if (user.phone) setPhone(user.phone);
    if (user.department) setDepartment(user.department);
    if (!storeName) setStoreName(`${user.name}'s Studio`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !storeName.trim()) {
      setError('Full Name, Email, and Store Name are mandatory.');
      return;
    }

    if (method === 'EXISTING_USER' && !selectedUser) {
      setError('Please search and select an existing account first.');
      return;
    }

    const payload: AddSellerPayload = {
      onboardingMethod: method,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      studentRollNumber: studentRollNumber.trim() || 'JUW-' + Date.now().toString().slice(-4),
      department: department.trim(),
      semester: semester.trim(),
      phone: phone.trim(),
      storeName: storeName.trim(),
      storeDescription: storeDescription.trim(),
      verificationStatus,
      existingUid: selectedUser?.uid,
    };

    setIsLoading(true);
    try {
      const res = await addSeller(payload);
      if (res.invitation) {
        const link = `${window.location.origin}/invitation/accept?token=${res.invitation.token}`;
        setCreatedInviteLink(link);
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to onboard seller.');
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
          <Store className="w-5 h-5 text-emerald-700" />
          <span>Onboard New Student Seller</span>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="p-6">
        {createdInviteLink ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Seller Invitation Generated!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              An invitation has been created for <strong className="text-slate-800">{email}</strong>. Share the secure registration link below with the student creator.
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
                    ? 'bg-white text-emerald-800 shadow-xs'
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
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Existing Firebase Account</span>
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
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
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
                        className={`w-full text-left p-2.5 text-xs hover:bg-emerald-50/60 transition-colors flex items-center justify-between cursor-pointer ${
                          selectedUser?.uid === usr.uid ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''
                        }`}
                      >
                        <div>
                          <strong className="font-bold text-slate-900 block">{usr.name}</strong>
                          <span className="text-slate-500 text-[11px]">{usr.email}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                            {usr.isSeller ? 'Already Seller' : 'Patron'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="text-xs text-emerald-800 bg-emerald-50/80 p-2 rounded-lg font-medium flex items-center justify-between">
                    <span>Selected: <strong>{selectedUser.name}</strong> ({selectedUser.email})</span>
                    <span className="font-mono text-[10px] text-emerald-600">UID: {selectedUser.uid.slice(0, 10)}...</span>
                  </div>
                )}
              </div>
            )}

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ayesha Siddiqui"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
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
                  placeholder="student@juw.edu.pk or personal email"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Roll Number
                </label>
                <input
                  type="text"
                  value={studentRollNumber}
                  onChange={(e) => setStudentRollNumber(e.target.value)}
                  placeholder="e.g. 2022/JUW/CS/042"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Faculty
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {JUW_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester', 'Graduate / Alumni'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Store Information */}
            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Storefront Setup
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store / Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Ayesha Handcrafts"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Verification Status
                  </label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold text-emerald-800"
                  >
                    <option value="VERIFIED">Verified (Direct Publishing Access)</option>
                    <option value="PENDING_VERIFICATION">Pending Verification (Review Queue)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Description
                </label>
                <textarea
                  rows={2}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Short summary of student products, craft specialization, or campus studio..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="emerald"
                size="sm"
                type="submit"
                isLoading={isLoading}
                leftIcon={<Store className="w-3.5 h-3.5" />}
              >
                {method === 'INVITE' ? 'Generate Invitation Link' : 'Onboard Seller Account'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
