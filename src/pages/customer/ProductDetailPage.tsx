import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Share2,
  ArrowLeft,
  Star,
  Package,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../../components/customer/ProductCard';
import { Rating } from '../../components/common/Rating';
import { Button } from '../../components/common/Button';

import { EmptyState } from '../../components/common/EmptyState';
import { Review } from '../../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    products,
    addToCart,
    toggleWishlist,
    isInWishlist,
    addToast,
  } = useMarketplace();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Product Not Found"
          description="The item you requested may have been archived or is out of stock."
          actionText="Back to Marketplace"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const productReviews: Review[] = [];
  const relatedProducts = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Product link copied to clipboard.',
    });
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-700">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link to="/shop" className="hover:text-emerald-700">Shop</Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link to={`/categories/${product.categorySlug}`} className="hover:text-emerald-700">
          {product.category}
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-card relative group">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-lg shadow-sm">
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImage === idx
                      ? 'border-emerald-600 ring-2 ring-emerald-100 scale-102'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & Purchase Column */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {product.category}
              </span>
              <span className="text-slate-400 font-medium">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 leading-tight mb-2">
              {product.name}
            </h1>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4 mb-4">
              <Rating
                rating={product.rating || 4.9}
                showCount
                count={product.reviewCount || 16}
                size="md"
              />
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock ({product.stock} units available)
              </span>
            </div>

            {/* Price block */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-extrabold font-display text-slate-900 tracking-tight">
                Rs. {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-base text-slate-400 line-through">
                  Rs. {product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-slate-500 ml-auto font-medium">
                Inclusive of all university taxes
              </span>
            </div>

            {/* Short Tagline */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Department attribution without individual contact */}
            {product.sellerDepartment && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-center gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold block">Artisan Accreditation:</span>
                  <span>Handcrafted by students of <strong>{product.sellerDepartment}</strong>, Jinnah University for Women.</span>
                </div>
              </div>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-sm text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>

              <Button
                variant="emerald"
                size="lg"
                className="flex-1"
                onClick={() => addToCart(product, quantity)}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
              >
                Add to Bag
              </Button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Share Product"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleBuyNow}
            >
              Buy Now with Instant Escrow
            </Button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Campus Pickup or Home Delivery</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>JUW Admin Support Mediation</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Quality Assurance Replacement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Overview, Specs, Reviews */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-card">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 gap-6 mb-8 text-sm font-bold">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Materials
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'specs'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Customer Reviews</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs">
              {productReviews.length || 3}
            </span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'details' && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>{product.description}</p>
            {product.materialsOrIngredients && product.materialsOrIngredients.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  Materials / Botanical Ingredients:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.materialsOrIngredients.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Specs */}
        {activeTab === 'specs' && (
          <div className="space-y-4">
            <div className="max-w-xl divide-y divide-slate-100 text-xs">
              {product.specifications ? (
                Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="py-2.5 flex justify-between">
                    <span className="font-bold text-slate-700">{key}</span>
                    <span className="text-slate-600">{String(value)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Standard artisan specifications apply.</p>
              )}
              <div className="py-2.5 flex justify-between">
                <span className="font-bold text-slate-700">University Faculty</span>
                <span className="text-slate-600">{product.sellerDepartment || 'Jinnah University for Women'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="font-bold text-slate-700">Authenticity</span>
                <span className="text-emerald-700 font-semibold">100% Student Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl">
              <div className="text-center sm:text-left">
                <div className="text-4xl font-extrabold font-display text-slate-900">
                  {product.rating || 4.9}
                </div>
                <Rating rating={product.rating || 4.9} size="md" />
                <p className="text-xs text-slate-400 mt-1">
                  Based on verified campus purchases
                </p>
              </div>
              <div className="sm:border-l sm:border-slate-200 sm:pl-6 text-xs text-slate-500">
                <p>100% of customers recommend products from the {product.sellerDepartment || 'JUW Student Incubator'}.</p>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {productReviews.length > 0 ? (
                productReviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{rev.customerName}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{rev.createdAt}</span>
                    </div>
                    <Rating rating={rev.rating} size="sm" />
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No written reviews yet for this newly listed batch. Be the first student or faculty member to review!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-display text-slate-900">
              More from {product.category}
            </h3>
            <Link
              to={`/categories/${product.categorySlug}`}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View Category →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
