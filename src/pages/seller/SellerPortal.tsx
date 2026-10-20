import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Plus,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  Upload,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Truck,
  Building2,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';
import { firebasePasswordLogin, adminToken, clearAuthSession } from '../../lib/auth';
import { api, json } from '../../lib/api';

type Product = {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  category: string;
  categorySlug?: string;
  price: number;
  stock: number;
  status: 'ACTIVE' | 'PENDING' | 'NEEDS_CHANGES' | 'REJECTED' | 'OUT_OF_STOCK';
  images: string[];
  sku?: string;
  adminFeedback?: string;
};

type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  fulfillmentStatus?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  deliveryType: string;
  status: string;
  subtotal: number;
  items: OrderItem[];
};

type Seller = {
  id: string;
  studentName: string;
  studentRollNumber: string;
  department: string;
  semester: string;
  contactEmail?: string;
  contactPhone?: string;
  storeName?: string;
  storeDescription?: string;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
};

type DashboardData = {
  seller: Seller;
  products: Product[];
  orders: Order[];
  stats?: {
    totalProducts: number;
    activeProducts: number;
    pendingProducts: number;
    ordersCount: number;
    grossRevenue: number;
    pendingOrders: number;
  };
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  departmentTag?: string;
};

const money = (amount: number) => `PKR ${(amount || 0).toLocaleString('en-PK')}`;
const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all';

const initialProductForm = {
  name: '',
  tagline: '',
  categoryId: '',
  category: '',
  description: '',
  price: '',
  stock: '',
  sku: '',
  images: [] as string[],
};

export function SellerPortal() {
  const [token, setToken] = useState(adminToken());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'profile'>('overview');

  // Product Form State
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [imageUploadBusy, setImageUploadBusy] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Application State
  const [application, setApplication] = useState({
    studentName: '',
    studentRollNumber: '',
    department: 'Department of Computer Science & IT',
    semester: '6th Semester',
    contactPhone: '',
    storeName: '',
    storeDescription: '',
    acceptTerms: false,
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);

  const sellerApi = useCallback(
    <T,>(path: string, opts: RequestInit = {}) =>
      api<T>('/api/seller' + path, {
        ...opts,
        headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
      }),
    [token]
  );

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const [meData, catData] = await Promise.all([
        sellerApi<{ seller: Seller | null }>('/me'),
        api<{ categories: CategoryOption[] }>('/api/categories').catch(() => ({ categories: [] })),
      ]);
      setSeller(meData.seller);
      if (catData?.categories) {
        setAvailableCategories(catData.categories);
      }
      if (meData.seller?.verificationStatus === 'VERIFIED') {
        const dash = await sellerApi<DashboardData>('/dashboard');
        setDashboard(dash);
      } else {
        setDashboard(null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, [token, sellerApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = () => {
    clearAuthSession();
    setToken('');
    setSeller(null);
    setDashboard(null);
    setLoaded(false);
    setError('');
    setMessage('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const t = await firebasePasswordLogin(email.trim(), password);
      setToken(t);
      setLoaded(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application.acceptTerms) {
      setError('You must accept the marketplace vendor policy to apply.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await sellerApi('/apply', json('POST', application));
      await load();
      setMessage('Seller application submitted! A university administrator will review your student credentials.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Cloudinary image upload via file input
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      window.alert('Please select a PNG, JPEG, or WebP image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      window.alert('File size exceeds 2 MB. Please select a smaller photo.');
      return;
    }

    setImageUploadBusy(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64Data: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const res = await sellerApi<{ url: string; publicId: string }>('/images', {
        ...json('POST', { image: base64Data }),
      });

      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, res.url].slice(0, 6),
      }));
      setMessage('Image uploaded to Cloudinary successfully.');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setImageUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addManualImage = () => {
    if (!manualImageUrl.trim() || !/^https:\/\//.test(manualImageUrl.trim())) {
      window.alert('Please enter a valid secure HTTPS image URL.');
      return;
    }
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, manualImageUrl.trim()].slice(0, 6),
    }));
    setManualImageUrl('');
  };

  const removeImage = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const startEditProduct = (p: Product) => {
    const matchedCategory = availableCategories.find(
      (c) => c.id === (p as any).categoryId || c.name === p.category || c.slug === (p as any).categorySlug
    );
    setProductForm({
      name: p.name,
      tagline: p.tagline || '',
      categoryId: matchedCategory?.id || (p as any).categoryId || '',
      category: matchedCategory?.name || p.category,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      sku: p.sku || '',
      images: Array.isArray(p.images) ? p.images : [],
    });
    setEditingId(p.id);
    setAddingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const selectedCat = availableCategories.find(
        (c) => c.id === productForm.categoryId || c.name === productForm.category
      );
      if (!selectedCat && availableCategories.length > 0) {
        throw new Error('Please select a valid department category.');
      }

      const data = {
        name: productForm.name.trim(),
        tagline: productForm.tagline.trim(),
        categoryId: selectedCat?.id || productForm.categoryId,
        category: selectedCat?.name || productForm.category,
        categorySlug: selectedCat?.slug,
        description: productForm.description.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        images: productForm.images,
      };

      if (editingId) {
        await sellerApi(`/products/${editingId}`, json('PATCH', data));
        setMessage('Product updated successfully. Sensitive changes have been placed in PENDING review.');
      } else {
        await sellerApi('/products', json('POST', data));
        setMessage('New listing created and submitted for administrator review.');
      }

      setAddingProduct(false);
      setEditingId(null);
      setProductForm(initialProductForm);
      await load();
      setTab('products');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Seller item fulfillment update
  const handleUpdateItemFulfillment = async (orderId: string, productId: string, status: string) => {
    try {
      await sellerApi(`/orders/${orderId}/item`, {
        ...json('PATCH', { productId, status, note: `Item marked as ${status}` }),
      });
      setMessage(`Item fulfillment updated to ${status}.`);
      await load();
    } catch (e) {
      window.alert((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900">
      {/* 1. SIGN IN SCREEN */}
      {!token ? (
        <main className="min-h-screen grid place-items-center p-5">
          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6 animate-fade-in">
            <Link to="/" className="text-xs font-bold text-emerald-800 inline-flex gap-2 items-center hover:underline">
              <ArrowLeft size={14} /> Back to Marketplace
            </Link>

            <div className="flex items-center gap-3">
              <img src="/juw-logo.png" alt="JUW" className="h-16 w-16 object-contain bg-white rounded-2xl p-1.5 shadow-xs border border-slate-200" />
              <div>
                <p className="text-[10px] tracking-widest text-emerald-700 font-extrabold uppercase">JUW Marketplace</p>
                <h1 className="text-2xl font-display font-bold text-slate-900">Seller Studio</h1>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Sign in with your university account to manage your entrepreneurial listings, inventory, and fulfillment orders.
            </p>

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  className={inputClass}
                  type="email"
                  required
                  placeholder="student@juw.edu.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  className={inputClass}
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  {error}
                </p>
              )}

              <button
                disabled={busy}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-60 transition-all cursor-pointer"
              >
                {busy ? 'Authenticating…' : 'Sign In to Seller Studio'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              New JUW student entrepreneur? Sign in above with your Firebase email to submit your vendor verification application.
            </div>
          </div>
        </main>
      ) : !loaded ? (
        <main className="min-h-screen grid place-items-center">
          <div className="text-center space-y-3">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Verifying seller permissions in central registry…</p>
          </div>
        </main>
      ) : (
        <>
          {/* 2. AUTHENTICATED HEADER */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/juw-logo.png" alt="JUW" className="h-12 w-12 sm:h-14 sm:w-14 object-contain bg-white rounded-xl p-1 border border-slate-200 shadow-2xs" />
                <div>
                  <p className="text-[10px] text-emerald-800 uppercase tracking-widest font-extrabold">JUW Marketplace</p>
                  <h1 className="font-display font-bold text-base sm:text-lg text-slate-900">
                    Seller Studio {seller?.storeName ? `· ${seller.storeName}` : ''}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-slate-200 hidden sm:block transition-colors"
                >
                  View Marketplace
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {error && (
              <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div role="status" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{message}</span>
              </div>
            )}

            {/* 3. APPLICATION NOT YET SUBMITTED */}
            {!seller ? (
              <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Student Vendor Accreditation
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-2">
                    Apply to Sell at JUW Marketplace
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    All student creators and incubator ventures are verified by university administrators. Your university roll number is strictly confidential and not shared with buyers.
                  </p>
                </div>

                <form onSubmit={handleApply} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Student Name *</label>
                      <input
                        required
                        className={inputClass}
                        placeholder="e.g. Syeda Fatima Zahra"
                        value={application.studentName}
                        onChange={(e) => setApplication((a) => ({ ...a, studentName: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Student Roll Number *</label>
                      <input
                        required
                        className={inputClass}
                        placeholder="e.g. JUW-2022-CS-089"
                        value={application.studentRollNumber}
                        onChange={(e) => setApplication((a) => ({ ...a, studentRollNumber: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Faculty / Department *</label>
                      <select
                        className={inputClass}
                        value={application.department}
                        onChange={(e) => setApplication((a) => ({ ...a, department: e.target.value }))}
                      >
                        <option value="Department of Computer Science & IT">Computer Science & IT</option>
                        <option value="Department of Textile & Fashion Design">Textile & Fashion Design</option>
                        <option value="Department of Visual Arts & Fine Arts">Visual Arts & Fine Arts</option>
                        <option value="Department of Business Administration">Business Administration</option>
                        <option value="Department of Pharmacy">Faculty of Pharmacy</option>
                        <option value="Department of Food Science & Technology">Food Science & Nutrition</option>
                        <option value="JUW Incubation Center Incubatee">Incubation Center Incubatee</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Semester *</label>
                      <input
                        required
                        className={inputClass}
                        placeholder="e.g. 6th Semester"
                        value={application.semester}
                        onChange={(e) => setApplication((a) => ({ ...a, semester: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact WhatsApp / Phone *</label>
                      <input
                        required
                        className={inputClass}
                        placeholder="0300-1234567"
                        value={application.contactPhone}
                        onChange={(e) => setApplication((a) => ({ ...a, contactPhone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Store / Brand Name *</label>
                      <input
                        required
                        className={inputClass}
                        placeholder="e.g. Zahra Traditional Crafts"
                        value={application.storeName}
                        onChange={(e) => setApplication((a) => ({ ...a, storeName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Store Bio & Products Description</label>
                    <textarea
                      rows={3}
                      className={inputClass}
                      placeholder="Describe what items or handmade creations you plan to sell on the JUW marketplace..."
                      value={application.storeDescription}
                      onChange={(e) => setApplication((a) => ({ ...a, storeDescription: e.target.value }))}
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={application.acceptTerms}
                      onChange={(e) => setApplication((a) => ({ ...a, acceptTerms: e.target.checked }))}
                      className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>
                      I affirm that I am an enrolled student or authorized affiliate of Jinnah University for Women and agree to abide by campus entrepreneurial and dispatch standards.
                    </span>
                  </label>

                  <button
                    disabled={busy}
                    className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs shadow-md disabled:opacity-60 transition-all cursor-pointer mt-4"
                  >
                    {busy ? 'Submitting Application…' : 'Submit Seller Application for Verification'}
                  </button>
                </form>
              </div>
            ) : seller.verificationStatus !== 'VERIFIED' ? (
              /* 4. APPLICATION PENDING / REJECTED / SUSPENDED */
              <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
                  <ShieldCheck size={32} />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-3 py-0.5 rounded-full">
                    Status: {seller.verificationStatus.replace(/_/g, ' ')}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">
                    {seller.verificationStatus === 'PENDING_VERIFICATION' && 'Application Under Review'}
                    {seller.verificationStatus === 'REJECTED' && 'Application Requires Attention'}
                    {seller.verificationStatus === 'SUSPENDED' && 'Seller Account Suspended'}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {seller.verificationStatus === 'PENDING_VERIFICATION' &&
                      'Your application is registered in Cloud Firestore and queued for administrator verification. Refresh periodically.'}
                    {seller.verificationStatus === 'REJECTED' &&
                      (seller.rejectionReason || 'Please review your application details or contact the marketplace administration desk.')}
                    {seller.verificationStatus === 'SUSPENDED' &&
                      'Your selling privileges have been temporarily paused by administration.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-1 text-slate-700">
                  <p>Student Name: <strong>{seller.studentName}</strong></p>
                  <p>Roll Number: <strong>{seller.studentRollNumber}</strong></p>
                  <p>Department: <strong>{seller.department}</strong></p>
                </div>

                <button
                  onClick={() => void load()}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw size={14} /> Refresh Verification Status
                </button>
              </div>
            ) : (
              dashboard && (
                /* 5. VERIFIED SELLER EXPERIENCE */
                <div className="space-y-8">
                  {/* Top Bar Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Verified Campus Seller
                        </span>
                        <span className="text-xs text-slate-400">• {seller.department}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
                        Welcome, {seller.studentName.split(' ')[0]}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage your product catalog, real-time stock levels, and university fulfillment.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setProductForm(initialProductForm);
                        setEditingId(null);
                        setAddingProduct(true);
                        setTab('products');
                      }}
                      className="px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-md cursor-pointer transition-all shrink-0"
                    >
                      <Plus size={16} /> Add New Product
                    </button>
                  </div>

                  {/* Real Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Active Listings</span>
                        <Package size={18} className="text-emerald-700" />
                      </div>
                      <p className="text-2xl font-display font-extrabold text-slate-900">
                        {dashboard.products.filter((p) => p.status === 'ACTIVE').length}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {dashboard.products.length} total submitted
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Pending Approvals</span>
                        <Clock size={18} className="text-amber-600" />
                      </div>
                      <p className="text-2xl font-display font-extrabold text-slate-900">
                        {dashboard.products.filter((p) => p.status === 'PENDING').length}
                      </p>
                      <span className="text-[10px] text-slate-400">Awaiting admin review</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Customer Orders</span>
                        <ShoppingBag size={18} className="text-emerald-700" />
                      </div>
                      <p className="text-2xl font-display font-extrabold text-slate-900">
                        {dashboard.orders.length}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {dashboard.orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length} active
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Real Sales Revenue</span>
                        <BarChart3 size={18} className="text-emerald-700" />
                      </div>
                      <p className="text-2xl font-display font-extrabold text-slate-900">
                        {money(
                          dashboard.orders
                            .filter((o) => o.status === 'DELIVERED')
                            .reduce((sum, o) => sum + o.subtotal, 0)
                        )}
                      </p>
                      <span className="text-[10px] text-slate-400">Completed & paid deliveries</span>
                    </div>
                  </div>

                  {/* Nav Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
                    {[
                      { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
                      { id: 'products', label: `My Listings (${dashboard.products.length})`, Icon: Package },
                      { id: 'orders', label: `Orders for My Items (${dashboard.orders.length})`, Icon: ShoppingBag },
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id as any)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                          tab === id
                            ? 'bg-juw-navy-900 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: OVERVIEW */}
                  {tab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
                        <h3 className="font-display font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
                          Recent Products
                        </h3>
                        {dashboard.products.length === 0 ? (
                          <p className="text-xs text-slate-400 py-4 text-center">No products submitted yet.</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {dashboard.products.slice(0, 5).map((p) => (
                              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-slate-900">{p.name}</p>
                                  <span className="text-[11px] text-slate-400">
                                    {money(p.price)} • {p.stock} in stock
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.status === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {p.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
                        <h3 className="font-display font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
                          Recent Orders for Your Products
                        </h3>
                        {dashboard.orders.length === 0 ? (
                          <p className="text-xs text-slate-400 py-4 text-center">No orders received yet.</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {dashboard.orders.slice(0, 5).map((o) => (
                              <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-slate-900">Order #{o.orderNumber}</p>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(o.createdAt).toLocaleDateString()} • {o.items.length} item(s)
                                  </span>
                                </div>
                                <span className="font-extrabold text-slate-900">{money(o.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                  )}

                  {/* TAB 2: PRODUCTS */}
                  {tab === 'products' && (
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden space-y-6 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <h3 className="font-display font-bold text-lg text-slate-900">My Product Catalog</h3>
                          <p className="text-xs text-slate-400">
                            Products require administrator approval before becoming publicly visible in the marketplace catalog.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setAddingProduct(!addingProduct);
                            setEditingId(null);
                            setProductForm(initialProductForm);
                          }}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
                        >
                          {addingProduct ? 'Cancel / Close Form' : '+ Add Listing'}
                        </button>
                      </div>

                      {/* ADD / EDIT FORM */}
                      {addingProduct && (
                        <form onSubmit={handleSaveProduct} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                          <h4 className="font-bold text-sm text-slate-900">
                            {editingId ? 'Edit Product Details' : 'Create New Product Listing'}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
                              <input
                                required
                                className={inputClass}
                                placeholder="e.g. Hand-embroidered Velvet Scarf"
                                value={productForm.name}
                                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Category / Department *</label>
                              {availableCategories.length === 0 ? (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>No active department categories available. Please contact university administrators.</span>
                                </div>
                              ) : (
                                <select
                                  required
                                  className={inputClass}
                                  value={productForm.categoryId || (availableCategories.find(c => c.name === productForm.category)?.id || '')}
                                  onChange={(e) => {
                                    const catId = e.target.value;
                                    const sel = availableCategories.find(c => c.id === catId);
                                    if (sel) {
                                      setProductForm((f) => ({ ...f, categoryId: sel.id, category: sel.name }));
                                    }
                                  }}
                                >
                                  <option value="" disabled>Select Department Category</option>
                                  {availableCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name} {cat.departmentTag ? `(${cat.departmentTag})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Price in PKR *</label>
                              <input
                                required
                                type="number"
                                min="1"
                                step="1"
                                className={inputClass}
                                placeholder="1500"
                                value={productForm.price}
                                onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Available Stock Quantity *</label>
                              <input
                                required
                                type="number"
                                min="0"
                                step="1"
                                className={inputClass}
                                placeholder="10"
                                value={productForm.stock}
                                onChange={(e) => setProductForm((f) => ({ ...f, stock: e.target.value }))}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 mb-1">Tagline (Short Summary)</label>
                              <input
                                className={inputClass}
                                placeholder="e.g. 100% pure silk with traditional zari needlework"
                                value={productForm.tagline}
                                onChange={(e) => setProductForm((f) => ({ ...f, tagline: e.target.value }))}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
                              <textarea
                                required
                                rows={3}
                                className={inputClass}
                                placeholder="Provide craftsmanship details, materials, sizing, and care instructions..."
                                value={productForm.description}
                                onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* CLOUDINARY IMAGE UPLOADER */}
                          <div className="pt-2 border-t border-slate-200 space-y-3">
                            <label className="block text-xs font-bold text-slate-700">
                              Product Photos (Upload to Cloudinary or Provide HTTPS URL)
                            </label>

                            <div className="flex flex-wrap items-center gap-3">
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageFileChange}
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                              />

                              <button
                                type="button"
                                disabled={imageUploadBusy}
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2.5 bg-white border border-slate-300 hover:border-emerald-700 hover:bg-emerald-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                              >
                                <Upload size={14} className="text-emerald-700" />
                                {imageUploadBusy ? 'Uploading to Cloudinary…' : 'Choose Local Image (Max 2MB)'}
                              </button>

                              <div className="flex-1 flex gap-2 min-w-[200px]">
                                <input
                                  type="url"
                                  placeholder="Or paste secure image HTTPS URL"
                                  value={manualImageUrl}
                                  onChange={(e) => setManualImageUrl(e.target.value)}
                                  className={inputClass}
                                />
                                <button
                                  type="button"
                                  onClick={addManualImage}
                                  className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-slate-900 transition-colors"
                                >
                                  Add URL
                                </button>
                              </div>
                            </div>

                            {/* Image Previews */}
                            {productForm.images.length > 0 && (
                              <div className="flex flex-wrap gap-3 pt-2">
                                {productForm.images.map((img, idx) => (
                                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group bg-white shadow-2xs">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(idx)}
                                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                      title="Remove Image"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            <button
                              disabled={busy}
                              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-60 transition-all cursor-pointer"
                            >
                              {busy ? 'Submitting…' : editingId ? 'Submit Product Changes for Review' : 'Submit Product for Approval'}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Product Listings Table */}
                      <div className="divide-y divide-slate-100">
                        {dashboard.products.map((p) => (
                          <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ImageIcon size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">{p.name}</h4>
                                <p className="text-[11px] text-slate-500">
                                  {money(p.price)} • {p.stock} units in stock • {p.category}
                                </p>
                                {p.adminFeedback && (
                                  <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                    Admin Feedback: {p.adminFeedback}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  p.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : p.status === 'NEEDS_CHANGES'
                                    ? 'bg-orange-100 text-orange-800'
                                    : p.status === 'OUT_OF_STOCK'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.status.replace(/_/g, ' ')}
                              </span>

                              <button
                                onClick={() => startEditProduct(p)}
                                className="px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                            </div>
                          </div>
                        ))}

                        {dashboard.products.length === 0 && (
                          <div className="py-12 text-center space-y-2">
                            <Package size={32} className="mx-auto text-slate-300" />
                            <p className="text-xs text-slate-500">You haven't listed any items yet. Click "+ Add Listing" to start.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* TAB 3: ORDERS */}
                  {tab === 'orders' && (
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-6">
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900">Orders Containing Your Products</h3>
                        <p className="text-xs text-slate-400">
                          Update fulfillment status for your portion of customer orders. Only your items are displayed.
                        </p>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {dashboard.orders.map((o) => (
                          <div key={o.id} className="py-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                              <div>
                                <span className="font-bold text-xs text-slate-900">Order #{o.orderNumber}</span>
                                <span className="text-[11px] text-slate-400 ml-2">
                                  {new Date(o.createdAt).toLocaleDateString()} • Customer: {o.customerName}
                                </span>
                              </div>
                              <span className="font-bold text-xs text-emerald-800">
                                Your items subtotal: {money(o.subtotal)}
                              </span>
                            </div>

                            {/* Order Items with fulfillment actions */}
                            <div className="space-y-3">
                              {o.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900">{item.name}</p>
                                    <p className="text-[11px] text-slate-500">
                                      Qty: {item.quantity} • {money(item.price)} each • Total: {money(item.price * item.quantity)}
                                    </p>
                                    <span className="inline-block mt-1 text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      Item Status: {item.fulfillmentStatus || 'PENDING'}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemFulfillment(o.id, item.productId, 'PROCESSING')}
                                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Mark Processing
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemFulfillment(o.id, item.productId, 'READY')}
                                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Ready for Pickup
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemFulfillment(o.id, item.productId, 'DISPATCHED')}
                                      className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Dispatched
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {dashboard.orders.length === 0 && (
                          <div className="py-12 text-center space-y-2">
                            <ShoppingBag size={32} className="mx-auto text-slate-300" />
                            <p className="text-xs text-slate-500">No customer orders have been placed for your items yet.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )
            )}
          </main>
        </>
      )}
    </div>
  );
}
