import React from 'react';
import { ProductStatus, OrderStatus, TicketStatus, TicketPriority } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'navy' | 'gold' | 'blue' | 'purple' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'navy',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    navy: 'bg-slate-100 text-slate-800 border-slate-200',
    gold: 'bg-amber-50 text-amber-900 border-amber-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    red: 'bg-rose-50 text-rose-800 border-rose-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    navy: 'bg-slate-500',
    gold: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-rose-500',
    gray: 'bg-gray-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{
  status: ProductStatus | OrderStatus | TicketStatus | TicketPriority | string;
  type?: 'product' | 'order' | 'ticket' | 'priority';
}> = ({ status, type = 'product' }) => {
  switch (status) {
    // Product states
    case 'ACTIVE':
    case 'APPROVED':
      return <Badge variant="emerald" dot>Approved & Active</Badge>;
    case 'PENDING':
      return <Badge variant="gold" dot>Pending Review</Badge>;
    case 'NEEDS_CHANGES':
      return <Badge variant="blue" dot>Needs Changes</Badge>;
    case 'REJECTED':
      return <Badge variant="red" dot>Rejected</Badge>;
    case 'OUT_OF_STOCK':
      return <Badge variant="gray" dot>Out of Stock</Badge>;

    // Order states
    case 'PLACED':
      return <Badge variant="blue" dot>Order Placed</Badge>;
    case 'PAYMENT_CONFIRMED':
      return <Badge variant="purple" dot>Payment Confirmed</Badge>;
    case 'PROCESSING':
      return <Badge variant="gold" dot>In Production</Badge>;
    case 'READY':
      return <Badge variant="emerald" dot>Ready for Pickup</Badge>;
    case 'SHIPPED':
      return <Badge variant="blue" dot>Dispatched / Shipped</Badge>;
    case 'DELIVERED':
      return <Badge variant="emerald" dot>Delivered</Badge>;
    case 'CANCELLED':
      return <Badge variant="gray" dot>Cancelled</Badge>;
    case 'REFUNDED':
      return <Badge variant="purple" dot>Refunded</Badge>;
    case 'RETURNED':
      return <Badge variant="navy" dot>Returned</Badge>;
    case 'DISPUTED':
      return <Badge variant="red" dot>Dispute Active</Badge>;

    // Support ticket states
    case 'OPEN':
      return <Badge variant="gold" dot>Open</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="blue" dot>Investigating</Badge>;
    case 'AWAITING_SELLER_INPUT':
      return <Badge variant="purple" dot>Creator Review</Badge>;
    case 'RESOLVED':
      return <Badge variant="emerald" dot>Resolved</Badge>;
    case 'CLOSED':
      return <Badge variant="gray" dot>Closed</Badge>;

    // Priority
    case 'LOW':
      return <Badge variant="gray">Low Priority</Badge>;
    case 'MEDIUM':
      return <Badge variant="blue">Medium Priority</Badge>;
    case 'HIGH':
      return <Badge variant="gold">High Priority</Badge>;
    case 'URGENT':
      return <Badge variant="red">Urgent Priority</Badge>;

    default:
      return <Badge variant="navy">{status}</Badge>;
  }
};
