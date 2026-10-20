import React from 'react';
import { Clock, CheckCircle2, Star, Sparkles, ArrowRight } from 'lucide-react';
import { Service } from '../../types';
import { Rating } from '../common/Rating';
import { Button } from '../common/Button';

interface ServiceCardProps {
  service: Service;
  onRequestBooking: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onRequestBooking }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Cover Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-juw-navy-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {service.category}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="bg-emerald-800/90 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Clock className="w-3 h-3" />
            {service.turnaroundTime}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-medium text-slate-400 mb-1">
            {service.department}
          </div>

          <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-emerald-800 transition-colors mb-2">
            {service.title}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
            {service.shortDescription}
          </p>

          {/* Rating */}
          <div className="mb-4">
            <Rating rating={service.rating} showCount count={service.reviewCount} size="sm" />
          </div>

          {/* Deliverables Checklist */}
          <div className="space-y-1.5 mb-5 pb-4 border-b border-slate-100">
            {service.deliverables.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & Booking CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Starting from</span>
            <span className="text-lg font-extrabold font-display text-slate-900">
              Rs. {service.startingPrice.toLocaleString()}
            </span>
          </div>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => onRequestBooking(service)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Book Service
          </Button>
        </div>
      </div>
    </div>
  );
};
