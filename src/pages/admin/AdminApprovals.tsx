import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  MessageSquare,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Product, ProductStatus } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminApprovals: React.FC = () => {
  const {
    products,
    approveProduct,
    rejectProduct,
    requestProductChanges,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'NEEDS_CHANGES' | 'REJECTED'>('PENDING');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [actionType, setActionType] = useState<'REJECT' | 'CHANGES' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((p) => {
    // Tab filter
    if (activeTab === 'ACTIVE' && p.status !== 'ACTIVE') return false;
    if (activeTab !== 'ACTIVE' && p.status !== activeTab) return false;

    // Search filter
    if (
      searchTerm &&
      !p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.sku.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.sellerDepartment?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const handleApprove = (product: Product) => {
    approveProduct(product.id);
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
    }
  };

  const handleOpenActionModal = (product: Product, type: 'REJECT' | 'CHANGES') => {
    setSelectedProduct(product);
    setActionType(type);
    setFeedbackComment('');
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !actionType || !feedbackComment.trim()) return;

    if (actionType === 'REJECT') {
      rejectProduct(selectedProduct.id, feedbackComment.trim());
    } else {
      requestProductChanges(selectedProduct.id, feedbackComment.trim());
    }

    setSelectedProduct(null);
    setActionType(null);
    setFeedbackComment('');
  };

  const pendingCount = products.filter((p) => p.status === 'PENDING').length;
  const changesCount = products.filter((p) => p.status === 'NEEDS_CHANGES').length;
  const approvedCount = products.filter((p) => p.status === 'ACTIVE').length;
  const rejectedCount = products.filter((p) => p.status === 'REJECTED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Product Moderation & Quality Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review student venture submissions against university safety, brand, and pricing guidelines before public listing.
          </p>
        </div>
      </div>

      {/* Tabs Strip with Counts */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Pending Review</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('NEEDS_CHANGES')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'NEEDS_CHANGES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Needs Changes</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'NEEDS_CHANGES' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'}`}>
            {changesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Approved & Live</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'REJECTED'
              ? 'bg-rose-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Rejected Submissions</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-900'}`}>
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* Submissions List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title={`No Submissions in ${activeTab.replace('_', ' ')} Queue`}
          description="Check other tabs or search terms to inspect student creator product listings."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Image */}
                <div className="aspect-[16/10] w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={product.status} type="product" />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-extrabold px-2.5 py-1 rounded-lg">
                    Rs. {product.price.toLocaleString()}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      {product.category}
                    </span>
                    <h3 className="font-bold font-display text-sm text-slate-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 block truncate">
                      Submitted by: {product.sellerDepartment}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Feedback comment if already reviewed */}
                  {product.adminFeedback && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <strong className="block font-bold">Admin Feedback Note:</strong>
                      <span>{product.adminFeedback}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-2 space-y-2">
                <div className="flex items-center justify-between pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProduct(product)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Inspect Full Details
                  </Button>

                  {product.status === 'PENDING' && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => handleApprove(product)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                  )}
                </div>

                {product.status === 'PENDING' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenActionModal(product, 'CHANGES')}
                      className="text-blue-700 hover:bg-blue-50"
                    >
                      Request Changes
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenActionModal(product, 'REJECT')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Inspection Modal */}
      {selectedProduct && !actionType && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={`Moderation Inspector: ${selectedProduct.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={selectedProduct.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">
                    Academic Submitter
                  </span>
                  <strong className="text-slate-900 text-sm">
                    {selectedProduct.sellerDepartment}
                  </strong>
                </div>

                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">
                    Proposed Retail Price
                  </span>
                  <span className="text-base font-extrabold text-emerald-800">
                    Rs. {selectedProduct.price.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">
                    Category & SKU
                  </span>
                  <span className="text-slate-800">
                    {selectedProduct.category} • SKU: {selectedProduct.sku}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">
                    Current State
                  </span>
                  <StatusBadge status={selectedProduct.status} type="product" />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Submitted Description:</h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                {selectedProduct.description}
              </p>
            </div>

            {selectedProduct.materialsOrIngredients && (
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-slate-900">Declared Materials / Ingredients:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.materialsOrIngredients.map((m, idx) => (
                    <span key={idx} className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Inside Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedProduct(null)}
              >
                Close Inspector
              </Button>

              {selectedProduct.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setActionType('CHANGES')}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => setActionType('REJECT')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="emerald"
                    size="md"
                    onClick={() => handleApprove(selectedProduct)}
                  >
                    Approve Product
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Action Comment Modal (Reject / Request Changes) */}
      {selectedProduct && actionType && (
        <Modal
          isOpen={Boolean(actionType)}
          onClose={() => setActionType(null)}
          title={
            actionType === 'REJECT'
              ? `Reject Submission: ${selectedProduct.name}`
              : `Request Changes: ${selectedProduct.name}`
          }
          maxWidth="md"
        >
          <form onSubmit={handleConfirmAction} className="space-y-4">
            <p className="text-xs text-slate-600">
              {actionType === 'REJECT'
                ? 'Please provide an official justification for rejecting this student product listing (e.g. non-compliance with university safety or trademark guidelines).'
                : 'Specify the required revisions for the student creator (e.g. clearer photo background, ingredient disclosure, pricing adjustment).'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Official Feedback Comment <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Write clear instructions for the student creator and departmental coordinator..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActionType(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={actionType === 'REJECT' ? 'danger' : 'primary'}
                size="sm"
              >
                {actionType === 'REJECT' ? 'Confirm Rejection' : 'Send Change Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
