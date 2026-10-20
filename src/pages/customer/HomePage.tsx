import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Award,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../../components/customer/ProductCard';
import { ServiceCard } from '../../components/customer/ServiceCard';
import { QuickViewModal } from '../../components/customer/QuickViewModal';
import { Product, Service } from '../../types';
import { campusVentures, campusEvents } from '../../data/campusShowcase';
import { Button } from '../../components/common/Button';
import { VideoHero } from '../../components/customer/VideoHero';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { products, services, categories, addToast } = useMarketplace();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [emailInput, setEmailInput] = useState('');

  const featuredProducts = products.filter((p) => p.isFeatured || p.isBestSeller).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);
  const topServices = services.slice(0, 3);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      addToast({
        type: 'success',
        title: 'Subscribed to JUW Marketplace Updates',
        message: 'You will receive notifications on upcoming artisan bazaars and new student releases.',
      });
      setEmailInput('');
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* 1. CINEMATIC VIDEO HERO WITH JUW-HERO.MP4 */}
      <VideoHero />

      {/* 2. MARKETPLACE HIGHLIGHTS / STATISTICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-white rounded-3xl p-6 sm:p-8 shadow-elevated border border-slate-100">
          <div className="flex items-center gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50/80">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
                12+
              </div>
              <p className="text-xs text-slate-500 font-medium">Academic Departments</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50/80">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
                50+
              </div>
              <p className="text-xs text-slate-500 font-medium">Student Artisans</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50/80">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
                100%
              </div>
              <p className="text-xs text-slate-500 font-medium">Verified Creations</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50/80">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
                Rs. 640k+
              </div>
              <p className="text-xs text-slate-500 font-medium">Student Revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Shop by Academic Department
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore {categories.length} distinct student creative departments spanning traditional crafts, gourmet food, and tech.
            </p>
          </div>
          <Link
            to="/categories"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <span>View All {categories.length} Departments</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 bg-slate-100 relative group-hover:scale-105 transition-transform">
                <img
                  src={cat.imageUrl || cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
              <h3 className="text-xs font-bold font-display text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {cat.productCount ?? 0} products
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full mb-2 border border-amber-200">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Artisan Spotlight</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Featured University Creations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top-rated handcrafted items selected for outstanding craftsmanship and student originality.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <span>Explore All Products</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* 5. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900 via-juw-navy-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Fresh Batch
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
                  New Semester Arrivals
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200 mt-1">
                  Just listed by talented student innovators for this semester.
                </p>
              </div>
              <Link
                to="/shop?filter=new"
                className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1 hover:underline"
              >
                <span>View New Additions</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. EXPLORE CAMPUS SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full mb-2 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Talent Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Hire Student Freelance Talent
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Support student professionals in UI/UX design, event calligraphy, graduation photography, and henna artistry.
            </p>
          </div>
          <Link
            to="/services"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <span>Browse All Services</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onRequestBooking={() => navigate('/services')}
            />
          ))}
        </div>
      </section>

      {/* 7. STUDENT STARTUP / VENTURE DISCOVERY (Strictly without individual contact info) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/80">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
              JUW Incubation Centre
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 mt-3">
              Student Startup & Venture Spotlight
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Empowering student-founded ventures incubated through university enterprise programs. All purchases support student growth.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {campusVentures.map((venture) => (
              <div
                key={venture.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-3.5">
                    <img
                      src={venture.image}
                      alt={venture.brandName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold font-display text-slate-900">
                      {venture.brandName}
                    </h3>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      {venture.badge}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 block mb-2">
                    {venture.studentDepartment}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {venture.shortBio}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Incubated: {venture.foundedYear}
                  </span>
                  <Link
                    to="/shop"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>View Catalog</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. WHY JUW MARKETPLACE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Campus Excellence
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-900 leading-tight">
              Why Choose the JUW Student Marketplace?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              JUW Marketplace isn't just an ordinary online shop — it is a university-governed bridge between ambitious female students and patrons of authentic, high-quality Pakistani craftsmanship and innovation.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Institutional Quality Assurance</h4>
                  <p className="text-xs text-slate-500">Every product listing is reviewed and approved by university quality coordinators before going live.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Protected Escrow & Free Campus Pickup</h4>
                  <p className="text-xs text-slate-500">Orders can be collected on campus at Block C Incubation Hub or shipped safely across Karachi with dedicated dispute support.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Empowering Female Financial Independence</h4>
                  <p className="text-xs text-slate-500">95% of every transaction goes directly to funding the student entrepreneur’s education and venture growth.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80"
                alt="JUW Student Collaboration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. UPCOMING EVENTS & COMMUNITY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full mb-2 border border-purple-200">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Campus Community</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Upcoming Bazaars & Expos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Visit on-campus galas and meet the innovative ideas in person at Jinnah University for Women.
            </p>
          </div>
          <Link
            to="/events"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <span>View All Events</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campusEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 bg-juw-navy-950/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                  {evt.category}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{evt.date}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-slate-900 mb-2">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {evt.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] truncate max-w-[150px]">
                    {evt.location.split(',')[0]}
                  </span>
                  <Link
                    to="/events"
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-juw-navy-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
              Stay Connected
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              Join the JUW Entrepreneurial Circle
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Subscribe to get notified about upcoming campus bazaars, exclusive student drops, and seasonal discounts.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="email"
                placeholder="Enter your email address..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/15 focus:border-emerald-400"
                required
              />
              <Button type="submit" variant="emerald" size="md">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
