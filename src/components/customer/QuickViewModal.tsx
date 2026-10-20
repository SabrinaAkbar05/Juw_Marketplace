import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, CheckCircle2, ShieldCheck, Sparkles, X, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Rating } from '../common/Rating';
import { Button } from '../common/Button';
import { useMarketplace } from '../../context/MarketplaceContext';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useMarketplace();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" showCloseButton={true}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImage === idx ? 'border-emerald-600 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-emerald-700 uppercase tracking-wider">
                {product.category}
              </span>
              <span className="text-slate-400 font-medium">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl font-bold font-display text-slate-900 mb-2">
              {product.name}
            </h2>

            <div className="flex items-center gap-4 mb-3">
              <Rating rating={product.rating || 4.9} showCount count={product.reviewCount || 18} size="sm" />
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                In Stock ({product.stock} units)
              </span>
            </div>

            <div className="text-2xl font-extrabold font-display text-slate-900 mb-4">
              Rs. {product.price.toLocaleString()}
              {product.originalPrice && (
                <span className="text-sm text-slate-400 line-through font-normal ml-2">
                  Rs. {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {product.description}
            </p>

            {/* Department tag */}
            {product.sellerDepartment && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 mb-4">
                <span className="font-bold text-slate-900 block mb-0.5">Crafted at:</span>
                <span>{product.sellerDepartment} (Jinnah University for Women)</span>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Quantity Selector & Action Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-xs text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>

              <Button
                variant="emerald"
                size="md"
                className="flex-1"
                onClick={handleAddToCart}
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                Add to Bag • Rs. {(product.price * quantity).toLocaleString()}
              </Button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
              >
                <span>View Complete Product Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-slate-400 text-[11px]">Free On-Campus Pickup</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
