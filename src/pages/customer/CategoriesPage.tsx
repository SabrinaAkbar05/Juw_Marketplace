import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const {categories} = useMarketplace();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <Layers className="w-3.5 h-3.5" />
          <span>Academic Faculties & Departments</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
          Browse by Department Floors
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Each department at Jinnah University for Women contributes distinct artisanal and scientific innovations — from traditional handloom textiles to pure organic botanical skincare.
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No categories currently active.</p>
          <p className="text-xs text-slate-400 mt-1">Departments will appear here as soon as they are published by university administrators.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories
            .filter((c) => c.status === 'active' || !c.status)
            .map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 relative group-hover:scale-102 transition-transform duration-500">
                    <img
                      src={cat.imageUrl || cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-juw-navy-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Floor {cat.sortOrder || idx + 1}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-slate-900 text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-xs">
                      {cat.productCount ?? 0} Products
                    </div>
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    {cat.departmentTag || 'Jinnah University for Women'}
                  </span>

                  <h2 className="text-lg font-bold font-display text-slate-900 group-hover:text-emerald-800 transition-colors mb-2">
                    {cat.name}
                  </h2>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {cat.description || 'Artisanal creations handcrafted by students and researchers at JUW.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
};
