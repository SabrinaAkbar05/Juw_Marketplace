import { adminApi, api, json } from '../lib/api';
import { adminToken } from '../lib/auth';
import React, { createContext, useContext, useState } from 'react';
import {
  Product,
  ProductStatus,
  Order,
  OrderStatus,
  SupportTicket,
  CustomerRecord,
  SellerRecord,
  Review,
  AdminUserRecord,
  SellerInvitation,
  AdminInvitation,
  AuditLogEntry,
  UserSearchResult,
  AddSellerPayload,
  AddAdminPayload,
  Category,
} from '../types';
import { buildAnalytics } from '../lib/analytics';

export interface AdminNotification {
  id: string;
  type: 'APPROVAL_REQUEST' | 'NEW_ORDER' | 'SUPPORT_DISPUTE' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface AdminSettings {
  marketplaceName: string;
  commissionRate: number; // e.g. 5%
  enableGuestCheckout: boolean;
  campusPickupLocations: string[];
  bannerAnnouncement: string;
  maintenanceMode: boolean;
}

export interface CurrentAdminUser {
  uid: string;
  email: string;
  isSuperAdmin: boolean;
  role: string;
}

interface AdminContextType {
  products: Product[];
  orders: Order[];
  supportTickets: SupportTicket[];
  customers: CustomerRecord[];
  sellers: SellerRecord[];
  reviews: Review[];
  categories: Category[];
  notifications: AdminNotification[];
  settings: AdminSettings;
  analytics: ReturnType<typeof buildAnalytics>;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  // Category Management Actions
  addCategory: (payload: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, payload: Partial<Category>) => Promise<Category>;
  toggleCategoryStatus: (id: string, status: 'active' | 'hidden' | 'archived') => Promise<Category>;
  deleteCategory: (id: string, options?: { action?: 'archive' | 'reassign'; targetCategoryId?: string }) => Promise<{ ok: boolean; archived?: boolean; deleted?: boolean; reassignedCount?: number; targetCategoryName?: string; message?: string }>;
  reorderCategories: (orders: { id: string; sortOrder: number }[]) => Promise<void>;
  uploadCategoryImage: (base64Image: string) => Promise<{ url: string; publicId: string }>;
  // User Management State
  users: AdminUserRecord[];
  adminInvitations: AdminInvitation[];
  sellerInvitations: SellerInvitation[];
  auditLogs: AuditLogEntry[];
  currentUser: CurrentAdminUser | null;
  refreshRemote: () => Promise<void>;
  // User Management Actions
  searchExistingUsers: (query: string) => Promise<UserSearchResult[]>;
  addSeller: (payload: AddSellerPayload) => Promise<{ ok: boolean; seller?: SellerRecord; invitation?: SellerInvitation }>;
  addAdministrator: (payload: AddAdminPayload) => Promise<{ ok: boolean; user?: AdminUserRecord; invitation?: AdminInvitation }>;
  updateUserStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED', reason?: string) => Promise<void>;
  revokeUserRole: (userId: string, role: 'ADMIN' | 'SUPER_ADMIN' | 'SELLER') => Promise<void>;
  updateUserDetails: (userId: string, details: { name?: string; phone?: string; department?: string; storeName?: string; storeDescription?: string }) => Promise<void>;
  cancelInvitation: (type: 'seller' | 'admin', invitationId: string) => Promise<void>;
  // Product Approval Actions
  approveProduct: (productId: string) => void;
  rejectProduct: (productId: string, reason: string) => void;
  requestProductChanges: (productId: string, comment: string) => void;
  // Product Management
  toggleProductStatus: (productId: string, newStatus: ProductStatus) => void;
  deleteProduct: (productId: string) => void;
  updateProduct: (productId: string, updatedData: Partial<Product>) => void;
  addNewProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Product;
  // Order Fulfillment
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  updatePaymentStatus: (orderId: string, paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED') => void;
  // Support & Dispute Management
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  updateTicketPriority: (ticketId: string, priority: SupportTicket['priority']) => void;
  addAdminNoteToTicket: (ticketId: string, note: string) => void;
  sendAdminReplyToTicket: (ticketId: string, message: string) => void;
  resolveDispute: (ticketId: string, resolution: string) => void;
  // Customer & Seller Actions
  toggleCustomerStatus: (customerId: string) => void;
  verifySeller: (sellerId: string) => void;
  suspendSeller: (sellerId: string) => void;
  // Reviews
  moderateReview: (reviewId: string, status: 'APPROVED' | 'HIDDEN') => void;
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Settings
  updateSettings: (newSettings: Partial<AdminSettings>) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [adminInvitations, setAdminInvitations] = useState<AdminInvitation[]>([]);
  const [sellerInvitations, setSellerInvitations] = useState<SellerInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentAdminUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const analytics = buildAnalytics(products, orders, customers, sellers, supportTickets);

  /**
   * Fallback: load categories from the public catalog endpoint.
   * Used when admin bootstrap fails (e.g. server down, expired token).
   * These will be overwritten by a successful bootstrap call.
   */
  const loadPublicCategories = async () => {
    try {
      const result = await api<{ categories: Category[] }>('/api/categories');
      if (Array.isArray(result.categories) && result.categories.length > 0) {
        setCategories(result.categories);
      }
    } catch {
      // Public catalog also unavailable — server is down
    }
  };

  const refreshRemote = async () => {
    const token = adminToken();
    if (!token) {
      // No admin session — still load public categories so the UI isn't empty
      setIsBootstrapping(false);
      setBootstrapError('No admin session. Please sign in to manage categories.');
      await loadPublicCategories();
      return;
    }
    setIsBootstrapping(true);
    setBootstrapError(null);
    try {
      const data = await adminApi<{
        products: Product[];
        orders: Order[];
        tickets: SupportTicket[];
        customers: CustomerRecord[];
        sellers: SellerRecord[];
        reviews: Review[];
        categories?: Category[];
        settings: AdminSettings;
        users?: AdminUserRecord[];
        adminInvitations?: AdminInvitation[];
        sellerInvitations?: SellerInvitation[];
        auditLogs?: AuditLogEntry[];
        currentUser?: CurrentAdminUser;
      }>('/bootstrap', token);

      if (data.products) setProducts(data.products);
      if (data.orders) setOrders(data.orders);
      if (data.tickets) setSupportTickets(data.tickets);
      if (data.customers) setCustomers(data.customers);
      if (data.sellers) setSellers(data.sellers);
      if (data.reviews) setReviews(data.reviews);
      // FIX: use Array.isArray() guard — `if (data.categories)` is falsy for empty arrays
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
      if (data.adminInvitations) setAdminInvitations(data.adminInvitations);
      if (data.sellerInvitations) setSellerInvitations(data.sellerInvitations);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.currentUser) setCurrentUser(data.currentUser);

      // If bootstrap returned zero categories, fall back to public endpoint
      // (handles case where Firestore categories collection is empty but server is seeding)
      if (!Array.isArray(data.categories) || data.categories.length === 0) {
        await loadPublicCategories();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to admin server';
      console.warn('Admin bootstrap failed:', msg);
      setBootstrapError(msg);
      // Graceful degradation: load public categories so admin can still see what customers see
      await loadPublicCategories();
    } finally {
      setIsBootstrapping(false);
    }
  };

  React.useEffect(() => {
    void refreshRemote();
    const onFocus = () => { void refreshRemote(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const persist = (path: string, method: string, data?: unknown) => {
    const token = adminToken();
    if (!token) return;
    adminApi(path, token, method === 'DELETE' ? { method } : json(method, data))
      .then(refreshRemote)
      .catch((e) => {
        console.error(e);
        window.alert('Changes could not be saved: ' + e.message);
        refreshRemote();
      });
  };


  const [settings, setSettings] = useState<AdminSettings>({
    marketplaceName: 'JUW Marketplace',
    commissionRate: 5.0,
    enableGuestCheckout: false,
    campusPickupLocations: [
      'JUW Main Campus - Incubation Hub Counter (Block C)',
      'JUW Central Library Reception Desk (Ground Floor)',
      'Faculty Lounge - Administration Block',
      'Art & Design Department Gallery Kiosk (Block D)',
    ],
    bannerAnnouncement: '🎓 Welcome to the official JUW Student Entrepreneurial Marketplace! Support student innovation.',
    maintenanceMode: false,
  });

  // Approvals workflow
  const approveProduct = (productId: string) => {
    persist('/products/'+productId,'PATCH',{status:'ACTIVE',adminFeedback:''});
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: 'ACTIVE' as ProductStatus, adminFeedback: undefined } : p))
    );
  };

  const rejectProduct = (productId: string, reason: string) => {
    persist('/products/'+productId,'PATCH',{status:'REJECTED',adminFeedback:reason});
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: 'REJECTED' as ProductStatus, adminFeedback: reason }
          : p
      )
    );
  };

  const requestProductChanges = (productId: string, comment: string) => {
    persist('/products/'+productId,'PATCH',{status:'NEEDS_CHANGES',adminFeedback:comment});
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: 'NEEDS_CHANGES' as ProductStatus, adminFeedback: comment }
          : p
      )
    );
  };

  // Products
  const toggleProductStatus = (productId: string, newStatus: ProductStatus) => {
    persist('/products/'+productId,'PATCH',{status:newStatus});
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
    );
  };

  const deleteProduct = (productId: string) => {
    persist('/products/'+productId,'DELETE');
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateProduct = (productId: string, updatedData: Partial<Product>) => {
    persist('/products/'+productId,'PATCH',updatedData);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updatedData } : p))
    );
  };

  const addNewProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    persist('/products','POST',productData);
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  // Orders
  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    persist('/orders/'+orderId,'PATCH',{status,note});
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newHistory = [
            ...o.statusHistory,
            {
              status,
              timestamp: new Date().toISOString(),
              note: note || `Status updated to ${status} by Administrator.`,
            },
          ];
          return { ...o, status, statusHistory: newHistory };
        }
        return o;
      })
    );
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED') => {
    persist('/orders/'+orderId,'PATCH',{paymentStatus});
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
    );
  };

  // Support & Disputes
  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    persist('/support/'+ticketId,'PATCH',{status});
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
  };

  const updateTicketPriority = (ticketId: string, priority: SupportTicket['priority']) => {
    persist('/support/'+ticketId,'PATCH',{priority});
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, priority, updatedAt: new Date().toISOString() } : t))
    );
  };

  const addAdminNoteToTicket = (ticketId: string, note: string) => {
    persist('/support/'+ticketId,'PATCH',{note});
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              internalAdminNotes: [...(t.internalAdminNotes || []), note],
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const sendAdminReplyToTicket = (ticketId: string, message: string) => {
    persist('/support/'+ticketId,'PATCH',{reply:message});
    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const reply = {
            id: 'msg-' + Date.now(),
            sender: 'ADMIN_SUPPORT' as const,
            senderName: 'JUW Marketplace Support Desk',
            message,
            timestamp: new Date().toISOString(),
          };
          return {
            ...t,
            messages: [...t.messages, reply],
            updatedAt: new Date().toISOString(),
            status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status,
          };
        }
        return t;
      })
    );
  };

  const resolveDispute = (ticketId: string, resolution: string) => {
    persist('/support/'+ticketId,'PATCH',{status:'RESOLVED',reply:'Resolution: '+resolution});
    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const reply = {
            id: 'msg-' + Date.now(),
            sender: 'ADMIN_SUPPORT' as const,
            senderName: 'JUW Marketplace Dispute Resolution Officer',
            message: `Resolution: ${resolution}`,
            timestamp: new Date().toISOString(),
          };
          return {
            ...t,
            status: 'RESOLVED' as const,
            resolutionSummary: resolution,
            messages: [...t.messages, reply],
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  // Customers & Sellers
  const toggleCustomerStatus = (customerId: string) => {
    const customer=customers.find(c=>c.id===customerId);if(customer)persist('/customers/'+customerId,'PATCH',{status:customer.status==='ACTIVE'?'INACTIVE':'ACTIVE'});
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
          : c
      )
    );
  };

  const verifySeller = (sellerId: string) => {
    const token=adminToken();if(token)adminApi(`/sellers/${sellerId}`,token,json('PATCH',{verificationStatus:'VERIFIED'})).catch(console.warn);
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, verificationStatus: 'VERIFIED' } : s))
    );
  };

  const suspendSeller = (sellerId: string) => {
    const token=adminToken();if(token)adminApi(`/sellers/${sellerId}`,token,json('PATCH',{verificationStatus:'SUSPENDED'})).catch(console.warn);
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, verificationStatus: 'SUSPENDED' } : s))
    );
  };

  // Reviews
  const moderateReview = (reviewId: string, status: 'APPROVED' | 'HIDDEN') => {
    persist('/reviews/'+reviewId,'PATCH',{status});
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
    );
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const updateSettings = (newSettings: Partial<AdminSettings>) => {
    persist('/settings','PATCH',newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // User Management Actions
  const searchExistingUsers = async (query: string): Promise<UserSearchResult[]> => {
    const token = adminToken();
    if (!token) return [];
    try {
      const res = await adminApi<{ results: UserSearchResult[] }>(
        `/users/search?q=${encodeURIComponent(query)}`,
        token
      );
      return res.results || [];
    } catch (err) {
      console.error('searchExistingUsers failed:', err);
      return [];
    }
  };

  const addSeller = async (payload: AddSellerPayload): Promise<{ ok: boolean; seller?: SellerRecord; invitation?: SellerInvitation }> => {
    const token = adminToken();
    if (!token) throw new Error('Authentication required');
    const res = await adminApi<{ ok: boolean; seller?: SellerRecord; invitation?: SellerInvitation }>(
      '/sellers',
      token,
      json('POST', payload)
    );
    await refreshRemote();
    return res;
  };

  const addAdministrator = async (payload: AddAdminPayload): Promise<{ ok: boolean; user?: AdminUserRecord; invitation?: AdminInvitation }> => {
    const token = adminToken();
    if (!token) throw new Error('Authentication required');
    const res = await adminApi<{ ok: boolean; user?: AdminUserRecord; invitation?: AdminInvitation }>(
      '/administrators',
      token,
      json('POST', payload)
    );
    await refreshRemote();
    return res;
  };

  const updateUserStatus = async (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED', reason?: string): Promise<void> => {
    const token = adminToken();
    if (!token) throw new Error('Authentication required');
    await adminApi(`/users/${userId}/status`, token, json('PATCH', { status, reason }));
    await refreshRemote();
  };

  const revokeUserRole = async (userId: string, role: 'ADMIN' | 'SUPER_ADMIN' | 'SELLER'): Promise<void> => {
    const token = adminToken();
    if (!token) throw new Error('Authentication required');
    await adminApi(`/users/${userId}/revoke`, token, json('POST', { role }));
    await refreshRemote();
  };

  const updateUserDetails = async (
    userId: string,
    details: { name?: string; phone?: string; department?: string; storeName?: string; storeDescription?: string }
  ): Promise<void> => {
    const token = adminToken();
    if (!token) throw new Error('Authentication required');
    await adminApi(`/users/${userId}`, token, json('PATCH', details));
    await refreshRemote();
  };

  const cancelInvitation = async (type: 'seller' | 'admin', invitationId: string): Promise<void> => {
    const token = adminToken();
    if (!token) throw new Error('Authentication required');
    await adminApi(`/invitations/${type}/${invitationId}`, token, { method: 'DELETE' });
    await refreshRemote();
  };

  // Category Actions
  const addCategory = async (payload: Partial<Category>): Promise<Category> => {
    const token = adminToken();
    if (!token) throw new Error('Admin authentication required');
    const created = await adminApi<Category>('/categories', token, json('POST', payload));
    await refreshRemote();
    return created;
  };

  const updateCategory = async (id: string, payload: Partial<Category>): Promise<Category> => {
    const token = adminToken();
    if (!token) throw new Error('Admin authentication required');
    const updated = await adminApi<Category>(`/categories/${id}`, token, json('PATCH', payload));
    await refreshRemote();
    return updated;
  };

  const toggleCategoryStatus = async (id: string, status: 'active' | 'hidden' | 'archived'): Promise<Category> => {
    const token = adminToken();
    if (!token) throw new Error('Admin authentication required');
    const updated = await adminApi<Category>(`/categories/${id}/status`, token, json('PATCH', { status }));
    await refreshRemote();
    return updated;
  };

  const deleteCategory = async (
    id: string,
    options?: { action?: 'archive' | 'reassign'; targetCategoryId?: string }
  ): Promise<{ ok: boolean; archived?: boolean; deleted?: boolean; reassignedCount?: number; targetCategoryName?: string; message?: string }> => {
    const token = adminToken();
    if (!token) throw new Error('Admin authentication required');
    const res = await adminApi<{ ok: boolean; archived?: boolean; deleted?: boolean; reassignedCount?: number; targetCategoryName?: string; message?: string }>(
      `/categories/${id}`,
      token,
      json('DELETE', options || {})
    );
    await refreshRemote();
    return res;
  };

  const reorderCategories = async (orders: { id: string; sortOrder: number }[]): Promise<void> => {
    const token = adminToken();
    if (!token) throw new Error('Admin authentication required');
    await adminApi('/categories/reorder', token, json('POST', { orders }));
    await refreshRemote();
  };

  const uploadCategoryImage = async (base64Image: string): Promise<{ url: string; publicId: string }> => {
    const token = adminToken();
    if (!token) throw new Error('Admin authentication required');
    return adminApi<{ url: string; publicId: string }>('/categories/upload-image', token, json('POST', { image: base64Image }));
  };

  return (
    <AdminContext.Provider
      value={{
        products,
        orders,
        supportTickets,
        customers,
        sellers,
        reviews,
        categories,
        notifications,
        settings,
        analytics,
        isBootstrapping,
        bootstrapError,
        addCategory,
        updateCategory,
        toggleCategoryStatus,
        deleteCategory,
        reorderCategories,
        uploadCategoryImage,
        users,
        adminInvitations,
        sellerInvitations,
        auditLogs,
        currentUser,
        refreshRemote,
        searchExistingUsers,
        addSeller,
        addAdministrator,
        updateUserStatus,
        revokeUserRole,
        updateUserDetails,
        cancelInvitation,
        approveProduct,
        rejectProduct,
        requestProductChanges,
        toggleProductStatus,
        deleteProduct,
        updateProduct,
        addNewProduct,
        updateOrderStatus,
        updatePaymentStatus,
        updateTicketStatus,
        updateTicketPriority,
        addAdminNoteToTicket,
        sendAdminReplyToTicket,
        resolveDispute,
        toggleCustomerStatus,
        verifySeller,
        suspendSeller,
        moderateReview,
        markNotificationAsRead,
        markAllNotificationsRead,
        updateSettings,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
