import React from 'react';
import {SellerPortal} from './pages/seller/SellerPortal';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { AdminProvider } from './context/AdminContext';

// Customer Components & Pages
import { CustomerLayout } from './components/customer/CustomerLayout';
import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { CategoriesPage } from './pages/customer/CategoriesPage';
import { CategoryDetailPage } from './pages/customer/CategoryDetailPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { ServicesPage } from './pages/customer/ServicesPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { SupportPage } from './pages/customer/SupportPage';
import { EventsPage } from './pages/customer/EventsPage';
import { AboutPage } from './pages/customer/AboutPage';
import { ContactPage } from './pages/customer/ContactPage';

// Admin Components & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminAuthGate } from './components/admin/AdminAuthGate';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminApprovals } from './pages/admin/AdminApprovals';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminSellers } from './pages/admin/AdminSellers';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AcceptInvitationPage } from './pages/common/AcceptInvitationPage';
import { ViewSwitcher } from './components/common/ViewSwitcher';
import { ToastContainer } from './components/common/ToastContainer';

export default function App() {
  return (
    <MarketplaceProvider>
      <AdminProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Marketplace Routes */}
            <Route path="/" element={<CustomerLayout />}>
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="categories/:categorySlug" element={<CategoryDetailPage />} />
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>

            {/* Public Invitation Acceptance */}
            <Route path="/invitation/accept" element={<AcceptInvitationPage />} />

            <Route path="/seller/*" element={<SellerPortal />} />

            {/* Administrative Portal Routes */}
            <Route
              path="/admin"
              element={
                <>
                  <AdminAuthGate><AdminLayout /></AdminAuthGate>
                  <ToastContainer />
                  <ViewSwitcher />
                </>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="users/:tab" element={<AdminUserManagement />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="sellers" element={<AdminSellers />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </MarketplaceProvider>
  );
}
