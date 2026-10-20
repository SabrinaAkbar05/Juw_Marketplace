import React, { useState } from 'react';
import { Sparkles, Clock, CheckCircle2, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ServiceCard } from '../../components/customer/ServiceCard';
import { Service, ServicePackage } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export const ServicesPage: React.FC = () => {
  const { services, addToast, activeUser } = useMarketplace();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleOpenBooking = (service: Service) => {
    setSelectedService(service);
    setSelectedPackage(service.packages[0] || null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedPackage) return;

    addToast({
      type: 'success',
      title: 'Service Booking Requisition Submitted',
      message: `Your booking request for "${selectedService.title}" (${selectedPackage.title}) has been sent to JUW Support Desk.`,
    });

    setSelectedService(null);
    setSelectedPackage(null);
    setBookingNotes('');
    setTargetDate('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-juw-navy-950 via-juw-navy-900 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl text-center max-w-4xl mx-auto space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>JUW Student Talent & Freelance Guild</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-display">
          Hire Verified Campus Student Creators
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Need high-impact FYP Figma UI/UX prototypes, traditional Islamic calligraphy certificates, graduation photoshoots, or organic henna artistry? Support student freelancers under official university escrow.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onRequestBooking={handleOpenBooking}
          />
        ))}
      </div>

      {/* Booking Requisition Modal */}
      {selectedService && (
        <Modal
          isOpen={Boolean(selectedService)}
          onClose={() => setSelectedService(null)}
          title={`Book Service: ${selectedService.title}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleConfirmBooking} className="space-y-6">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Faculty Unit:</span>
              <span>{selectedService.department} • Mediated by JUW Incubation Centre</span>
            </div>

            {/* Select Package */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                Select Service Tier / Package:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedService.packages.map((pkg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPackage?.title === pkg.title
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-slate-900">{pkg.title}</span>
                      <span className="font-extrabold text-xs text-emerald-800">
                        Rs. {pkg.price.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mb-2">
                      Est. turnaround: {pkg.deliveryDays} business days
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {pkg.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Requested Completion Date:
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Client Contact:
                </label>
                <input
                  type="text"
                  value={`${activeUser.name} (${activeUser.phone})`}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600"
                />
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Project Specific Requirements & Notes:
              </label>
              <textarea
                rows={3}
                placeholder="Provide details about your project, theme, required dimensions, or special instructions..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
                required
              />
            </div>

            {/* Safety & Escrow Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payment is held in escrow by JUW until student deliverable is inspected and approved.</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedService(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="emerald" size="md">
                Confirm Service Requisition • Rs. {selectedPackage?.price.toLocaleString()}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
