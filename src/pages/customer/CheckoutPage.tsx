import { api, json } from '../../lib/api';
import { getStoredToken } from '../../lib/auth';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Truck,
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  ArrowLeft,
  PackageCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { PaymentMethod, Order } from '../../types';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartSubtotal,
    cartCount,
    clearCart,
    activeUser,
    isAuthenticated,
    openAuthModal,
    refreshOrders,
    refreshCatalog,
  } = useMarketplace();

  // Form State
  const [customerName, setCustomerName] = useState(activeUser.name || '');
  const [customerEmail, setCustomerEmail] = useState(activeUser.email || '');
  const [customerPhone, setCustomerPhone] = useState(activeUser.phone || '');
  const [deliveryType, setDeliveryType] = useState<'CAMPUS_PICKUP' | 'STANDARD_DELIVERY'>('CAMPUS_PICKUP');
  const [pickupLocation, setPickupLocation] = useState('JUW Main Campus - Incubation Hub Counter (Block C)');
  const [streetAddress, setStreetAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Karachi');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (activeUser.name && !customerName) setCustomerName(activeUser.name);
    if (activeUser.email && !customerEmail) setCustomerEmail(activeUser.email);
    if (activeUser.phone && !customerPhone) setCustomerPhone(activeUser.phone);
  }, [activeUser]);

  const deliveryFee = deliveryType === 'CAMPUS_PICKUP' ? 0 : 200;
  const totalAmount = cartSubtotal + deliveryFee;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    const token = getStoredToken();
    const idempotencyKey = 'juw-ord-idemp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);

    api<Order>('/api/orders', {
      ...json('POST', {
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        deliveryType,
        pickupLocation: deliveryType === 'CAMPUS_PICKUP' ? pickupLocation : undefined,
        shippingAddress:
          deliveryType === 'STANDARD_DELIVERY'
            ? {
                street: streetAddress.trim(),
                area: area.trim(),
                city: 'Karachi',
                postalCode: '74600',
              }
            : undefined,
        deliveryFee,
        discount: 0,
        paymentMethod,
        idempotencyKey,
      }),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (newOrder) => {
        setIsSubmitting(false);
        setConfirmedOrder(newOrder);
        clearCart();
        await refreshOrders();
        await refreshCatalog();
      })
      .catch((error) => {
        setIsSubmitting(false);
        window.alert(error instanceof Error ? error.message : 'Order could not be placed');
      });
  };

  // Order Confirmed Celebration Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 mx-auto shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Successfully Placed
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
            Thank You for Supporting JUW Student Creators!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your order <strong>#{confirmedOrder.orderNumber}</strong> has been registered with university central fulfillment.
          </p>
        </div>

        {/* Order Details Receipt Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card text-left space-y-4 max-w-xl mx-auto">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block">Order Number</span>
              <strong className="text-slate-900 text-sm font-display">{confirmedOrder.orderNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Tracking Number</span>
              <strong className="text-emerald-700 text-sm font-display">{confirmedOrder.trackingNumber}</strong>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Fulfillment Method</span>
              <span className="font-bold text-slate-900">
                {confirmedOrder.deliveryType === 'CAMPUS_PICKUP' ? 'Campus Pickup (Block C Counter)' : 'Courier Delivery (Karachi)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode</span>
              <span className="font-bold text-slate-900">{confirmedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold font-display text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Paid / Payable</span>
              <span>Rs. {confirmedOrder.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Check your order status in the marketplace. Email and SMS notifications are not yet enabled.</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            variant="emerald"
            size="lg"
            onClick={() => navigate('/orders')}
            leftIcon={<PackageCheck className="w-5 h-5" />}
          >
            Track Order in My Orders
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/shop')}
          >
            Continue Browsing Catalog
          </Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Your Bag is Empty"
          description="Please add items to your cart before proceeding to checkout."
          actionText="Browse Marketplace"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & title */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bag</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
          Secure University Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Finalize your order with official university escrow protection and campus collection options.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Customer Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Customer Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number (for SMS & Pickup OTP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address (for Digital Receipt) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* 2. Delivery & Pickup Method */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Fulfillment & Collection</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryType('CAMPUS_PICKUP')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  deliveryType === 'CAMPUS_PICKUP'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100 shadow-sm'
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
                  Pick up at campus incubation counter with your student/faculty ID.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('STANDARD_DELIVERY')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  deliveryType === 'STANDARD_DELIVERY'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900">Doorstep Delivery</span>
                  <span className="font-bold text-xs text-slate-800">Rs. 200</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Shipped via courier anywhere across Karachi (2-3 days).
                </p>
              </button>
            </div>

            {deliveryType === 'CAMPUS_PICKUP' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select On-Campus Pickup Station
                </label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="JUW Main Campus - Incubation Hub Counter (Block C)">
                    JUW Main Campus - Incubation Hub Counter (Block C Ground Floor)
                  </option>
                  <option value="JUW Central Library Reception Desk">
                    JUW Central Library Reception Desk (Main Gate)
                  </option>
                  <option value="Faculty Lounge - Administration Block">
                    Faculty Lounge - Administration Block (Staff & Faculty Only)
                  </option>
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Street Address & Apartment / House # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Area / Neighborhood <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Payment Mode</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Cash on Pickup / Delivery</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pay cash at Block C counter or to courier on arrival.
                </p>
              </button>

            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6 sticky top-28">
            <h3 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100">
              Order Review ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </h3>

            {/* Items summary */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{product.name}</p>
                      <span className="text-slate-400">Qty: {quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    Rs. {(product.price * quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs pt-4 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">
                  Rs. {cartSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery / Pickup</span>
                <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold font-display text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-xl">Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <Button
              type="submit"
              variant="emerald"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Place Order • Rs. {totalAmount.toLocaleString()}
            </Button>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed">
              By placing this order, you support student female enterprise at Jinnah University for Women. Protected by university quality mediation.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
