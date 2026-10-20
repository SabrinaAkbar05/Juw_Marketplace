import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { campusEvents } from '../../data/campusShowcase';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CampusEvent } from '../../types';

export const EventsPage: React.FC = () => {
  const { addToast } = useMarketplace();
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    addToast({
      type: 'success',
      title: 'Pass Registered!',
      message: `Free visitor pass for "${selectedEvent.title}" sent to ${visitorEmail}.`,
    });
    setSelectedEvent(null);
    setVisitorName('');
    setVisitorEmail('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-juw-navy-950 to-purple-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/80 border border-purple-500/30 text-xs font-semibold text-purple-200">
          <Calendar className="w-3.5 h-3.5 text-amber-300" />
          <span>Campus Calendar & Galas</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-display">
          University Artisan Bazaars & Startup Expos
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Join us on campus at Jinnah University for Women to witness live artisan demonstrations, graduation thesis exhibitions, and food galas.
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {campusEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card hover:shadow-card-hover transition-all flex flex-col lg:flex-row gap-8 items-center"
          >
            <div className="w-full lg:w-96 aspect-video rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative">
              <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-juw-navy-950/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                {evt.category}
              </span>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-800">
                <span className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Calendar className="w-3.5 h-3.5" />
                  {evt.date}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  {evt.time}
                </span>
              </div>

              <h2 className="text-xl font-bold font-display text-slate-900">
                {evt.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {evt.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{evt.location}</span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">
                  Admission: Free with Campus Registration
                </span>
                <Button
                  variant="emerald"
                  size="md"
                  onClick={() => setSelectedEvent(evt)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Register Visitor Pass
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Modal */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={`Register Campus Pass: ${selectedEvent.title}`}
          maxWidth="md"
        >
          <form onSubmit={handleRegister} className="space-y-4">
            <p className="text-xs text-slate-600">
              Please enter your contact information to receive your digital entry QR pass for the event on <strong>{selectedEvent.date}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="e.g. Ayesha Siddiqui"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                placeholder="e.g. ayesha@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="emerald" size="sm">
                Confirm Registration
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
