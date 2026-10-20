import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  ShieldCheck,
  MessageSquare,
  Clock,
  Send,
  AlertTriangle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SupportTicketModal } from '../../components/customer/SupportTicketModal';
import { SupportTicket } from '../../types';

export const SupportPage: React.FC = () => {
  const { supportTickets, addTicketReply } = useMarketplace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(supportTickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  const selectedTicket = supportTickets.find((t) => t.id === selectedTicketId) || supportTickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    addTicketReply(selectedTicket.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-juw-navy-950 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official University Mediation Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Marketplace Support & Dispute Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All inquiries, returns, order discrepancies, and custom requests are managed by the JUW Incubation & Quality Support Team.
          </p>
        </div>

        <Button
          variant="emerald"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Open Support Ticket
        </Button>
      </div>

      {/* Main Support Layout: Tickets List & Active Message Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold font-display text-slate-900 uppercase tracking-wider text-slate-400">
            Your Support Tickets ({supportTickets.length})
          </h3>

          <div className="space-y-3">
            {supportTickets.map((ticket) => {
              const isSelected = ticket.id === selectedTicket?.id;

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-50'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {ticket.ticketNumber}
                    </span>
                    <StatusBadge status={ticket.status} type="ticket" />
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                    {ticket.subject}
                  </h4>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>
                      {ticket.orderNumber ? `Order #${ticket.orderNumber}` : 'General Inquiry'}
                    </span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Conversation Thread */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col min-h-[500px] justify-between">
          {selectedTicket ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Thread Header */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {selectedTicket.ticketNumber}
                      </span>
                      <StatusBadge status={selectedTicket.status} type="ticket" />
                      <StatusBadge status={selectedTicket.priority} type="priority" />
                    </div>
                    <h2 className="text-lg font-bold font-display text-slate-900 mt-1">
                      {selectedTicket.subject}
                    </h2>
                    {selectedTicket.orderNumber && (
                      <span className="text-xs text-emerald-700 font-semibold block mt-0.5">
                        Linked Order: #{selectedTicket.orderNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="space-y-4 py-6 max-h-[380px] overflow-y-auto pr-1">
                  {selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.sender === 'ADMIN_SUPPORT';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isAdmin ? 'items-start' : 'items-end'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-bold text-slate-700">{msg.senderName}</span>
                          <span>•</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-slate-100 text-slate-900 rounded-tl-sm border border-slate-200'
                              : 'bg-emerald-700 text-white rounded-tr-sm shadow-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Type your reply to the JUW Support Desk..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white resize-none"
                    required
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    Official Support Hours: 09:00 AM - 05:00 PM PST
                  </span>
                  <Button
                    type="submit"
                    variant="emerald"
                    size="sm"
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send Reply
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              Select a support ticket to view conversation history.
            </div>
          )}
        </div>
      </div>

      {/* Support Ticket Modal */}
      <SupportTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
