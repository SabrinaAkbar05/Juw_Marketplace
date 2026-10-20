import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Sparkles,
  ArrowLeft,
  Heart,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartCount,
    toggleWishlist,
    addToast,
  } = useMarketplace();

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryType, setDeliveryType] = useState<'CAMPUS' | 'HOME'>('CAMPUS');

  const deliveryFee = deliveryType === 'CAMPUS' ? 0 : 200;
  const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'JUW10' || couponCode.toUpperCase() === 'STUDENT10') {
      const discountVal = Math.round(cartSubtotal * 0.1);
      setDiscount(discountVal);
      addToast({
        type: 'success',
        title: 'Coupon Applied!',
        message: `10% Student Entrepreneurship Discount applied (-Rs. ${discountVal.toLocaleString()}).`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Invalid Coupon Code',
        message: 'Try using coupon code "JUW10" for a 10% campus discount.',
      });
    }
  };

  const handleMoveToWishlist = (productId: string) => {
    toggleWishlist(productId);
    removeFromCart(productId);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-slate-400" />}
          title="Your Shopping Bag is Empty"
          description="Explore university creations across fashion, Islamic calligraphy, botanical skincare, and fresh bakery."
          actionText="Explore Marketplace Catalog"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Review Your Shopping Bag ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items Table/Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
              <span className="col-span-6">Product Details</span>
              <span className="col-span-2 text-center">Quantity</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="py-4 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center">
                  {/* Product Info */}
                  <div className="w-full sm:col-span-6 flex gap-3.5 items-center">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 rounded-2xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                        {product.category}
                      </span>
                      <Link
                        to={`/product/${product.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-emerald-800 line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {product.sellerDepartment}
                      </span>

                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <button
                          onClick={() => handleMoveToWishlist(product.id)}
                          className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>Save for Later</span>
                        </button>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="w-full sm:col-span-2 flex justify-start sm:justify-center">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                      <button
                        onClick={() => updateCartQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(product.id, quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="hidden sm:block col-span-2 text-right text-xs font-bold text-slate-600">
                    Rs. {product.price.toLocaleString()}
                  </div>

                  {/* Line Total */}
                  <div className="w-full sm:col-span-2 flex sm:block justify-between sm:text-right">
                    <span className="sm:hidden text-xs text-slate-500 font-medium">Line Total:</span>
                    <span className="text-sm font-extrabold font-display text-slate-900">
                      Rs. {(product.price * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Method Selection */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-3">
            <h3 className="text-sm font-bold font-display text-slate-900">
              Select Fulfillment & Collection Mode:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('CAMPUS')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  deliveryType === 'CAMPUS'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900">JUW Campus Pickup</span>
                  <span className="font-bold text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Collect securely from Block C Incubation Hub Counter (Nazimabad).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('HOME')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  deliveryType === 'HOME'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900">Standard Doorstep Delivery</span>
                  <span className="font-bold text-xs text-slate-800">Rs. 200</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Secure courier delivery anywhere across Karachi (2-3 business days).
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-6 sticky top-28">
            <h3 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">
                  Rs. {cartSubtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery & Handling</span>
                <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {deliveryFee === 0 ? 'FREE (Campus Pickup)' : `Rs. ${deliveryFee}`}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Student Discount (JUW10)</span>
                  <span>- Rs. {discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold font-display text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-xl text-slate-900">
                  Rs. {finalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Coupon Code input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Have a University Voucher or Promo?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. JUW10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-semibold focus:outline-none focus:border-emerald-600"
                />
                <Button type="submit" variant="outline" size="sm">
                  Apply
                </Button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Use code <strong>JUW10</strong> for 10% off your first order!
              </span>
            </form>

            {/* Checkout CTA */}
            <Button
              variant="emerald"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct University Escrow Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
