import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Sparkles,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../common/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-juw-navy-950 text-slate-300 border-t border-slate-800">
      {/* Top Highlights Banner */}
      <div className="border-b border-slate-800/80 bg-juw-navy-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display">University Verified</h4>
                <p className="text-xs text-slate-400">All products curated & approved by JUW administration</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display">100% Student Powered</h4>
                <p className="text-xs text-slate-400">Directly funding student female entrepreneurs</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display">Free Campus Pickup</h4>
                <p className="text-xs text-slate-400">Collect securely from Block C Incubation Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display">Quality & Care</h4>
                <p className="text-xs text-slate-400">Handcrafted, fresh bakery, & botanical cosmetics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="light" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The official university-backed commercial platform empowering female student leaders,
              innovators, and artisans at Jinnah University for Women, Karachi. Fostering real-world
              entrepreneurship across 12 academic disciplines.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>5-C, Nazimabad, Karachi-74600, Sindh, Pakistan</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>marketplace@juw.edu.pk</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+92 21 36620857-59 (Ext. 214)</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Explore */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display mb-4">
              Explore Marketplace
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/shop" className="hover:text-emerald-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-emerald-400 transition-colors">
                  12 Departments
                </Link>
              </li>
              <li>
                <Link to="/shop?filter=new" className="hover:text-emerald-400 transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?filter=bestseller" className="hover:text-emerald-400 transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-emerald-400 transition-colors">
                  Campus Freelance Services
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-emerald-400 transition-colors">
                  Artisan Bazaars & Galas
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Privacy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display mb-4">
              Support & Ethics
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/support" className="hover:text-emerald-400 transition-colors">
                  Marketplace Helpdesk
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-emerald-400 transition-colors">
                  Track My Order
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-emerald-400 transition-colors">
                  Dispute Resolution Desk
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">
                  Student Creator Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-400 transition-colors">
                  Campus Pickup Guidelines
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">
                  Product Quality Assurance
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: University Portal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display mb-4">
              Institutional Links
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://juw.edu.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <span>JUW Official Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">
                  Incubation & ORIC Center
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">
                  Vice Chancellor Vision
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-emerald-400 transition-colors">
                  Annual Tech Expo
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-amber-300 hover:text-amber-200 font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Admin Management Panel</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Jinnah University for Women. All rights reserved.
            Built for female student entrepreneurial empowerment.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Karachi, Pakistan</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Privacy-First Protected Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
