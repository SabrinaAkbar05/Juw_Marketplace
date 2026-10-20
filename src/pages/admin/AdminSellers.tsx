import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { SellerRecord } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const AdminSellers: React.FC = () => {
  const { sellers, verifySeller, suspendSeller } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<SellerRecord | null>(null);

  const filteredSellers = sellers.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentRollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sellerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900 mb-2">
          <Lock className="w-3.5 h-3.5 text-amber-700" />
          <span>Strictly Confidential • University Administration Internal Use Only</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
          Student Creators & Sellers Registry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Internal academic registry mapping verified student roll numbers to listed product batches and payout accounts. Student profiles remain strictly anonymous to public marketplace shoppers.
        </p>
      </div>

      {/* Privacy Guarantee Box */}
      <div className="p-4 bg-juw-navy-950 text-white rounded-3xl border border-slate-800 flex items-start gap-3.5 shadow-lg">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="text-sm font-bold text-emerald-300 block">
            Student Identity & Safety Protection Protocol
          </strong>
          <p className="text-slate-300 leading-relaxed">
            In compliance with Jinnah University for Women data governance policies, student seller phone numbers, personal identities, and contact forms are encrypted and accessible exclusively through this authenticated administrator interface.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by student name, roll #, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {filteredSellers.length} registered student creators
        </span>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Student Name & Roll Number</th>
                <th className="p-4">Faculty & Semester</th>
                <th className="p-4">Products Listed</th>
                <th className="p-4">Lifetime Revenue</th>
                <th className="p-4">Verification State</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <strong className="font-bold text-slate-900 block text-sm">
                      {seller.studentName}
                    </strong>
                    <span className="text-emerald-700 font-mono font-bold text-[11px] block">
                      {seller.studentRollNumber}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      ID: {seller.sellerCode}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">
                      {seller.department}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      {seller.semester}
                    </span>
                  </td>

                  <td className="p-4 font-bold text-slate-900">
                    {seller.totalProductsListed} items
                  </td>

                  <td className="p-4 font-extrabold text-emerald-800">
                    Rs. {seller.lifetimeRevenue.toLocaleString()}
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-block font-extrabold px-2.5 py-1 rounded-full text-[10px] ${
                        seller.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : seller.verificationStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {seller.verificationStatus.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSeller(seller)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        File
                      </Button>

                      {seller.verificationStatus !== 'VERIFIED' ? (
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => verifySeller(seller.id)}
                        >
                          Verify ID
                        </Button>
                      ) : (
                        <button
                          onClick={() => suspendSeller(seller.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Record Inspection Modal */}
      {selectedSeller && (
        <Modal
          isOpen={Boolean(selectedSeller)}
          onClose={() => setSelectedSeller(null)}
          title={`Confidential Student File: ${selectedSeller.studentName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Roll Number:</span>
                <strong className="text-emerald-800 font-mono">{selectedSeller.studentRollNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <strong className="text-slate-900">{selectedSeller.department}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Semester:</span>
                <span className="text-slate-800">{selectedSeller.semester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">University Email:</span>
                <span className="text-slate-800">{selectedSeller.contactEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Phone:</span>
                <span className="text-slate-800 font-mono">{selectedSeller.contactPhone}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Earnings Paid Out:</span>
                <strong className="text-emerald-800 font-bold">Rs. {selectedSeller.lifetimeRevenue.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSeller(null)}
              >
                Close File
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
