import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'light' | 'dark' | 'emerald';
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'admin';
  to?: string;
  adminMode?: boolean;
  adminCompact?: boolean;
  adminCollapsed?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  showSubtitle = true,
  size = 'md',
  to = '/',
  adminMode = false,
  adminCompact = false,
  adminCollapsed = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    admin: 'w-12 h-12',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20 sm:w-22 sm:h-22',
    xl: 'w-28 h-28',
  };

  const titleSizeClasses = {
    sm: 'text-base',
    admin: 'text-[16px] sm:text-[17px]',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const textColors = {
    dark: 'text-slate-900',
    light: 'text-white',
    emerald: 'text-emerald-950',
  };

  const subtitleColors = {
    dark: 'text-slate-500',
    light: 'text-slate-400',
    emerald: 'text-emerald-700',
  };

  // If in adminCompact mode, use specialized 48x48 layout
  if (adminCompact) {
    if (adminCollapsed) {
      return (
        <Link
          to={to}
          title="JUW Marketplace Admin Portal"
          aria-label="JUW Marketplace Admin Portal"
          className={`flex items-center justify-center group focus:outline-none select-none ${className}`}
        >
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-700/80 shadow-xs group-hover:border-emerald-500/60 transition-all duration-300 flex items-center justify-center overflow-hidden">
              <img
                src="/juw-logo.png"
                alt="JUW Marketplace Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-juw-navy-950 rounded-full shadow-xs" />
          </div>
          <span className="sr-only">JUW Marketplace Admin</span>
        </Link>
      );
    }

    return (
      <Link
        to={to}
        className={`inline-flex items-center gap-3 group focus:outline-none select-none min-w-0 max-w-full ${className}`}
      >
        {/* 48px x 48px Official JUW Logo */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-700/80 shadow-xs group-hover:border-emerald-500/60 transition-all duration-300 flex items-center justify-center overflow-hidden">
            <img
              src="/juw-logo.png"
              alt="JUW Marketplace Logo"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-juw-navy-950 rounded-full shadow-xs" />
        </div>

        {/* Compact Admin Brand Typography (fits within 260px sidebar) */}
        <div className="flex flex-col min-w-0 flex-1 leading-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display font-bold text-[16px] sm:text-[17px] tracking-tight text-white leading-tight">
              JUW
            </span>
            <span className="font-display font-bold text-[16px] sm:text-[17px] tracking-tight text-emerald-400 leading-tight">
              MARKETPLACE
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-600/40 px-1 py-0.5 rounded ml-0.5">
              Admin
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-slate-400 mt-1 truncate">
              Jinnah University for Women
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-3 group focus:outline-none select-none ${className}`}
    >
      {/* Official JUW Marketplace Puzzle Bag Logo */}
      <div className="relative flex items-center justify-center shrink-0">
        <div
          className={`${sizeClasses[size]} rounded-2xl bg-white p-1 border border-slate-200/90 shadow-xs group-hover:shadow-md transition-all duration-300 flex items-center justify-center overflow-hidden`}
        >
          <img
            src="/juw-logo.png"
            alt="JUW Marketplace Logo"
            className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        {adminMode && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full shadow-xs" />
        )}
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display font-black tracking-tight ${titleSizeClasses[size]} leading-none ${textColors[variant]}`}
          >
            JUW
          </span>
          <span
            className={`font-display font-extrabold tracking-tight ${titleSizeClasses[size]} leading-none text-emerald-700`}
          >
            MARKETPLACE
          </span>
          {adminMode && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 ml-1">
              Admin
            </span>
          )}
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase mt-1 ${subtitleColors[variant]}`}
          >
            Jinnah University for Women
          </span>
        )}
      </div>
    </Link>
  );
};

export const LogoEmblem: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-18 h-18 sm:w-20 sm:h-20',
  className = '',
}) => {
  return (
    <div
      className={`${size} rounded-3xl bg-white p-2 border border-slate-200/90 shadow-md flex items-center justify-center overflow-hidden ${className}`}
    >
      <img
        src="/juw-logo.png"
        alt="JUW Marketplace"
        className="w-full h-full object-contain hover:scale-105 transition-transform"
      />
    </div>
  );
};
