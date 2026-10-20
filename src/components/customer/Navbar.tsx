import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Clock,
  HelpCircle,
  Package,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useMarketplace } from '../../context/MarketplaceContext';

interface NavbarProps {
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cartCount,
    wishlist,
    searchQuery,
    setSearchQuery,
    activeUser,
    categories,
    isAuthenticated,
    openAuthModal,
    logout,
  } = useMarketplace();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      navigate(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop All', path: '/shop' },
    { name: 'Categories', path: '/categories', hasDropdown: true },
    { name: 'Freelance Services', path: '/services' },
    { name: 'About JUW', path: '/about' },
    { name: 'Sell at JUW', path: '/seller' },
    { name: 'Help & Support', path: '/support' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-subtle transition-all">
      {/* Top University Announcement Bar */}
      <div className="bg-juw-navy-950 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">
              Official
            </span>
            <span className="hidden sm:inline text-slate-300">
              Jinnah University for Women • Student Innovation & Incubation Marketplace
            </span>
            <span className="sm:hidden text-slate-300">
              JUW Student Enterprise
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span className="hidden md:inline-flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3 h-3" />
              Free On-Campus Pickup at Block C
            </span>
            <Link
              to="/admin"
              className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 hover:underline"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Logo variant="dark" />

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md relative mx-4"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search handcrafted fashion, calligraphy, bakery, services..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-juw-emerald-600 focus:ring-2 focus:ring-juw-emerald-100 transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2 text-white bg-juw-navy-900 hover:bg-juw-navy-800 rounded-xl transition-all shadow-md cursor-pointer group"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-400 group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline text-xs font-bold font-display">
                Bag
              </span>
              {cartCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Menu / Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <span>Register</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
                    {(activeUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {activeUser.name.split(' ')[0] || 'My Account'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {activeUser.department ? activeUser.department.slice(0, 20) : 'JUW Member'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                </button>

                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 animate-fade-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{activeUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{activeUser.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          {activeUser.department || 'JUW Student'}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          My Orders & Tracking
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          Saved Wishlist
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                          Helpdesk & Support Tickets
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 transition-colors"
                        >
                          <span>Admin Control Panel</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links Strip */}
        <nav className="hidden md:flex items-center space-x-1 py-2 border-t border-slate-100 text-xs font-semibold text-slate-700">
          {navLinks.map((link) => (
            <div key={link.name} className="relative group">
              {link.hasDropdown ? (
                <div
                  onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                  onMouseLeave={() => setIsCategoryDropdownOpen(false)}
                  className="relative"
                >
                  <Link
                    to={link.path}
                    className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-colors ${
                      isActive(link.path)
                        ? 'text-emerald-800 bg-emerald-50/80 font-bold'
                        : 'hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Link>

                  {/* Mega Category Dropdown */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 top-full pt-1 z-50 w-72 animate-fade-in">
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 grid grid-cols-1 gap-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          {categories.length} Student Product Departments
                        </div>
                        {categories.slice(0, 8).map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/categories/${cat.slug}`}
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                          >
                            <span>{cat.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {cat.productCount ?? 0} items
                            </span>
                          </Link>
                        ))}
                        <Link
                          to="/categories"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                          className="px-3 py-2 text-xs font-bold text-center text-emerald-700 hover:bg-emerald-100/50 rounded-xl transition-colors border-t border-slate-100 mt-1"
                        >
                          View All {categories.length} Departments →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'text-emerald-800 bg-emerald-50/80 font-bold'
                      : 'hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              )}
            </div>
          ))}

          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 pl-4 border-l border-slate-100">
            <Link
              to="/shop?filter=new"
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              New Arrivals
            </Link>
            <Link
              to="/shop?filter=bestseller"
              className="text-amber-700 hover:text-amber-800 font-bold"
            >
              Best Sellers
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl animate-fade-in">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products or services..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Mobile Auth Bar */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            {!isAuthenticated ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center shadow-2xs"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="flex-1 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl text-center shadow-2xs"
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">{activeUser.name}</p>
                  <p className="text-[10px] text-slate-500">{activeUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs font-bold text-red-600 px-3 py-1.5 bg-white rounded-lg border border-red-100 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.path)
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Categories Highlights */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Top Departments
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
