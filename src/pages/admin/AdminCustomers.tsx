import React, { useState } from 'react';
import { Users, Search, Filter, Mail, Phone, ShoppingBag, Eye, UserCheck, UserX } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { CustomerRecord } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const AdminCustomers: React.FC = () => {
  const { customers, toggleCustomerStatus } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.departmentOrAffiliation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
          Customer & Patron Registry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor customer activity, university affiliation (students, faculty, alumni), order volume, and lifetime value.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search customers by name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {filteredCustomers.length} registered accounts
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Customer Name & Contact</th>
                <th className="p-4">Affiliation / Faculty</th>
                <th className="p-4">Orders Placed</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <strong className="font-bold text-slate-900 block">{cust.name}</strong>
                    <span className="text-slate-400 text-[11px] block">{cust.email}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{cust.phone}</span>
                  </td>

                  <td className="p-4 text-slate-700 font-medium">
                    {cust.departmentOrAffiliation}
                  </td>

                  <td className="p-4 font-extrabold text-slate-900">
                    {cust.totalOrders} orders
                  </td>

                  <td className="p-4 font-extrabold text-emerald-800">
                    Rs. {cust.totalSpent.toLocaleString()}
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-block font-extrabold px-2.5 py-1 rounded-full text-[10px] ${
                        cust.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {cust.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomer(cust)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>
                      <button
                        onClick={() => toggleCustomerStatus(cust.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          cust.status === 'ACTIVE'
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}
                        title={cust.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                      >
                        {cust.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Record: ${selectedCustomer.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Affiliation:</span>
                <strong className="text-slate-900">{selectedCustomer.departmentOrAffiliation}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-800">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-800 font-mono">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member Since:</span>
                <span className="text-slate-800">{selectedCustomer.joinedDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Lifetime Purchases:</span>
                <strong className="text-emerald-800 font-bold">Rs. {selectedCustomer.totalSpent.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Close Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
