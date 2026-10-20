import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Package,
  CheckSquare,
  ShoppingBag,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    orders,
    supportTickets,
    customers,
    sellers,
    analytics,
    approveProduct,
  } = useAdmin();

  const pendingApprovals = products.filter((p) => p.status === 'PENDING');
  const recentOrders = orders.slice(0, 5);
  const activeDisputes = supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-juw-navy-950 via-juw-navy-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Jinnah University for Women • Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Executive Marketplace Overview
          </h1>
          <p className="text-xs text-slate-300">
            Manage product approvals, sellers, orders and support tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/approvals">
            <Button
              variant="gold"
              size="md"
              leftIcon={<CheckSquare className="w-4 h-4" />}
            >
              Review Pending Approvals ({pendingApprovals.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Marketplace Revenue"
          value={`Rs. ${analytics.totalRevenue.toLocaleString()}`}
          change={analytics.monthlyGrowth}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
        />

        <StatCard
          title="Orders Processed"
          value={analytics.totalOrders}
          change={0}
          icon={<ShoppingBag className="w-5 h-5" />}
          variant="blue"
        />

        <StatCard
          title="Active Student Sellers"
          value={sellers.length}
          subtext="Admin Verified"
          icon={<GraduationCap className="w-5 h-5" />}
          variant="purple"
        />

        <StatCard
          title="Pending Moderation"
          value={pendingApprovals.length}
          subtext="Requires Admin Action"
          icon={<CheckSquare className="w-5 h-5" />}
          variant="gold"
        />
      </div>

      {/* 2-Column: Pending Approvals Action Queue & Sales Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Pending Product Approvals Quick Queue */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>Pending Product Approvals Queue</span>
              </h2>
              <p className="text-xs text-slate-500">
                New submissions from student creators awaiting faculty compliance check.
              </p>
            </div>
            <Link
              to="/admin/approvals"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Full Queue →
            </Link>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              All submitted products have been reviewed and approved!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={prod.images[0]}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover bg-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        {prod.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {prod.sellerDepartment} • Rs. {prod.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link to="/admin/approvals">
                      <Button variant="outline" size="sm">
                        Inspect
                      </Button>
                    </Link>
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => approveProduct(prod.id)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Category & Department Revenue Share */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold font-display text-slate-900">
              Department Revenue Distribution
            </h2>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Q3 Active
            </span>
          </div>

          <div className="space-y-4">
            {analytics.categoryPerformance.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.category}</span>
                  <span className="font-extrabold text-slate-900">
                    Rs. {item.revenue.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 2-Column: Recent Orders Table & Active Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">
                Recent Marketplace Orders
              </h2>
              <p className="text-xs text-slate-500">Live order fulfillment stream across Karachi campus hubs.</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-bold font-mono text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                      <span className="text-[10px] text-slate-400">{ord.customerPhone}</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {ord.deliveryType === 'CAMPUS_PICKUP' ? 'Campus Pickup' : 'Courier Delivery'}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      Rs. {ord.total.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={ord.status} type="order" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Support & Dispute Alerts */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Active Disputes</span>
            </h2>
            <Link
              to="/admin/support"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Helpdesk →
            </Link>
          </div>

          <div className="space-y-3">
            {activeDisputes.map((tkt) => (
              <div key={tkt.id} className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-rose-800">
                    {tkt.ticketNumber}
                  </span>
                  <StatusBadge status={tkt.priority} type="priority" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{tkt.subject}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">{tkt.description}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Customer: {tkt.customerName}</span>
                  <Link to="/admin/support" className="text-rose-700 font-bold hover:underline">
                    Arbitrate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
