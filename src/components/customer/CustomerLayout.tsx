import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { ToastContainer } from '../common/ToastContainer';
import { ViewSwitcher } from '../common/ViewSwitcher';
import { AuthModal } from './AuthModal';

export const CustomerLayout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on route changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-juw-emerald-100 selection:text-juw-emerald-900">
      {/* Top Navbar */}
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Page Outlet */}
      <main className="flex-1 w-full animate-fade-in">
        <Outlet />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Real-time Toasts */}
      <ToastContainer />

      {/* Floating Demo View Switcher */}
      <ViewSwitcher />

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
};
