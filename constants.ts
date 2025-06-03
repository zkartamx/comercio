import { Product, User, Role } from './types';

// SELLER_IDS might be used if sellers were not managed by a User system with roles.
// For now, it's unused as seller identity comes from the logged-in User.
export const SELLER_IDS: string[] = ['Vendedor001', 'Vendedor002', 'Vendedor003'];

// Admin and Payment Configuration
export const ADMIN_WHATSAPP_NUMBER = '+525538985281'; // Example WhatsApp number for Mexico.
// BANK_TRANSFER_INSTRUCTIONS moved to localization.ts and will be in Spanish.

// IMPORTANT: Storing passwords in plaintext is highly insecure. 
// This is for demonstration purposes only in a sandboxed environment.
// In a real application, use hashed passwords and a secure authentication system.
// USERS and INITIAL_PRODUCTS have been moved to apiService.ts to simulate a backend.
