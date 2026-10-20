export type ProductStatus = 'ACTIVE' | 'PENDING' | 'NEEDS_CHANGES' | 'REJECTED' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categorySlug: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  status: ProductStatus;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  tags: string[];
  materialsOrIngredients?: string[];
  specifications?: Record<string, string>;
  createdAt: string;
  sellerDepartment?: string; // e.g. "Department of Textile Design" - NOT individual personal identity
  sku: string;
  adminFeedback?: string; // Reason when rejected or needs changes
  sellerId?: string;
  categoryId?: string;
}

export type CategoryStatus = 'active' | 'hidden' | 'archived';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  image?: string; // backward-compatible alias
  imagePublicId?: string;
  iconName: string;
  status: CategoryStatus;
  isFeatured: boolean;
  featured?: boolean; // backward-compatible alias
  sortOrder: number;
  productCount?: number;
  departmentTag?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ServicePackage {
  title: string;
  price: number;
  deliveryDays: number;
  features: string[];
}

export interface Service {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  turnaroundTime: string;
  deliverables: string[];
  image: string;
  department: string;
  packages: ServicePackage[];
  tags: string[];
}

export type OrderStatus =
  | 'PLACED'
  | 'PAYMENT_CONFIRMED'
  | 'PROCESSING'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'RETURNED'
  | 'DISPUTED';

export type PaymentMethod = 'COD' | 'RAAST' | 'BANK_TRANSFER' | 'CAMPUS_WALLET';

export interface OrderItem {
  productId: string;
  sellerId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  fulfillmentStatus?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerUid?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: 'CAMPUS_PICKUP' | 'STANDARD_DELIVERY';
  pickupLocation?: string;
  shippingAddress?: {
    street: string;
    area: string;
    city: string;
    postalCode?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  createdAt: string;
  estimatedDelivery: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  trackingNumber?: string;
  disputeId?: string;
}

export type TicketIssueType =
  | 'WRONG_PRODUCT'
  | 'DAMAGED_PRODUCT'
  | 'MISSING_ORDER'
  | 'CANCELLATION_REQUEST'
  | 'REFUND_REQUEST'
  | 'QUALITY_CONCERN'
  | 'OTHER';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'AWAITING_SELLER_INPUT' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicketMessage {
  id: string;
  sender: 'CUSTOMER' | 'ADMIN_SUPPORT';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  orderNumber?: string;
  issueType: TicketIssueType;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessage[];
  internalAdminNotes?: string[];
  resolutionSummary?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN';
  verifiedPurchase: boolean;
}

export interface CustomerRecord {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  departmentOrAffiliation: string; // e.g. "JUW Student (Dept of CS)" or "Faculty Member" or "Alumna"
  role?: string;
  totalOrders: number;
  totalSpent: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
  joinedDate: string;
  lastActive: string;
  createdAt?: string;
}

export interface SellerRecord {
  id: string;
  sellerCode: string;
  studentName: string; // Admin visibility only
  studentRollNumber: string; // e.g. "JUW-2022-CS-089"
  department: string;
  semester: string;
  contactEmail: string;
  contactPhone: string;
  storeName?: string;
  storeDescription?: string;
  firebaseUid?: string;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  approvedBy?: string;
  approvalDate?: string;
  totalProductsListed: number;
  lifetimeRevenue: number;
  rating: number;
  joinedDate: string;
}

export type SystemUserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SELLER' | 'STUDENT' | 'FACULTY' | 'ALUMNA' | 'GUEST';
export type UserAccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'INVITED' | 'SUSPENDED' | 'DISABLED' | 'REJECTED';

export interface AdminUserRecord {
  id: string;
  uid: string;
  email: string;
  name: string;
  phone?: string;
  departmentOrAffiliation?: string;
  role: SystemUserRole;
  status: UserAccountStatus;
  permissions?: string[];
  roleAssignedAt?: string;
  roleAssignedBy?: string;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActive?: string;
  // Seller details if also a seller
  sellerRecord?: SellerRecord;
}

export interface SellerInvitation {
  id: string;
  token: string;
  type: 'SELLER_INVITATION';
  fullName: string;
  email: string;
  studentRollNumber?: string;
  department: string;
  semester: string;
  phone: string;
  storeName: string;
  storeDescription?: string;
  initialStatus: 'VERIFIED' | 'PENDING_VERIFICATION';
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedByUid?: string;
}

export interface AdminInvitation {
  id: string;
  token: string;
  type: 'ADMIN_INVITATION';
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  permissions: string[];
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedByUid?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  targetUid?: string | null;
  targetEmail?: string | null;
  targetType?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface UserSearchResult {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  status: string;
  isSeller: boolean;
  sellerStatus?: string;
  sellerStoreName?: string;
  isAdmin: boolean;
  adminRole?: string;
}

export interface AddSellerPayload {
  onboardingMethod: 'INVITE' | 'EXISTING_USER';
  fullName: string;
  email: string;
  studentRollNumber: string;
  department: string;
  semester: string;
  phone: string;
  storeName: string;
  storeDescription?: string;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION';
  existingUid?: string;
}

export interface AddAdminPayload {
  onboardingMethod: 'INVITE' | 'EXISTING_USER';
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  permissions: string[];
  existingUid?: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: 'BAZAAR' | 'WORKSHOP' | 'COMPETITION' | 'EXHIBITION';
  image: string;
  registrationOpen: boolean;
}

export interface StudentVenture {
  id: string;
  brandName: string;
  focusArea: string;
  foundedYear: string;
  studentDepartment: string;
  shortBio: string;
  badge: string;
  image: string;
  category: string;
}
