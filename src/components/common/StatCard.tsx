import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number; // e.g. +14.2%
  changePeriod?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'navy' | 'gold' | 'blue' | 'purple';
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changePeriod = 'vs last month',
  icon,
  variant = 'emerald',
  subtext,
}) => {
  const iconBg = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    navy: 'bg-slate-100 text-slate-800 border-slate-200',
    gold: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border shadow-2xs ${iconBg[variant]}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
          {value}
        </h3>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md ${
              change >= 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change >= 0 ? `+${change}%` : `${change}%`}
          </span>
        )}
        <span className="text-slate-400 font-medium">
          {subtext || changePeriod}
        </span>
      </div>
    </div>
  );
};
