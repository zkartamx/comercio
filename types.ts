/**
 * Represents a product in the catalog.
 */
export interface Product {
  id: string;
  name: string; // Name is expected to be in Spanish
  description: string; // Description is expected to be in Spanish
  price: number;
  imageUrl: string;
  stock: number;
}

/**
 * Represents an item in the shopping cart, extending Product with quantity.
 */
export interface CartItem extends Product {
  quantity: number;
}

/**
 * Represents an item within an order, including price at the time of order.
 */
export interface OrderItem {
  productId: string;
  productName: string; // Stores the Spanish product name at the time of order
  quantity: number;
  priceAtOrder: number; // Price of the product when the order was placed
}

/**
 * Enum for possible statuses of an order.
 */
export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

/**
 * Enum for possible payment statuses of an order.
 */
export enum PaymentStatus {
  UNPAID = 'Unpaid',
  PAID = 'Paid',
  REFUNDED = 'Refunded'
}

/**
 * Represents a shipping address.
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string; // Optional phone number
}

/**
 * Represents billing information for invoices (Mexico specific).
 */
export interface BillingInfo {
  rfc: string; // Registro Federal de Contribuyentes
  razonSocial: string; // Legal business name
  cfdiUse: string; // Uso del CFDI (e.g., G03 - Gastos en general)
  fiscalAddress: Address; // Fiscal address, can be different from shipping
  email?: string; // Email for receiving invoices, if different from account
}


/**
 * Represents a customer order.
 */
export interface Order {
  id: string;
  userId?: number; // Optional: ID of the registered customer who placed the order, maps to User.id
  customerName: string; // Name used for the order (could be guest or registered user's display name)
  customerEmail: string; // Email used for the order
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus; // New field for payment status
  createdAt: string; // ISO Date string (e.g., "2023-10-27T10:00:00.000Z")
  shippingAddress: Address; // Snapshot of shipping address at time of order
  billingRequested: boolean;
  billingDetails?: BillingInfo; // Snapshot of billing details if invoice requested
}

/**
 * Represents the data payload for placing a new order.
 */
export interface OrderPlacementPayload {
  userId?: number; // Optional: ID of the registered customer, maps to User.id
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  billingRequested: boolean;
  billingDetails?: BillingInfo;
  password?: string; // Optional password for account creation during guest checkout
}

/**
 * Enum for the source of a sale.
 */
export enum SaleSource {
  ONLINE = 'Online', // Sale originated from a customer order via the CustomerView
  SELLER = 'Seller Direct' // Sale logged directly by a seller via the SellerView
}

/**
 * Represents a record of a sale, which can originate from an online order or a direct seller transaction.
 */
/**
 * Represents the nested product details within an AdminViewSaleItem.
 */
export interface AdminViewSaleItemProductDetails {
  id: string;
  name: string;
  // Add other product fields if needed for display, e.g., imageUrl
}

/**
 * Represents an item within a SaleRecord, specifically for the admin view,
 * reflecting the structure from getAllSales endpoint (includes unitPrice and nested product).
 */
/**
 * Represents an item when creating a new sale.
 */
export interface SaleCreationItem {
  productId: number; // Backend's createSaleRecord expects productId as number
  quantity: number;
  unitPrice: number;
  // productName is not sent; backend derives it
}

/**
 * Represents the payload for creating a new sale record.
 */
export interface SaleCreationPayload {
  items: SaleCreationItem[];
  totalAmount: number;
  source: SaleSource;
  sellerId?: string; // Required if source is SELLER
  orderId?: string;  // Required if source is ONLINE
  notes?: string;
  // saleDate is typically set by the backend
}

export interface AdminViewSaleItem {
  productId: string;
  quantity: number;
  unitPrice: number; // Price at which the item was sold
  product: AdminViewSaleItemProductDetails; // Nested product details
  // id?: string; // The SaleItem's own ID, if available and needed
}

export interface SaleRecord {
  id: string;
  sellerId?: string; // Optional: if logged by a specific seller (source: SELLER)
  orderId?: string;  // Optional: if linked to a customer order (source: ONLINE)
  items: AdminViewSaleItem[];
  totalAmount: number;
  saleDate: string; // ISO Date string
  source: SaleSource;
  notes?: string; // Optional notes for the sale
}

/**
 * Enum for possible statuses of a product request made by a seller.
 */
export enum RequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

/**
 * Represents a request made by a seller for product stock.
 */
export interface ProductRequest {
  id: string;
  sellerId: string; // ID of the seller who made the request
  productId: string; // Foreign key to the product
  quantityRequested: number;
  createdAt: string; // ISO Date string
  status: RequestStatus;
  notes?: string; // Optional notes or reason for the request
  product?: { // Nested product details, optional as it's an include
    id: string; // Assuming product ID is string based on Product interface
    name: string;
  };
  requestedBy?: { // Nested seller details, populated by an include
    id: number; 
    name: string;
    email: string;
  };
}

/**
 * Enum for the different views/pages in the application.
 */
export enum View {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
  LOGIN = 'login',
  REGISTER = 'register', // New view for customer registration
  PROFILE = 'profile'    // New view for customer profile
}

/**
 * Enum for user roles within the application.
 */
export enum Role {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer' // Added customer role
}

/**
 * Represents a user in the system (Admin, Seller, or Customer).
 */
export interface User {
  id: number; // Unique identifier from backend (e.g., 1, 2, 3)
  username: string; // Login username (for Admin/Seller), or email (for Customer)
  password?: string; // Password for authentication
  role: Role; // User's role
  name: string; // Name from backend (e.g., "Admin", "Juan Pérez")
  email: string; // Email, mandatory for all users from backend
  defaultShippingAddress?: Address; // Renamed from 'address' for consistency with backend
  defaultBillingDetails?: BillingInfo; // Renamed from 'billingInfo' for consistency with backend
  createdAt?: string; // ISO Date string when the user was created
  updatedAt?: string; // ISO Date string when the user was last updated
}


/**
 * Represents a key for a translatable string.
 * This type is derived from the keys of the `translations` object in `localization.ts`.
 * It ensures type safety when using the `t` function for internationalization.
 */
export type TranslationKey = keyof typeof import('./localization').translations;