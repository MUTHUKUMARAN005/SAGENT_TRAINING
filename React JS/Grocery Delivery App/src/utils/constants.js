export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
export const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Cash on Delivery', 'Net Banking', 'Wallet'];
export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
export const DELIVERY_STATUSES = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
export const USER_TYPES = ['ADMIN', 'SELLER', 'CUSTOMER', 'DELIVERY_PARTNER'];
export const REFUND_STATUSES = ['PENDING', 'PROCESSED', 'COMPLETED'];
export const VEHICLE_TYPES = ['Motorcycle', 'Bicycle', 'Scooter', 'Van', 'Car'];

export const PRODUCT_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: '#10b981' },
  { id: 'fruits', label: 'Fruits', icon: '🍎', color: '#ef4444' },
  { id: 'vegetables', label: 'Vegetables', icon: '🥬', color: '#22c55e' },
  { id: 'beverages', label: 'Beverages', icon: '☕', color: '#f59e0b' },
  { id: 'bakery', label: 'Bakery', icon: '🍞', color: '#d97706' },
  { id: 'dairy', label: 'Dairy', icon: '🥛', color: '#3b82f6' },
  { id: 'cooking', label: 'Cooking Essentials', icon: '🍳', color: '#ec4899' },
  { id: 'snacks', label: 'Snacks', icon: '🍿', color: '#8b5cf6' },
  { id: 'personal', label: 'Personal Care', icon: '🧴', color: '#06b6d4' },
  { id: 'household', label: 'Household', icon: '🏠', color: '#14b8a6' },
];

export const CHART_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e', '#06b6d4'];

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name_asc', label: 'Name: A-Z' },
];

export const PAYMENT_ICONS = {
  'UPI': '📱', 'Credit Card': '💳', 'Debit Card': '💳',
  'Cash on Delivery': '💰', 'Net Banking': '🏦', 'Wallet': '👛',
};