import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Archive,
  ArrowUpDown,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Tag,
  Star,
  Sparkles,
  ShoppingBag,
  Shirt,
  Palette,
  Smile,
  Droplet,
  Cake,
  Home,
  Gift,
  Leaf,
  Cpu,
  HeartPulse,
  Briefcase,
  BookOpen,
  Camera,
  Scissors,
  Coffee,
  Wrench,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Category, CategoryStatus } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

// Icon catalog for category selection
const ICON_OPTIONS = [
  { name: 'Shirt', component: Shirt, label: 'Clothing / Fashion' },
  { name: 'Palette', component: Palette, label: 'Art & Design' },
  { name: 'Sparkles', component: Sparkles, label: 'Accessories / Gems' },
  { name: 'Smile', component: Smile, label: 'Beauty & Skincare' },
  { name: 'Droplet', component: Droplet, label: 'Fragrances / Attar' },
  { name: 'Cake', component: Cake, label: 'Bakery & Food' },
  { name: 'Home', component: Home, label: 'Textile & Decor' },
  { name: 'Gift', component: Gift, label: 'Gift & Stationery' },
  { name: 'Leaf', component: Leaf, label: 'Eco & Sustainable' },
  { name: 'Cpu', component: Cpu, label: 'Electronics & 3D' },
  { name: 'HeartPulse', component: HeartPulse, label: 'Health & Wellness' },
  { name: 'Briefcase', component: Briefcase, label: 'Services / Projects' },
  { name: 'Tag', component: Tag, label: 'General / Deals' },
  { name: 'ShoppingBag', component: ShoppingBag, label: 'Merchandise' },
  { name: 'BookOpen', component: BookOpen, label: 'Academics & Books' },
  { name: 'Camera', component: Camera, label: 'Photography' },
  { name: 'Scissors', component: Scissors, label: 'Craft & Stitching' },
  { name: 'Coffee', component: Coffee, label: 'Beverages & Café' },
];

export const AdminCategories: React.FC = () => {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
    reorderCategories,
    uploadCategoryImage,
    isBootstrapping,
    bootstrapError,
    refreshRemote,
  } = useAdmin();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'hidden' | 'archived'>('ALL');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [description, setDescription] = useState('');
  const [departmentTag, setDepartmentTag] = useState('');
  const [iconName, setIconName] = useState('Tag');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [status, setStatus] = useState<CategoryStatus>('active');
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  // Image Upload states
  const [imageUploadTab, setImageUploadTab] = useState<'upload' | 'url'>('upload');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: auto-slug generation
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugCustomized && !editingCategory) {
      setSlug(slugify(val));
    }
  };

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIsSlugCustomized(false);
    setDescription('');
    setDepartmentTag('');
    setIconName('Tag');
    setImageUrl('');
    setImagePublicId('');
    setStatus('active');
    setIsFeatured(false);
    setSortOrder(categories.length + 1);
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIsSlugCustomized(true);
    setDescription(cat.description || '');
    setDepartmentTag(cat.departmentTag || '');
    setIconName(cat.iconName || 'Tag');
    setImageUrl(cat.imageUrl || cat.image || '');
    setImagePublicId(cat.imagePublicId || '');
    setStatus(cat.status || 'active');
    setIsFeatured(Boolean(cat.isFeatured ?? cat.featured));
    setSortOrder(cat.sortOrder ?? 1);
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Cloudinary image upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      setFormError('Please select a PNG, JPEG, or WebP image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('File size exceeds 2 MB. Please select a smaller photo.');
      return;
    }

    setUploadBusy(true);
    setUploadProgress('Preparing image...');
    setFormError('');

    try {
      const reader = new FileReader();
      const base64Data: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      setUploadProgress('Uploading to Cloudinary...');
      const res = await uploadCategoryImage(base64Data);
      setImageUrl(res.url);
      setImagePublicId(res.publicId);
      setUploadProgress('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Cloudinary image upload failed');
      setUploadProgress('');
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save form handler
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    const cleanSlug = slugify(slug || name);
    if (!cleanSlug) {
      setFormError('A valid slug is required.');
      return;
    }

    setFormBusy(true);
    setFormError('');

    try {
      const payload: Partial<Category> = {
        name: name.trim(),
        slug: cleanSlug,
        description: description.trim(),
        departmentTag: departmentTag.trim(),
        iconName: iconName.trim(),
        imageUrl: imageUrl.trim(),
        imagePublicId: imagePublicId.trim(),
        status,
        isFeatured,
        sortOrder: Number(sortOrder) || 1,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await addCategory(payload);
      }

      setIsFormModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setFormBusy(false);
    }
  };

  // Quick toggle status
  const handleQuickToggleStatus = async (cat: Category) => {
    const nextStatus = cat.status === 'active' ? 'hidden' : 'active';
    try {
      await toggleCategoryStatus(cat.id, nextStatus);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category status');
    }
  };

  // Initiate Delete / Archive
  const handleOpenDelete = (cat: Category) => {
    setCategoryToDelete(cat);
    // Find first alternative active category for reassignment
    const alt = categories.find((c) => c.id !== cat.id && c.status === 'active');
    setReassignTargetId(alt ? alt.id : '');
    setIsDeleteModalOpen(true);
  };

  // Confirm safe archive or deletion
  const handleConfirmDelete = async (action: 'direct' | 'archive' | 'reassign') => {
    if (!categoryToDelete) return;
    try {
      if (action === 'archive') {
        await deleteCategory(categoryToDelete.id, { action: 'archive' });
      } else if (action === 'reassign') {
        if (!reassignTargetId) {
          alert('Please select a target category for reassignment.');
          return;
        }
        await deleteCategory(categoryToDelete.id, { action: 'reassign', targetCategoryId: reassignTargetId });
      } else {
        await deleteCategory(categoryToDelete.id);
      }
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  // Copy slug helper
  const handleCopySlug = (categorySlug: string) => {
    navigator.clipboard.writeText(categorySlug);
    setCopiedSlug(categorySlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Dynamic calculations
  const totalCategoriesCount = categories.length;
  const activeCategoriesCount = categories.filter((c) => c.status === 'active').length;
  const hiddenCategoriesCount = categories.filter((c) => c.status === 'hidden' || c.status === 'archived').length;
  const totalApprovedProductsCount = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        // Status filter
        if (statusFilter !== 'ALL' && cat.status !== statusFilter) return false;
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = cat.name.toLowerCase().includes(q);
          const matchSlug = cat.slug.toLowerCase().includes(q);
          const matchDesc = (cat.description || '').toLowerCase().includes(q);
          const matchDept = (cat.departmentTag || '').toLowerCase().includes(q);
          if (!matchName && !matchSlug && !matchDesc && !matchDept) return false;
        }
        return true;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories, statusFilter, searchTerm]);

  // Render Category Icon dynamically
  const renderIcon = (nameStr?: string, className = 'w-5 h-5') => {
    const matched = ICON_OPTIONS.find((item) => item.name === nameStr);
    const Comp = matched ? matched.component : Tag;
    return <Comp className={className} />;
  };

  // Determine if we're in read-only fallback mode (bootstrap failed but public categories loaded)
  const isReadOnlyFallback = !!bootstrapError && categories.length > 0;

  // Loading skeleton
  if (isBootstrapping) {
    return (
      <div className="space-y-8 animate-pulse pb-16">
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-12 bg-slate-100 rounded-2xl" />
        <div className="space-y-3">
          {[0,1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 0. STATUS BANNERS */}
      {bootstrapError && categories.length === 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-2xl">
          <WifiOff className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Cannot connect to admin server</p>
            <p className="text-xs mt-0.5 text-red-600 break-words">{bootstrapError}</p>
            <p className="text-xs mt-1 text-red-500">Make sure the backend server is running on port 4000 and you are signed in as an admin.</p>
          </div>
          <button
            onClick={() => void refreshRemote()}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {isReadOnlyFallback && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Read-only preview — admin session unavailable</p>
            <p className="text-xs mt-0.5 text-amber-700 break-words">Showing public category data. Changes cannot be saved until the admin server is reachable and you are authenticated.</p>
            <p className="text-xs mt-1 text-amber-600 font-mono">{bootstrapError}</p>
          </div>
          <button
            onClick={() => void refreshRemote()}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Category Management</h1>
              <p className="text-sm text-slate-500">
                Organize campus departments, manage dynamic slugs, visual icons, display order, and live public visibility.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 shadow-md shadow-emerald-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* 2. STATS & METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Departments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCategoriesCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Active in Store</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCategoriesCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Hidden / Draft</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{hiddenCategoriesCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <EyeOff className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Approved Products</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{totalApprovedProductsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by category name, slug, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full md:w-auto">
          {(
            [
              { id: 'ALL', label: 'All', count: totalCategoriesCount },
              { id: 'active', label: 'Active', count: activeCategoriesCount },
              { id: 'hidden', label: 'Hidden', count: hiddenCategoriesCount },
              { id: 'archived', label: 'Archived', count: categories.filter((c) => c.status === 'archived').length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. CATEGORIES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4 w-16 text-center">Order</th>
                <th className="py-4 px-4">Category & Department</th>
                <th className="py-4 px-4">Slug & URL</th>
                <th className="py-4 px-4 text-center">Approved Products</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                    <p className="font-medium text-slate-600">No categories match your filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your search query or add a new department category.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const hasImage = Boolean(cat.imageUrl || cat.image);
                  const isFeaturedCat = Boolean(cat.isFeatured ?? cat.featured);
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Order */}
                      <td className="py-4 px-4 text-center font-semibold text-slate-500">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs text-slate-700 font-mono">
                          {cat.sortOrder ?? '—'}
                        </span>
                      </td>

                      {/* Category Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {/* Image Thumbnail / Icon Fallback */}
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 flex items-center justify-center">
                            {hasImage ? (
                              <img
                                src={cat.imageUrl || cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon on error
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="text-emerald-700">{renderIcon(cat.iconName, 'w-6 h-6')}</div>
                            )}
                            {isFeaturedCat && (
                              <span
                                title="Featured on Homepage"
                                className="absolute bottom-0 right-0 bg-amber-500 text-white p-0.5 rounded-tl-md shadow-xs"
                              >
                                <Star className="w-2.5 h-2.5 fill-current" />
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 truncate">{cat.name}</span>
                              {isFeaturedCat && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              {cat.departmentTag && (
                                <span className="text-emerald-700 font-medium">{cat.departmentTag}</span>
                              )}
                              {cat.departmentTag && <span>•</span>}
                              <span className="truncate max-w-xs">{cat.description || 'No description provided'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                          <span>{cat.slug}</span>
                          <button
                            onClick={() => handleCopySlug(cat.slug)}
                            title="Copy slug"
                            className="text-slate-400 hover:text-slate-700 transition-colors ml-1"
                          >
                            {copiedSlug === cat.slug ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Approved Product Count */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            (cat.productCount || 0) > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{cat.productCount || 0} Products</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            cat.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : cat.status === 'hidden'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.status === 'active'
                                ? 'bg-emerald-500 animate-pulse'
                                : cat.status === 'hidden'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {cat.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Publish / Hide toggle */}
                          <button
                            onClick={() => handleQuickToggleStatus(cat)}
                            title={cat.status === 'active' ? 'Hide Category from Public' : 'Publish Category Live'}
                            className={`p-2 rounded-xl border transition-colors ${
                              cat.status === 'active'
                                ? 'border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                                : 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                            }`}
                          >
                            {cat.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            title="Edit Category Details"
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete / Safe Archive button */}
                          <button
                            onClick={() => handleOpenDelete(cat)}
                            title="Delete or Archive Category"
                            className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT CATEGORY MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !formBusy && setIsFormModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Layers className="w-5 h-5" />
            </div>
            <span>{editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}</span>
          </div>
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCategory} className="space-y-6 pt-2">
          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fashion & Clothing"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Category Slug <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Lowercase, hyphens only</span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. fashion-clothing"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugCustomized(true);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          {/* Department & Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Associated Department / Org
              </label>
              <input
                type="text"
                placeholder="e.g. Dept. of Textile Design"
                value={departmentTag}
                onChange={(e) => setDepartmentTag(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Order (Sort Priority)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of items, student craft, and campus creations in this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 resize-none"
            />
          </div>

          {/* Category Image (Cloudinary Upload / URL) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Category Banner Image
                </label>
                <p className="text-xs text-slate-500">
                  Upload directly to Cloudinary or provide an HTTPS image URL
                </p>
              </div>
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setImageUploadTab('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    imageUploadTab === 'upload' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadTab('url')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    imageUploadTab === 'url' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {/* Cloudinary Upload Tab */}
            {imageUploadTab === 'upload' ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    uploadBusy
                      ? 'border-emerald-300 bg-emerald-50/50 cursor-wait'
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleImageFileChange}
                    disabled={uploadBusy}
                  />
                  <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">
                    {uploadBusy ? (uploadProgress || 'Uploading...') : 'Click to Upload Category Image'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPEG, WebP up to 2 MB (Cloudinary hosted)</p>
                </div>

                {imageUrl && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 group">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImagePublicId('');
                      }}
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
                {imageUrl && (
                  <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visual Icon Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Department Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
              {ICON_OPTIONS.map((item) => {
                const IconComp = item.component;
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    title={item.label}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <IconComp className="w-5 h-5 mb-1" />
                    <span className="text-[10px] truncate w-full">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Featured Options */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Visibility Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CategoryStatus)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              >
                <option value="active">Active (Visible in Customer & Seller Portals)</option>
                <option value="hidden">Hidden (Draft / Hidden from Public Customers)</option>
                <option value="archived">Archived (Safe Read-Only Archive)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                id="isFeaturedToggle"
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500"
              />
              <label htmlFor="isFeaturedToggle" className="text-sm font-semibold text-slate-800 cursor-pointer select-none">
                Featured on Homepage (Top highlight)
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={formBusy}
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formBusy || uploadBusy}
              className="min-w-32"
            >
              {formBusy ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. SAFE DELETION / REASSIGNMENT MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span>
              {categoryToDelete && (categoryToDelete.productCount || 0) > 0
                ? 'Protected Category Deletion'
                : 'Confirm Category Deletion'}
            </span>
          </div>
        }
        maxWidth="lg"
      >
        {categoryToDelete && (
          <div className="space-y-5 pt-2 text-slate-700">
            {(categoryToDelete.productCount || 0) > 0 ? (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Active Product Association Detected</span>
                  </div>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    Category <strong className="font-semibold text-slate-900">"{categoryToDelete.name}"</strong> has{' '}
                    <strong className="font-semibold text-slate-900">{categoryToDelete.productCount} approved product(s)</strong>{' '}
                    referencing it. Destructive deletion is blocked to prevent broken references and orphaned inventory.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Select a Safe Resolution Option:
                  </p>

                  {/* Option 1: Safe Archive */}
                  <div className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 transition-all bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <Archive className="w-4 h-4 text-emerald-600" />
                          <span>Option 1: Safe Archive (Recommended)</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Hides this category from public browsing and seller creation while safely maintaining all historical product associations and order records.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConfirmDelete('archive')}
                        className="shrink-0"
                      >
                        Safe Archive
                      </Button>
                    </div>
                  </div>

                  {/* Option 2: Reassign Products */}
                  <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-500 transition-all bg-white space-y-3">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <ArrowUpDown className="w-4 h-4 text-blue-600" />
                        <span>Option 2: Reassign Products & Delete</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Atomically moves all {categoryToDelete.productCount} product(s) to another active category, then safely removes this category.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
                      <select
                        value={reassignTargetId}
                        onChange={(e) => setReassignTargetId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                      >
                        <option value="">Select Target Destination Category...</option>
                        {categories
                          .filter((c) => c.id !== categoryToDelete.id && c.status === 'active')
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.departmentTag || c.slug})
                            </option>
                          ))}
                      </select>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!reassignTargetId}
                        onClick={() => handleConfirmDelete('reassign')}
                        className="w-full sm:w-auto shrink-0 whitespace-nowrap"
                      >
                        Reassign & Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Are you sure you want to permanently delete category{' '}
                  <strong className="text-slate-900 font-semibold">"{categoryToDelete.name}"</strong>?
                </p>
                <p className="text-xs text-slate-400">
                  This category has no assigned products. This action cannot be undone.
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleConfirmDelete('direct')}
                  >
                    Delete Category
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
