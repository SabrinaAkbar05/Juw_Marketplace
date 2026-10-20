import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import { Product } from '../../types';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Rating } from '../common/Rating';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useMarketplace();
  const isWishlisted = isInWishlist(product.id);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Container with Badges & Quick Action Floating Buttons */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.isNewArrival && (
            <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-amber-600/90 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
              Best Seller
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 cursor-pointer shadow-xs ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-white/80 text-slate-600 hover:bg-white hover:text-rose-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Quick View Button on Hover */}
        {onQuickView && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hidden sm:block">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="w-full py-2 px-3 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md backdrop-blur-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Quick Preview</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Department Tag */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[10px]">
              {product.category}
            </span>
            {product.sellerDepartment && (
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={product.sellerDepartment}>
                {product.sellerDepartment.replace('Department of', 'Dept.')}
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${product.id}`}
            className="block font-display font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 mb-1"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Tagline / Short Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
            {product.tagline}
          </p>
        </div>

        <div>
          {/* Ratings */}
          <div className="mb-3">
            <Rating
              rating={product.rating || 4.8}
              showCount
              count={product.reviewCount || 12}
              size="sm"
            />
          </div>

          {/* Price & Add to Cart Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-base font-extrabold font-display text-slate-900 tracking-tight">
                Rs. {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-[11px] text-slate-400 line-through">
                  Rs. {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer"
              title="Add to Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
