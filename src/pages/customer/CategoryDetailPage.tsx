import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../../components/customer/ProductCard';
import { QuickViewModal } from '../../components/customer/QuickViewModal';
import { Product } from '../../types';
import { EmptyState } from '../../components/common/EmptyState';

export const CategoryDetailPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const { products, categories } = useMarketplace();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const category = categories.find((c) => (c.slug || '').toLowerCase() === (categorySlug || '').toLowerCase() || c.id === categorySlug);
  const categoryProducts = products.filter((p) => {
    if (!category) return false;
    return (
      p.categoryId === category.id ||
      (p.categorySlug && p.categorySlug.toLowerCase() === category.slug.toLowerCase()) ||
      (p.category && p.category.toLowerCase() === category.name.toLowerCase())
    );
  });

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Department Category Not Found"
          description="The department category you requested does not exist or has been temporarily hidden."
          actionText="Back to All Categories"
          onAction={() => navigate('/categories')}
        />
      </div>
    );
  }

  const categoryImage = category.imageUrl || category.image;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/categories"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Departments</span>
      </Link>

      {/* Category Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-juw-navy-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        {categoryImage && (
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${categoryImage})` }}
          />
        )}
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-md border border-emerald-500/40">
            {category.departmentTag}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-display">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {category.description}
          </p>
          <div className="pt-2 text-xs text-emerald-300 font-semibold">
            {categoryProducts.length} verified listings in this department
          </div>
        </div>
      </div>

      {/* Product List */}
      {categoryProducts.length === 0 ? (
        <EmptyState
          title="No Products Currently Available"
          description="New student creations for this department are currently undergoing moderation review."
          actionText="Browse Shop Catalog"
          onAction={() => navigate('/shop')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
