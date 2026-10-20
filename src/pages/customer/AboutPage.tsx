import React from 'react';
import { ShieldCheck, Award, Users, Sparkles, Building2, Heart, CheckCircle2 } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Vision & Legacy</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 leading-tight">
          Empowering Female Leadership Through Digital Commerce
        </h1>
        <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
          The JUW Marketplace is the official university-governed commercial platform for Jinnah University for Women, established to turn student classroom innovation into viable commercial enterprise.
        </p>
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Fostering Real-World Female Enterprise
          </h2>
          <p>
            At Jinnah University for Women, education extends beyond textbook examinations. Our students in Textile Design, Bio-Technology, Visual Studies, Computer Science, and Food Science produce exceptional physical products, software artifacts, and formulations during their degree programs.
          </p>
          <p>
            The JUW Marketplace was established under the Office of Research, Innovation, and Commercialization (ORIC) to provide our female students with a verified, secure digital storefront. It allows students to monetize their skills, build commercial track records, and achieve financial independence before graduation.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-2xl font-extrabold font-display text-emerald-900 block">
                95%
              </span>
              <span className="text-xs text-emerald-700 font-semibold">Direct Student Revenue Share</span>
            </div>
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
              <span className="text-2xl font-extrabold font-display text-slate-900 block">
                12
              </span>
              <span className="text-xs text-slate-600 font-semibold">Academic Departments Active</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"
              alt="JUW Campus Students"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Core Pillars */}
      <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200 space-y-8">
        <h2 className="text-2xl font-bold font-display text-center text-slate-900">
          Our Institutional Pillars
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Strict Quality Mediation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every item is tested and moderated by departmental faculty coordinators to meet high academic and market standards.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Student Privacy Protection
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Customer interactions are mediated via central university support to protect young female student creators from unauthorized public exposure.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Venture Seed Incubation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Top sellers receive seed grant funding and mentoring to scale their student ventures into registered national enterprises.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
