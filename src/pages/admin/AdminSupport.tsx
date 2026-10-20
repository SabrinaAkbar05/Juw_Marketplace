import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  Lock,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { SupportTicket, TicketStatus, TicketPriority } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const AdminSupport: React.FC = () => {
  const {
    supportTickets,
    updateTicketStatus,
    updateTicketPriority,
    addAdminNoteToTicket,
    sendAdminReplyToTicket,
    resolveDispute,
  } = useAdmin();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(supportTickets[0]?.id || '');
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  const selectedTicket = supportTickets.find((t) => t.id === selectedTicketId) || supportTickets[0];

  const handleSendCustomerReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    sendAdminReplyToTicket(selectedTicket.id, replyMessage.trim());
    setReplyMessage('');
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim() || !selectedTicket) return;
    addAdminNoteToTicket(selectedTicket.id, internalNote.trim());
    setInternalNote('');
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionText.trim() || !selectedTicket) return;
    resolveDispute(selectedTicket.id, resolutionText.trim());
    setIsResolveModalOpen(false);
    setResolutionText('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
          Customer Support & Dispute Mediation Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Arbitrate claims, courier packaging damage, refund requests, and customer communications under official university policy.
        </p>
      </div>

      {/* Main Support Grid: Queue & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Case Queue ({supportTickets.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {supportTickets.map((ticket) => {
              const isSelected = ticket.id === selectedTicket?.id;

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-50'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {ticket.ticketNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={ticket.priority} type="priority" />
                      <StatusBadge status={ticket.status} type="ticket" />
                    </div>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">
                    {ticket.subject}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 mt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">{ticket.customerName}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dispute Resolution Workspace */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
          {selectedTicket ? (
            <div className="space-y-6">
              {/* Top Banner & Status Controls */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
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
                  <div className="text-xs text-slate-500 mt-0.5">
                    Customer: <strong>{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})
                    {selectedTicket.orderNumber && (
                      <span className="ml-2 font-mono text-emerald-800 font-bold">
                        Linked Order: #{selectedTicket.orderNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'RESOLVED' && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => setIsResolveModalOpen(true)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Resolve Dispute
                    </Button>
                  )}
                </div>
              </div>

              {/* Lifecycle status selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Change Status:</span>
                {(['OPEN', 'IN_PROGRESS', 'AWAITING_SELLER_INPUT', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => updateTicketStatus(selectedTicket.id, st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                        selectedTicket.status === st
                          ? 'bg-juw-navy-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              {/* Internal Admin Notes Log */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Internal Admin & Department Mediation Notes (Private)</span>
                </div>

                {selectedTicket.internalAdminNotes && selectedTicket.internalAdminNotes.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-amber-900">
                    {selectedTicket.internalAdminNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-amber-700">No internal notes added yet.</p>
                )}

                <form onSubmit={handleAddInternalNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add private staff note or student creator query..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Add Note
                  </Button>
                </form>
              </div>

              {/* Customer Communication Stream */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mediation Messages Stream
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.sender === 'ADMIN_SUPPORT';

                    return (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-slate-100 text-slate-900 border border-slate-200 ml-4'
                            : 'bg-emerald-50 text-emerald-950 border border-emerald-200 mr-4'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1 font-bold">
                          <span>{msg.senderName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply to Customer Form */}
              <form onSubmit={handleSendCustomerReply} className="pt-3 border-t border-slate-100 space-y-3">
                <textarea
                  rows={3}
                  placeholder="Type official response to customer on behalf of JUW Marketplace Support..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
                  required
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="emerald"
                    size="sm"
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send Customer Response
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              Select a dispute ticket to view details.
            </div>
          )}
        </div>
      </div>

      {/* Dispute Resolution Modal */}
      {isResolveModalOpen && selectedTicket && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title={`Resolve Dispute: #${selectedTicket.ticketNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmResolution} className="space-y-4">
            <p className="text-xs text-slate-600">
              Document the formal resolution for this claim (e.g. replacement package dispatched, refund processed, or pickup hold confirmed).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Formal Resolution Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="e.g. Trax Courier logistics claim initiated; replacement item prepared at Textile Design studio..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsResolveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="emerald" size="sm">
                Close & Resolve Dispute
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
