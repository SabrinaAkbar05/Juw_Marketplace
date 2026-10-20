import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  RotateCcw,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../../components/customer/ProductCard';
import { QuickViewModal } from '../../components/customer/QuickViewModal';
import { Product } from '../../types';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories } = useMarketplace();

  // Search & Filter parameters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialFilter = searchParams.get('filter') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [priceRange, setPriceRange] = useState<number>(6000);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search term
      if (
        searchTerm &&
        !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        return false;
      }

      // Category
      if (selectedCategory) {
        const catObj = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
        const matchesCat =
          product.categoryId === selectedCategory ||
          product.categorySlug === selectedCategory ||
          product.category === selectedCategory ||
          (catObj && (product.categoryId === catObj.id || product.categorySlug === catObj.slug || product.category.toLowerCase() === catObj.name.toLowerCase()));
        if (!matchesCat) return false;
      }

      // Quick filter
      if (initialFilter === 'new' && !product.isNewArrival) return false;
      if (initialFilter === 'bestseller' && !product.isBestSeller) return false;

      // Price
      if (product.price > priceRange) return false;

      // In stock
      if (inStockOnly && product.stock <= 0) return false;

      // Rating
      if (minRating > 0 && product.rating < minRating) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });
  }, [products, searchTerm, selectedCategory, initialFilter, priceRange, inStockOnly, minRating, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange(6000);
    setSortBy('popular');
    setInStockOnly(false);
    setMinRating(0);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-juw-navy-900 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
            Official Student Showcase
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-white mt-2">
            All Marketplace Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Support Jinnah University for Women student entrepreneurs. 100% university-curated handcrafted fashion, calligraphy, organic skincare, and freshly baked goods.
          </p>
        </div>
      </div>

      {/* Main Filter & Products Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar Filter Panel (Desktop) */}
        <aside className="hidden lg:block bg-white rounded-2xl p-6 border border-slate-100 shadow-card space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
              <span>Filters</span>
            </h3>
            {(selectedCategory || searchTerm || priceRange < 6000 || inStockOnly || minRating > 0) && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Department Categories
            </label>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                  selectedCategory === ''
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Departments</span>
                <span className="text-[10px] text-slate-400">{products.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-400">{cat.productCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
              <span>Max Price</span>
              <span className="text-emerald-700 font-display font-extrabold">
                Rs. {priceRange.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="6000"
              step="250"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Rs. 500</span>
              <span>Rs. 6,000+</span>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Customer Rating
            </label>
            <div className="space-y-1">
              {[4.5, 4.0, 3.0].map((ratingVal) => (
                <button
                  key={ratingVal}
                  onClick={() => setMinRating(minRating === ratingVal ? 0 : ratingVal)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    minRating === ratingVal
                      ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{ratingVal} Stars & above</span>
                  <span className="text-amber-500 font-bold">★</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock Filter */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Right Products Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search in Catalog */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search products, materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Mobile Filter Toggle */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <span className="text-xs text-slate-500 hidden sm:inline">
                Showing <strong>{filteredProducts.length}</strong> items
              </span>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden md:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Grid / List Switcher */}
              <div className="hidden sm:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(selectedCategory || searchTerm || minRating > 0 || initialFilter) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Active Filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="hover:text-emerald-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                  "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                  {minRating}+ Stars
                  <button onClick={() => setMinRating(0)} className="hover:text-amber-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No Products Found"
              description="Try adjusting your filters or search keywords to discover other university student creations."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col sm:flex-row gap-5 items-center hover:shadow-card-hover transition-all"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full sm:w-40 h-40 object-cover rounded-xl bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-700 uppercase">
                        {product.category}
                      </span>
                      <span className="text-slate-400">{product.sellerDepartment}</span>
                    </div>
                    <h3 className="font-bold font-display text-base text-slate-900">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-extrabold font-display text-slate-900">
                        Rs. {product.price.toLocaleString()}
                      </span>
                      <Button
                        variant="emerald"
                        size="sm"
                        onClick={() => setQuickViewProduct(product)}
                      >
                        Preview & Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
