import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Truck,
  RotateCcw,
  Clock,
  MapPin,
  CreditCard,
  Download,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (
      searchTerm &&
      !o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !o.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && o.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, newStatus, `Status updated to ${newStatus} by Admin.`);
    setSelectedOrder({
      ...selectedOrder,
      status: newStatus,
    });
  };

  const handlePaymentStatusChange = (newPaymentStatus: 'PAID' | 'PENDING' | 'REFUNDED') => {
    if (!selectedOrder) return;
    updatePaymentStatus(selectedOrder.id, newPaymentStatus);
    setSelectedOrder({
      ...selectedOrder,
      paymentStatus: newPaymentStatus,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Marketplace Order Fulfillment Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch, track, and update campus pickups and courier orders across Karachi.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by order #, customer, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PLACED', 'PROCESSING', 'READY', 'SHIPPED', 'DELIVERED', 'DISPUTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-juw-navy-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Customer Info</th>
                <th className="p-4">Items / Category</th>
                <th className="p-4">Fulfillment Mode</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="p-4">
                    <strong className="font-bold text-slate-900 block">{order.customerName}</strong>
                    <span className="text-[10px] text-slate-400 block">{order.customerPhone}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <span className="font-semibold text-slate-900 block truncate max-w-[160px]">
                      {order.items[0]?.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {order.items.length > 1 ? `+${order.items.length - 1} more items` : '1 Item'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">
                      {order.deliveryType === 'CAMPUS_PICKUP' ? 'Campus Pickup' : 'Courier Dispatch'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {order.trackingNumber || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">{order.paymentMethod}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase ${
                        order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    Rs. {order.total.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={order.status} type="order" />
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Management Drawer / Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order Management: #${selectedOrder.orderNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Status Switcher Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Update Order Lifecycle Status:
              </span>
              <div className="flex flex-wrap gap-2">
                {(['PLACED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedOrder.status === st
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Customer & Delivery Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">
                  Customer Credentials
                </span>
                <strong className="text-slate-900 text-sm block">{selectedOrder.customerName}</strong>
                <p className="text-slate-600">{selectedOrder.customerEmail}</p>
                <p className="text-slate-600 font-mono">{selectedOrder.customerPhone}</p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">
                  Fulfillment & Destination
                </span>
                <strong className="text-slate-900 block">
                  {selectedOrder.deliveryType === 'CAMPUS_PICKUP' ? 'Campus Pickup' : 'Courier Home Delivery'}
                </strong>
                <p className="text-slate-600">
                  {selectedOrder.deliveryType === 'CAMPUS_PICKUP'
                    ? selectedOrder.pickupLocation
                    : `${selectedOrder.shippingAddress?.street}, ${selectedOrder.shippingAddress?.area}, Karachi`}
                </p>
                <span className="text-emerald-700 font-mono font-bold block">
                  Tracking: {selectedOrder.trackingNumber || 'Pending Requisition'}
                </span>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Purchased Student Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <strong className="font-bold text-slate-900 block">{item.name}</strong>
                        <span className="text-slate-400 text-[11px]">
                          Qty: {item.quantity} • Rs. {item.price.toLocaleString()} each
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Payment Mode:</span>
                <strong className="text-xs text-slate-900 uppercase">
                  {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                </strong>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Order Value:</span>
                <strong className="text-lg font-extrabold font-display text-slate-900">
                  Rs. {selectedOrder.total.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedOrder(null)}
              >
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
