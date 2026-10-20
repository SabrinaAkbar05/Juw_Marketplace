import React from 'react';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';
import { OrderStatus } from '../../types';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus, statusHistory }) => {
  const steps: { status: OrderStatus; label: string; description: string }[] = [
    { status: 'PLACED', label: 'Order Placed', description: 'Order received by system' },
    { status: 'PAYMENT_CONFIRMED', label: 'Payment Verified', description: 'Payment confirmed by accounts' },
    { status: 'PROCESSING', label: 'In Production', description: 'Student artisan preparing order' },
    { status: 'READY', label: 'Ready / Dispatched', description: 'Packed & ready for pickup/delivery' },
    { status: 'DELIVERED', label: 'Delivered', description: 'Handed over to customer' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return 0;
      case 'PAYMENT_CONFIRMED':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'READY':
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isSpecialState = ['CANCELLED', 'REFUNDED', 'RETURNED', 'DISPUTED'].includes(currentStatus);

  if (isSpecialState) {
    const specialInfo = {
      CANCELLED: { title: 'Order Cancelled', color: 'text-slate-700 bg-slate-100 border-slate-300', icon: <XCircle className="w-5 h-5 text-slate-600" /> },
      REFUNDED: { title: 'Payment Refunded', color: 'text-purple-800 bg-purple-50 border-purple-200', icon: <RotateCcw className="w-5 h-5 text-purple-600" /> },
      RETURNED: { title: 'Item Returned', color: 'text-amber-800 bg-amber-50 border-amber-200', icon: <RotateCcw className="w-5 h-5 text-amber-600" /> },
      DISPUTED: { title: 'Dispute Under Review by Marketplace Support', color: 'text-rose-800 bg-rose-50 border-rose-200', icon: <AlertTriangle className="w-5 h-5 text-rose-600" /> },
    }[currentStatus as 'CANCELLED' | 'REFUNDED' | 'RETURNED' | 'DISPUTED'];

    return (
      <div className={`p-4 rounded-2xl border ${specialInfo.color} flex items-center gap-3.5 my-4`}>
        {specialInfo.icon}
        <div>
          <h4 className="text-sm font-bold">{specialInfo.title}</h4>
          <p className="text-xs opacity-80">
            For questions regarding this order state, please reach out to JUW Marketplace Support Desk.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
        {/* Desktop connecting line */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-slate-200 z-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.status} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 w-full md:w-auto text-left md:text-center">
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 md:flex-none">
                <span
                  className={`block text-xs font-bold ${
                    isCurrent ? 'text-emerald-900' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-slate-400 block max-w-[120px]">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
