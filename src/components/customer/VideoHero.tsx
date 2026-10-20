import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Store,
  Play,
  Pause,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export const VideoHero: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user system preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback resume prevented:', err);
      });
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-juw-navy-950 text-white min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center"
      aria-label="JUW Marketplace Hero"
    >
      {/* 1. CINEMATIC BACKGROUND VIDEO ELEMENT */}
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          poster="/juw-hero-poster.jpg"
          onLoadedData={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            prefersReducedMotion ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          <source src="/juw-hero.mp4" type="video/mp4" />
          {/* Fallback text for very old browsers */}
          Your browser does not support the video tag.
        </video>

        {/* Fallback static poster for reduced motion or fallback rendering */}
        <div
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-700 ${
            prefersReducedMotion || !videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('/juw-hero-poster.jpg')` }}
          aria-hidden="true"
        />
      </div>

      {/* 2. CINEMATIC CONTRAST OVERLAYS */}
      {/* Deep directional gradient for crystal-clear text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-juw-navy-950 via-juw-navy-950/85 to-juw-navy-950/40 lg:to-transparent z-10" />
      {/* Bottom fade for smooth transition to statistics cards */}
      <div className="absolute inset-0 bg-gradient-to-t from-juw-navy-950 via-transparent to-juw-navy-950/60 z-10" />
      {/* Subtle emerald ambient aura */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none z-10" />

      {/* 3. HERO CONTENT CONTAINER */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Heading, Subtitle & Action Buttons */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Top Branding Badge with Separate Image Overlays */}
            <div className="inline-flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
              {/* Overlay 1: Official JUW Logo */}
              <img
                src="/Jinnah_Logo.png"
                alt="JUW Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm shrink-0"
              />
              <span className="w-px h-6 bg-white/20" />
              {/* Overlay 2: JUW Marketplace Logo */}
              <img
                src="/juw-logo.png"
                alt="JUW Marketplace Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm shrink-0"
              />
              <div className="flex flex-col text-left pl-1">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 font-display">
                  Jinnah University for Women
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-300 font-medium">
                  Official Student Innovation Marketplace
                </span>
              </div>
            </div>

            {/* Main Headline (Task 8) */}
            <h1 className="font-display text-4xl sm:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-sm">
              One Campus.{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                Endless Possibilities.
              </span>
            </h1>

            {/* Subtitle (Task 9) */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-200 font-normal leading-relaxed max-w-2xl text-shadow-sm">
              Discover unique products, student-made creations, and inspiring businesses — all in one marketplace.
            </p>

            {/* CTA Buttons (Task 10) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/shop"
                id="hero-explore-btn"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl font-bold text-sm sm:text-base shadow-xl hover:shadow-emerald-900/40 transition-all duration-200 group"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/seller"
                id="hero-seller-btn"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/25 hover:border-white/40 rounded-2xl font-bold text-sm sm:text-base backdrop-blur-md transition-all duration-200"
              >
                <Store className="w-4 h-4 text-emerald-300" />
                <span>Become a Seller</span>
              </Link>
            </div>

            {/* Trust Markers */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-white/15 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% University Verified Products
              </span>
              <span className="inline-flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                Empowering Female Student Entrepreneurs
              </span>
            </div>
          </div>

          {/* Right Column: Prominent Dual Emblem Showcase Card (Task 7) */}
          <div className="lg:col-span-5 hidden lg:flex justify-end">
            <div className="relative w-full max-w-sm rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Official Accreditation
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              </div>

              {/* Dual Emblem Visual Display */}
              <div className="grid grid-cols-2 gap-4">
                {/* Official University Logo */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="w-20 h-20 flex items-center justify-center overflow-hidden mb-2">
                    <img
                      src="/Jinnah_Logo.png"
                      alt="JUW Logo"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-xs font-bold text-white text-center">JUW Logo</span>
                  <span className="text-[10px] text-slate-400 text-center">Est. 1998</span>
                </div>

                {/* Marketplace Logo Overlay */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="w-20 h-20 flex items-center justify-center overflow-hidden mb-2">
                    <img
                      src="/juw-logo.png"
                      alt="JUW MARKETPLACE"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-xs font-bold text-white text-center">JUW MARKETPLACE</span>
                  <span className="text-[10px] text-emerald-300 text-center">Student Commerce</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-200 flex items-center justify-between">
                <span>12 Academic Departments Online</span>
                <Link
                  to="/categories"
                  className="text-emerald-300 hover:text-white font-bold flex items-center gap-1"
                >
                  Explore <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACCESSIBLE VIDEO CONTROLS (Pause/Play & Reduced Motion) */}
      <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause promotional video' : 'Play promotional video'}
          className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md border border-white/20 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Pause Video</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Play Video</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
