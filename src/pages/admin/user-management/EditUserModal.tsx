import React, { useState, useEffect } from 'react';
import { Edit3, AlertCircle, Save } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { useAdmin } from '../../../context/AdminContext';
import { AdminUserRecord, SellerRecord } from '../../../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: (AdminUserRecord & { sellerRecord?: SellerRecord }) | null;
  onSuccess?: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const { updateUserDetails } = useAdmin();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDepartment(user.departmentOrAffiliation || '');
      setStoreName(user.sellerRecord?.storeName || '');
      setStoreDescription(user.sellerRecord?.storeDescription || '');
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await updateUserDetails(user.uid || user.id, {
        name: name.trim(),
        phone: phone.trim(),
        department: department.trim(),
        storeName: user.sellerRecord ? storeName.trim() : undefined,
        storeDescription: user.sellerRecord ? storeDescription.trim() : undefined,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-juw-navy-900" />
          <span>Edit Account Profile</span>
        </div>
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 block">{user.email}</span>
            <span className="text-[10px] text-slate-400 font-mono">UID: {user.uid || user.id}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
            {user.role}
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900 focus:bg-white"
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
            placeholder="+92 300 0000000"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Department / University Affiliation
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Department of Computer Science & IT"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900 focus:bg-white"
          />
        </div>

        {user.sellerRecord && (
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-emerald-900">
              Student Store Details
            </h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store Description
              </label>
              <textarea
                rows={2}
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading} leftIcon={<Save className="w-3.5 h-3.5" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
