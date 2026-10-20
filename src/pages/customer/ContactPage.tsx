import React, { useState } from 'react';
import { MapPin, Mail, Phone, Clock, ChevronDown, ChevronUp, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useMarketplace } from '../../context/MarketplaceContext';

export const ContactPage: React.FC = () => {
  const { addToast } = useMarketplace();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Message Dispatched',
      message: 'Your inquiry has been received by the JUW Marketplace Administration Support Desk.',
    });
    setName('');
    setEmail('');
    setMessage('');
  };

  const faqs = [
    {
      q: 'How does On-Campus Pickup work?',
      a: 'Once your order is marked READY, you will receive an SMS and email notification. You can collect your package from the Block C Incubation Hub Counter by showing your digital order receipt or student ID.',
    },
    {
      q: 'Why can’t I contact student creators directly?',
      a: 'To safeguard the privacy, academic schedule, and safety of our female student entrepreneurs, all transactions, inquiries, and dispute settlements are officially governed by the university administration.',
    },
    {
      q: 'What if an item arrives damaged or differs from photos?',
      a: 'You can open an official support ticket from your "My Orders" page. Our quality dispute desk will immediately investigate and issue a replacement or full refund.',
    },
    {
      q: 'Can external visitors and alumni purchase from JUW Marketplace?',
      a: 'Yes! JUW Marketplace is open to the public, alumni, students, and faculty. Doorstep courier delivery is available across Karachi and major cities in Pakistan.',
    },
    {
      q: 'How can current JUW students list their products or freelance services?',
      a: 'Enrolled students can submit product listings through their departmental ORIC coordinators. Listings undergo safety and quality review before appearing on the public store.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
          Campus Support & Helpdesk
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Have questions regarding an order, campus pickup, or university partnerships? Our team is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Campus Info & Message Form */}
        <div className="lg:col-span-6 space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
            <h3 className="font-bold font-display text-base text-slate-900">
              Campus Central Location
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Jinnah University for Women Main Campus:</strong><br />
                  5-C, Nazimabad, Karachi - 74600, Sindh, Pakistan
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>marketplace@juw.edu.pk / oric@juw.edu.pk</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>+92 21 36620857-59 (Ext: 214 - Incubation Desk)</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Monday - Friday: 08:30 AM to 04:30 PM PST</span>
              </div>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
            <h3 className="font-bold font-display text-base text-slate-900">
              Send Support Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message / Inquiry
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="emerald"
                size="md"
                className="w-full"
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send Message to Support
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: FAQ Accordion */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Common questions regarding campus ordering, payment, and student seller policies.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;

              return (
                <div
                  key={idx}
                  className="border border-slate-100 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs text-slate-900 flex justify-between items-center bg-slate-50/60 hover:bg-slate-50 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
