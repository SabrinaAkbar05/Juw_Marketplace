import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, json } from '../lib/api';
import {
  AuthUser,
  getStoredUser,
  getStoredToken,
  clearAuthSession,
  firebasePasswordLogin,
  firebaseRegister,
  firebasePasswordReset,
  fetchCurrentUserProfile,
} from '../lib/auth';
import {
  Product,
  Category,
  Service,
  Order,
  SupportTicket,
} from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface MarketplaceContextType {
  products: Product[];
  categories: Category[];
  services: Service[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  supportTickets: SupportTicket[];
  toasts: ToastMessage[];
  searchQuery: string;
  selectedCategory: string | null;
  activeUser: {
    name: string;
    email: string;
    phone: string;
    role: 'STUDENT' | 'FACULTY' | 'GUEST' | 'ALUMNA' | 'SUPER_ADMIN' | 'ADMIN';
    department?: string;
  };
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { email: string; password: string; name: string; phone?: string; department?: string }) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string; departmentOrAffiliation?: string }) => Promise<void>;
  refreshOrders: () => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (slug: string | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  createSupportTicket: (ticketData: Partial<SupportTicket>) => Promise<SupportTicket>;
  addTicketReply: (ticketId: string, message: string) => Promise<void>;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  cartCount: number;
  cartSubtotal: number;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Auth State
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Cart & Wishlist from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('juw_cart') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('juw_wishlist') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('juw_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('juw_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch real approved catalog products
  const refreshCatalog = useCallback(async () => {
    try {
      const result = await api<{ products: Product[]; categories: Category[]; services: Service[] }>('/api/catalog');
      setProducts(result.products || []);
      setCategories(result.categories || []);
      setServices(result.services || []);
    } catch (err) {
      console.error('Failed to load marketplace catalog:', err);
    }
  }, []);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  // Fetch Customer Orders from Firestore
  const refreshOrders = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setOrders([]);
      return;
    }
    try {
      const result = await api<{ orders: Order[] }>('/api/orders/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(result.orders || []);
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
    }
  }, []);

  // Fetch Customer Support Tickets
  const refreshTickets = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setSupportTickets([]);
      return;
    }
    try {
      const result = await api<{ tickets: SupportTicket[] }>('/api/support/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSupportTickets(result.tickets || []);
    } catch (err) {
      console.error('Failed to fetch customer support tickets:', err);
    }
  }, []);

  // Sync auth on mount & token changes
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsAuthLoading(false);
      return;
    }

    fetchCurrentUserProfile(token)
      .then((data) => {
        const u: AuthUser = {
          uid: data.customer.uid || data.customer.id,
          email: data.customer.email,
          name: data.customer.name,
          phone: data.customer.phone,
          departmentOrAffiliation: data.customer.departmentOrAffiliation,
          role: data.customer.role || 'STUDENT',
        };
        setUser(u);
        void refreshOrders();
        void refreshTickets();
      })
      .catch(() => {
        // Token expired or invalid
        clearAuthSession();
        setUser(null);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, [refreshOrders, refreshTickets]);

  const openAuthModal = (tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    const token = await firebasePasswordLogin(email, password);
    const profile = await fetchCurrentUserProfile(token);
    const u: AuthUser = {
      uid: profile.customer.uid || profile.customer.id,
      email: profile.customer.email,
      name: profile.customer.name,
      phone: profile.customer.phone,
      departmentOrAffiliation: profile.customer.departmentOrAffiliation,
      role: profile.customer.role || 'STUDENT',
    };
    setUser(u);
    closeAuthModal();
    addToast({
      type: 'success',
      title: 'Welcome Back!',
      message: `Signed in as ${u.name}.`,
    });
    void refreshOrders();
    void refreshTickets();
  };

  const register = async (params: { email: string; password: string; name: string; phone?: string; department?: string }) => {
    const result = await firebaseRegister(params);
    setUser(result.user);
    closeAuthModal();
    addToast({
      type: 'success',
      title: 'Account Created!',
      message: `Welcome to JUW Marketplace, ${result.user.name}.`,
    });
    void refreshOrders();
    void refreshTickets();
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setOrders([]);
    setSupportTickets([]);
    addToast({
      type: 'info',
      message: 'You have been signed out.',
    });
  };

  const resetPassword = async (email: string) => {
    await firebasePasswordReset(email);
    addToast({
      type: 'success',
      title: 'Reset Link Sent',
      message: 'Check your email for instructions to reset your password.',
    });
  };

  const updateProfile = async (updates: { name?: string; phone?: string; departmentOrAffiliation?: string }) => {
    const token = getStoredToken();
    if (!token) throw new Error('Not signed in');
    const res = await api<{ customer: AuthUser }>('/api/customer/profile', {
      ...json('PATCH', updates),
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(res.customer);
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your personal information was saved successfully.',
    });
  };

  const cancelOrder = async (orderId: string, reason?: string) => {
    const token = getStoredToken();
    if (!token) throw new Error('Sign in required to cancel order');
    await api(`/api/orders/${orderId}/cancel`, {
      ...json('POST', { reason: reason || 'Cancelled by customer' }),
      headers: { Authorization: `Bearer ${token}` },
    });
    addToast({
      type: 'info',
      title: 'Order Cancelled',
      message: 'Your order was cancelled and inventory has been released.',
    });
    await refreshOrders();
    await refreshCatalog();
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0 || product.status === 'OUT_OF_STOCK') {
      addToast({
        type: 'warning',
        title: 'Out of Stock',
        message: `"${product.name}" is currently sold out.`,
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });

    addToast({
      type: 'success',
      title: 'Added to Bag',
      message: `"${product.name}" added to your shopping bag.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    addToast({
      type: 'info',
      message: 'Item removed from bag.',
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock || 50;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        addToast({ type: 'info', message: 'Removed from saved wishlist' });
        return prev.filter((id) => id !== productId);
      } else {
        addToast({ type: 'success', title: 'Saved to Wishlist', message: 'Item saved for later.' });
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const createSupportTicket = async (ticketData: Partial<SupportTicket>): Promise<SupportTicket> => {
    const token = getStoredToken();
    if (!token) {
      openAuthModal('login');
      throw new Error('Please sign in to submit a support request');
    }
    const result = await api<{ id: string; ticketNumber: string; status: SupportTicket['status'] }>(
      '/api/support',
      {
        ...json('POST', ticketData),
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: result.id,
      ticketNumber: result.ticketNumber,
      customerName: user?.name || ticketData.customerName || 'Customer',
      customerEmail: user?.email || ticketData.customerEmail || '',
      orderNumber: ticketData.orderNumber,
      issueType: ticketData.issueType || 'OTHER',
      subject: ticketData.subject || '',
      description: ticketData.description || '',
      status: result.status,
      priority: ticketData.priority || 'MEDIUM',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: 'msg-' + Date.now(),
          sender: 'CUSTOMER',
          senderName: user?.name || 'Customer',
          message: ticketData.description || '',
          timestamp: now,
        },
      ],
      internalAdminNotes: [],
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
    addToast({
      type: 'success',
      title: 'Ticket Submitted',
      message: `Support ticket #${newTicket.ticketNumber} created. Support team will respond shortly.`,
    });
    return newTicket;
  };

  const addTicketReply = async (ticketId: string, message: string) => {
    const token = getStoredToken();
    if (!token) throw new Error('Sign in required');
    await api(`/api/support/${ticketId}/reply`, {
      ...json('POST', { message }),
      headers: { Authorization: `Bearer ${token}` },
    });
    await refreshTickets();
    addToast({
      type: 'success',
      message: 'Reply sent to support desk.',
    });
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const activeUser = {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: (user?.role || 'STUDENT') as 'STUDENT' | 'FACULTY' | 'GUEST',
    department: user?.departmentOrAffiliation,
  };

  return (
    <MarketplaceContext.Provider
      value={{
        products,
        categories,
        services,
        cart,
        wishlist,
        orders,
        supportTickets,
        toasts,
        searchQuery,
        selectedCategory,
        activeUser,
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        refreshOrders,
        cancelOrder,
        refreshCatalog,
        setSearchQuery,
        setSelectedCategory,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        createSupportTicket,
        addTicketReply,
        addToast,
        removeToast,
        cartCount,
        cartSubtotal,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
