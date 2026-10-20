import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export const ViewSwitcher: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products, supportTickets } = useAdmin();

  const isAdmin = location.pathname.startsWith('/admin');
  const pendingApprovalsCount = products.filter((p) => p.status === 'PENDING').length;
  const activeDisputesCount = supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in pointer-events-auto">
      <div className="glass-dark text-white rounded-full p-1.5 shadow-2xl flex items-center gap-1.5 border border-white/20">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
            !isAdmin
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Marketplace</span>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 relative cursor-pointer ${
            isAdmin
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Admin Portal</span>

          {pendingApprovalsCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-3 border-l border-white/15 text-[11px] text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold">Official JUW Ecosystem</span>
        </div>
      </div>
    </div>
  );
};
