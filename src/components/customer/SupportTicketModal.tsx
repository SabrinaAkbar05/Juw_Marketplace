import React, { useState } from 'react';
import { TicketIssueType, TicketPriority } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useMarketplace } from '../../context/MarketplaceContext';
import { HelpCircle, ShieldAlert, Upload, CheckCircle2 } from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderNumber?: string;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  defaultOrderNumber = '',
}) => {
  const { orders, createSupportTicket, activeUser } = useMarketplace();

  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [issueType, setIssueType] = useState<TicketIssueType>('DAMAGED_PRODUCT');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    createSupportTicket({
      customerName: activeUser.name,
      customerEmail: activeUser.email,
      orderNumber: orderNumber || undefined,
      issueType,
      priority,
      subject,
      description,
    });

    onClose();
    setSubject('');
    setDescription('');
    setAttachmentName(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" title="Open Support / Dispute Ticket">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Important Privacy & Escalation Notice */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
          <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Official Marketplace Escrow Support</strong>
            All claims, refunds, and queries are directly mediated by JUW Central Incubation & Quality Desk. Your identity and payment remain safely protected.
          </div>
        </div>

        {/* Order Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Related Order (Optional)
          </label>
          <select
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="">-- General Marketplace Inquiry (No specific order) --</option>
            {orders.map((o) => (
              <option key={o.id} value={o.orderNumber}>
                Order #{o.orderNumber} • Rs. {o.total.toLocaleString()} ({o.status})
              </option>
            ))}
          </select>
        </div>

        {/* Issue Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as TicketIssueType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              required
            >
              <option value="DAMAGED_PRODUCT">Damaged / Defective Product</option>
              <option value="WRONG_PRODUCT">Wrong Product Delivered</option>
              <option value="MISSING_ORDER">Missing Items or Delayed Package</option>
              <option value="CANCELLATION_REQUEST">Cancellation Request</option>
              <option value="REFUND_REQUEST">Refund / Return Request</option>
              <option value="QUALITY_CONCERN">Quality or Material Inconsistency</option>
              <option value="OTHER">Other Campus Support Question</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Urgency Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              <option value="LOW">Low - General query</option>
              <option value="MEDIUM">Medium - Normal dispute (24h response)</option>
              <option value="HIGH">High - Urgent campus delivery issue</option>
              <option value="URGENT">Urgent - Event / Graduation deadline</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Subject Summary <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Brief summary of the issue (e.g. Scarf color differs from listing)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Please provide details about what went wrong, including batch number or photos if applicable..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white resize-none"
            required
          />
        </div>

        {/* Attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Attach Evidence Photo / Receipt (Optional)
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Photo / Screenshot</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAttachmentName(e.target.files[0].name);
                  }
                }}
              />
            </label>
            {attachmentName ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5" /> {attachmentName}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">JPG, PNG, PDF up to 10MB</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="emerald" size="md">
            Submit Support Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};
