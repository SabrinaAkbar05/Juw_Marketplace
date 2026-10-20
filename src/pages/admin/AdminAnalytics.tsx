import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Download,
  Calendar,
  Sparkles,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';

export const AdminAnalytics: React.FC = () => {
  const { analytics } = useAdmin();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Marketplace Analytics & Enterprise Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data insights on student revenue, faculty performance, and customer order retention.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV Financial Audit
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Gross Venture Volume (GVV)"
          value={`Rs. ${analytics.totalRevenue.toLocaleString()}`}
          change={analytics.monthlyGrowth}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
        />

        <StatCard
          title="Total Order Transactions"
          value={analytics.totalOrders}
          change={0}
          icon={<ShoppingBag className="w-5 h-5" />}
          variant="blue"
        />

        <StatCard
          title="Active Registered Patrons"
          value={analytics.activeCustomers}
          change={0}
          icon={<Users className="w-5 h-5" />}
          variant="purple"
        />

        <StatCard
          title="Approved Student Catalog"
          value={analytics.approvedProducts}
          subtext="Approved listings"
          icon={<Award className="w-5 h-5" />}
          variant="gold"
        />
      </div>

      {/* Monthly Sales Revenue Visual Bar Chart Representation */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900">
              Monthly Student Revenue Growth (PKR)
            </h2>
            <p className="text-xs text-slate-500">Trailing 6-month gross marketplace revenue trajectory.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            Live Firestore order data
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-64 pt-8">
          {analytics.monthlySalesData.map((item, idx) => {
            const maxVal = 160000;
            const heightPercent = Math.round((item.revenue / maxVal) * 100);

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700 transition-colors opacity-0 group-hover:opacity-100">
                  Rs. {(item.revenue / 1000).toFixed(0)}k
                </span>
                <div className="w-full max-w-[48px] bg-slate-100 rounded-2xl overflow-hidden flex items-end h-48">
                  <div
                    className="w-full bg-gradient-to-t from-juw-navy-900 via-emerald-800 to-emerald-600 rounded-2xl transition-all duration-700 group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">{item.month}</span>
                <span className="text-[10px] text-slate-400">{item.orders} ord</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column: Department Breakdown Table & Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Department Performance */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900">
            Faculty & Department Contributions
          </h3>

          <div className="divide-y divide-slate-100">
            {analytics.departmentBreakdown.map((dept, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <strong className="font-bold text-slate-900 block">{dept.department}</strong>
                  <span className="text-[11px] text-slate-400">
                    {dept.studentCount} student creators enrolled
                  </span>
                </div>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {dept.salesVolume}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Quality Assurance KPIs */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-5">
          <h3 className="text-base font-bold font-display text-slate-900">
            Fulfillment & Quality Benchmark
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <div className="flex justify-between font-bold">
                <span>On-Time Campus Pickup Rate</span>
                <span className="text-emerald-700">98.4%</span>
              </div>
              <p className="text-[11px] text-slate-500">Orders ready within 48 hours at Block C counter.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <div className="flex justify-between font-bold">
                <span>Dispute Resolution Velocity</span>
                <span className="text-emerald-700">Under 18 Hours</span>
              </div>
              <p className="text-[11px] text-slate-500">Average mediation duration for courier packaging claims.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <div className="flex justify-between font-bold">
                <span>Direct Student Payout Disbursement</span>
                <span className="text-emerald-700">100% On-Schedule</span>
              </div>
              <p className="text-[11px] text-slate-500">Bi-weekly bank/Raast transfers direct to student creators.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
