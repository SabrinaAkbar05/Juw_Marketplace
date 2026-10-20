import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Search,
  ExternalLink,
  Ban,
  LogIn,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { SupportTicketModal } from '../../components/customer/SupportTicketModal';
import { OrderStatus } from '../../types';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, cancelOrder, isAuthenticated, openAuthModal } = useMarketplace();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [ticketModalOrder, setTicketModalOrder] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === 'ALL') return true;
    return order.status === selectedStatus;
  });

  const handleCancel = async (orderId: string, orderNumber: string) => {
    const reason = window.prompt(`Please provide a reason for cancelling Order #${orderNumber}:`, 'Customer requested cancellation');
    if (reason === null) return;
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId, reason);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Order cancellation failed');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Guest Notice */}
      {!isAuthenticated && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-amber-950">Viewing Guest Orders Mode</h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Sign in with your student or customer email to view your persistent order history and receive live university dispatch notifications.
            </p>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <LogIn size={15} /> Sign In to Account
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            My Orders & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track fulfillment progress, campus collection status, and access support tickets.
          </p>
        </div>

        <Link to="/support">
          <Button variant="outline" size="sm" leftIcon={<ShieldAlert className="w-4 h-4 text-emerald-700" />}>
            Marketplace Helpdesk
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        {['ALL', 'PLACED', 'PROCESSING', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === st
                ? 'bg-juw-navy-900 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-slate-400" />}
          title="No Orders Found"
          description="You don't have any orders matching the selected filter state."
          actionText="Browse Marketplace"
          onAction={() => navigate('/shop')}
        />
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const canCancel = ['PLACED', 'PAYMENT_CONFIRMED', 'PROCESSING'].includes(order.status);
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all space-y-6"
              >
                {/* Card Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Order Reference
                      </span>
                      <strong className="text-sm font-display text-slate-900">
                        {order.orderNumber}
                      </strong>
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Placed On
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Tracking
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {order.trackingNumber || 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} type="order" />
                    <Link
                      to={`/orders/${order.id}`}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="View Full Order Details"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-slate-50/60 rounded-2xl border border-slate-100"
                    >
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200'}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Qty: {item.quantity} • Rs. {item.price.toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900 block sm:inline">
                      Total: Rs. {order.total.toLocaleString()}
                    </span>
                    <span className="text-slate-400 sm:ml-2">
                      ({order.deliveryType === 'CAMPUS_PICKUP' ? 'Campus Pickup' : 'Karachi Doorstep Delivery'} • {order.paymentMethod})
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(order.id, order.orderNumber)}
                        disabled={cancellingId === order.id}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
                      >
                        <Ban size={14} />
                        {cancellingId === order.id ? 'Cancelling…' : 'Cancel Order'}
                      </button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTicketModalOrder(order.orderNumber)}
                      className="text-slate-700"
                    >
                      Report Issue
                    </Button>

                    <Link to={`/orders/${order.id}`}>
                      <Button variant="emerald" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                        Order Details & Tracker
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Support Ticket Modal for disputes */}
      {ticketModalOrder && (
        <SupportTicketModal
          isOpen={Boolean(ticketModalOrder)}
          onClose={() => setTicketModalOrder(null)}
          defaultOrderNumber={ticketModalOrder}
        />
      )}
    </div>
  );
};
