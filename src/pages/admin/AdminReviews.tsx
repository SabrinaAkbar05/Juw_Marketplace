import React, { useState } from 'react';
import { Star, CheckCircle2, EyeOff, ShieldCheck, Search, Filter } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Review } from '../../types';
import { Rating } from '../../components/common/Rating';
import { Button } from '../../components/common/Button';

export const AdminReviews: React.FC = () => {
  const { reviews, moderateReview } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReviews = reviews.filter(
    (r) =>
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
          Customer Reviews & Testimonial Moderation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review customer feedback to uphold university reputation, monitor student product satisfaction, and flag inappropriate comments.
        </p>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Product Reviewed</th>
                <th className="p-4">Customer & Rating</th>
                <th className="p-4">Review Content</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <strong className="font-bold text-slate-900 block">{rev.productName}</strong>
                    <span className="text-[10px] text-slate-400">ID: {rev.productId}</span>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-slate-900 block">{rev.customerName}</span>
                    <Rating rating={rev.rating} size="sm" />
                  </td>

                  <td className="p-4 max-w-sm">
                    <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                  </td>

                  <td className="p-4 text-slate-400 whitespace-nowrap">
                    {rev.createdAt}
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-block font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                        rev.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rev.status !== 'APPROVED' ? (
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => moderateReview(rev.id, 'APPROVED')}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moderateReview(rev.id, 'HIDDEN')}
                          leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                        >
                          Hide
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
