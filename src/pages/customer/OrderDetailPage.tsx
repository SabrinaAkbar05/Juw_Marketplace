import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ShieldAlert,
  MapPin,
  CreditCard,
  PackageCheck,
  Printer,
  HelpCircle,
  Sparkles,
  Ban,
  Clock,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { OrderTimeline } from '../../components/customer/OrderTimeline';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SupportTicketModal } from '../../components/customer/SupportTicketModal';
import { EmptyState } from '../../components/common/EmptyState';
import { api } from '../../lib/api';
import { getStoredToken } from '../../lib/auth';
import { Order } from '../../types';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, addToast, cancelOrder } = useMarketplace();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Look in existing state first
  const order = orders.find((o) => o.id === id || o.orderNumber === id) || fetchedOrder;

  useEffect(() => {
    if (!order && id) {
      setLoading(true);
      const token = getStoredToken();
      api<Order>(`/api/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => setFetchedOrder(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs text-slate-500">Retrieving order details from central registry…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Order Not Found"
          description="The order reference you are looking for does not exist or you do not have permission to view it."
          actionText="Back to My Orders"
          onAction={() => navigate('/orders')}
        />
      </div>
    );
  }

  const handleDownloadInvoice = () => {
    window.print();
  };

  const handleCancel = async () => {
    const reason = window.prompt(`Please provide a reason for cancelling Order #${order.orderNumber}:`, 'Customer requested cancellation');
    if (reason === null) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id, reason);
      const token = getStoredToken();
      const updated = await api<Order>(`/api/orders/${order.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setFetchedOrder(updated);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = ['PLACED', 'PAYMENT_CONFIRMED', 'PROCESSING'].includes(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Back button & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Order #{order.orderNumber}
            </h1>
            <StatusBadge status={order.status} type="order" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking ID: <span className="font-mono font-bold text-slate-700">{order.trackingNumber || 'Pending'}</span> • Placed {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
            >
              <Ban size={15} />
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadInvoice}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Receipt
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsTicketModalOpen(true)}
            leftIcon={<ShieldAlert className="w-4 h-4" />}
          >
            Support / Dispute
          </Button>
        </div>
      </div>

      {/* Visual Timeline Tracking Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
        <h2 className="text-sm font-bold font-display text-slate-900 uppercase tracking-wider text-slate-400">
          Live Fulfillment Progress
        </h2>

        <OrderTimeline
          currentStatus={order.status}
          statusHistory={order.statusHistory || []}
        />
      </div>

      {/* Grid: Order Items & Delivery/Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100">
            Order Items ({order.items.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200'}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Quantity: {item.quantity} • Rs. {item.price.toLocaleString()}
                    </span>
                    {item.fulfillmentStatus && (
                      <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                        Status: {item.fulfillmentStatus}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-extrabold font-display text-slate-900 shrink-0">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">
                Rs. {order.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery Charges</span>
              <span className={`font-bold ${order.deliveryFee === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                {order.deliveryFee === 0 ? 'FREE (Campus Pickup)' : `Rs. ${order.deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold font-display text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Amount</span>
              <span className="text-emerald-800">
                Rs. {order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Fulfillment & Payment Meta Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fulfillment Details Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Collection & Delivery Destination</span>
            </h4>

            {order.deliveryType === 'CAMPUS_PICKUP' ? (
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs space-y-1">
                <span className="font-bold text-emerald-950 block">
                  Campus Collection Station
                </span>
                <p className="text-emerald-800">
                  {order.pickupLocation || 'JUW Main Campus - Incubation Hub Counter (Block C)'}
                </p>
                <p className="text-[11px] text-emerald-700 pt-1">
                  Present your Student Card / Faculty ID upon arrival to collect.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-700">
                <span className="font-bold text-slate-900 block">
                  Doorstep Delivery Address
                </span>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.area}, {order.shippingAddress?.city}</p>
                <p className="text-slate-400 font-mono text-[11px]">Postal Code: {order.shippingAddress?.postalCode || '74600'}</p>
              </div>
            )}

            <div className="pt-2 text-xs text-slate-500">
              <p>Recipient: <strong className="text-slate-800">{order.customerName}</strong></p>
              <p>Contact Phone: <strong className="text-slate-800">{order.customerPhone}</strong></p>
              <p>Email: <strong className="text-slate-800">{order.customerEmail}</strong></p>
            </div>
          </div>

          {/* Payment Status Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Payment Details</span>
            </h4>

            <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Payment Method</span>
                <strong className="text-slate-900">
                  {order.deliveryType === 'CAMPUS_PICKUP' ? 'Pay at Campus Counter (Cash)' : 'Cash on Delivery (COD)'}
                </strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {order.paymentStatus}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Payments are recorded directly upon physical handover by university authorized dispatch staff.
            </p>
          </div>
        </div>
      </div>

      {/* Support Ticket Modal for disputes */}
      {isTicketModalOpen && (
        <SupportTicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          defaultOrderNumber={order.orderNumber}
        />
      )}
    </div>
  );
};
