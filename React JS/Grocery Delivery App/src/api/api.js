import axios from 'axios';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:8080/api';
const AUTH_BASE_PATH = process.env.REACT_APP_AUTH_BASE_PATH || '/auth';
const TOKEN_STORAGE_KEY = 'freshmart_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
};
export const clearAuthToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const loginUser = (data) => api.post(`${AUTH_BASE_PATH}/login`, data);
export const registerUserApi = (data) => api.post(`${AUTH_BASE_PATH}/register`, data);
export const getCurrentUser = () => api.get(`${AUTH_BASE_PATH}/me`);

// ==================== DASHBOARD ====================
export const getDashboardStats = () => api.get('/dashboard/stats');

// ==================== PRODUCTS ====================
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const searchProducts = (name) => api.get(`/products/search?name=${name}`);
export const getProductsByCategory = (category) => api.get(`/products/category/${category}`);

// ==================== CUSTOMERS ====================
export const getCustomers = () => api.get('/customers');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const addLoyaltyPoints = (id, points) => api.put(`/customers/${id}/loyalty/add?points=${points}`);
export const redeemLoyaltyPoints = (id, points) => api.put(`/customers/${id}/loyalty/redeem?points=${points}`);

// ==================== ORDERS ====================
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status?status=${status}`);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const getOrderItems = (id) => api.get(`/orders/${id}/items`);
export const getOrdersByCustomer = (customerId) => api.get(`/orders/customer/${customerId}`);

// ==================== STORES ====================
export const getStores = () => api.get('/stores');
export const getStore = (id) => api.get(`/stores/${id}`);
export const createStore = (data) => api.post('/stores', data);
export const updateStore = (id, data) => api.put(`/stores/${id}`, data);
export const deleteStore = (id) => api.delete(`/stores/${id}`);

// ==================== USERS ====================
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getUsersByType = (type) => api.get(`/users/type/${type}`);

// ==================== INVENTORY ====================
export const getInventory = () => api.get('/inventory');
export const getInventoryItem = (id) => api.get(`/inventory/${id}`);
export const getInventoryByProduct = (productId) => api.get(`/inventory/product/${productId}`);
export const getLowStock = () => api.get('/inventory/low-stock');
export const createInventory = (data) => api.post('/inventory', data);
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data);
export const updateStock = (id, quantity) => api.put(`/inventory/${id}/stock?quantity=${quantity}`);
export const decreaseStock = (productId, qty) => api.put(`/inventory/product/${productId}/decrease?quantity=${qty}`);
export const increaseStock = (productId, qty) => api.put(`/inventory/product/${productId}/increase?quantity=${qty}`);
export const deleteInventory = (id) => api.delete(`/inventory/${id}`);

// ==================== PAYMENTS ====================
export const getPayments = () => api.get('/payments');
export const getPayment = (id) => api.get(`/payments/${id}`);
export const getPaymentsByOrder = (orderId) => api.get(`/payments/order/${orderId}`);
export const getPaymentsByStatus = (status) => api.get(`/payments/status/${status}`);
export const getTotalRevenue = () => api.get('/payments/revenue');
export const createPayment = (data) => api.post('/payments', data);
export const processPayment = (id) => api.put(`/payments/${id}/process`);
export const refundPayment = (id) => api.put(`/payments/${id}/refund`);
export const failPayment = (id) => api.put(`/payments/${id}/fail`);
export const deletePayment = (id) => api.delete(`/payments/${id}`);

// ==================== DELIVERIES ====================
export const getDeliveries = () => api.get('/deliveries');
export const getDelivery = (id) => api.get(`/deliveries/${id}`);
export const getDeliveryByOrder = (orderId) => api.get(`/deliveries/order/${orderId}`);
export const getDeliveriesByStatus = (status) => api.get(`/deliveries/status/${status}`);
export const createDelivery = (data) => api.post('/deliveries', data);
export const updateDeliveryStatus = (id, status) => api.put(`/deliveries/${id}/status?status=${status}`);
export const assignDeliveryPerson = (deliveryId, personId) => api.put(`/deliveries/${deliveryId}/assign/${personId}`);
export const deleteDelivery = (id) => api.delete(`/deliveries/${id}`);

// Delivery Persons
export const getDeliveryPersons = () => api.get('/deliveries/persons');
export const getDeliveryPerson = (id) => api.get(`/deliveries/persons/${id}`);
export const getAvailablePersons = () => api.get('/deliveries/persons/available');
export const createDeliveryPerson = (data) => api.post('/deliveries/persons', data);
export const updateDeliveryPerson = (id, data) => api.put(`/deliveries/persons/${id}`, data);
export const updateDeliveryPersonLocation = (id, location) => api.put(`/deliveries/persons/${id}/location?location=${location}`);
export const deleteDeliveryPerson = (id) => api.delete(`/deliveries/persons/${id}`);

// ==================== DISCOUNTS ====================
export const getDiscounts = () => api.get('/discounts');
export const getDiscount = (id) => api.get(`/discounts/${id}`);
export const getActiveDiscounts = () => api.get('/discounts/active');
export const calculateDiscount = (cartValue) => api.get(`/discounts/calculate?cartValue=${cartValue}`);
export const createDiscount = (data) => api.post('/discounts', data);
export const updateDiscount = (id, data) => api.put(`/discounts/${id}`, data);
export const toggleDiscount = (id) => api.put(`/discounts/${id}/toggle`);
export const deleteDiscount = (id) => api.delete(`/discounts/${id}`);

// ==================== CANCELLATIONS ====================
export const getCancellations = () => api.get('/cancellations');
export const getCancellation = (id) => api.get(`/cancellations/${id}`);
export const createCancellation = (data) => api.post('/cancellations', data);
export const processRefund = (id) => api.put(`/cancellations/${id}/process-refund`);
export const completeRefund = (id) => api.put(`/cancellations/${id}/complete-refund`);
export const deleteCancellation = (id) => api.delete(`/cancellations/${id}`);

// ==================== NOTIFICATIONS ====================
export const getNotifications = () => api.get('/notifications');
export const getNotification = (id) => api.get(`/notifications/${id}`);
export const getUserNotifications = (userId) => api.get(`/notifications/user/${userId}`);
export const getUnreadCount = (userId) => api.get(`/notifications/user/${userId}/unread-count`);
export const createNotification = (data) => api.post('/notifications', data);
export const sendOrderNotification = (userId, orderId, message, type) =>
  api.post(`/notifications/order?userId=${userId}&orderId=${orderId}&message=${encodeURIComponent(message)}&type=${type}`);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = (userId) => api.put(`/notifications/user/${userId}/read-all`);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// ==================== CARTS ====================
export const getCarts = () => api.get('/carts');
export const getCart = (id) => api.get(`/carts/${id}`);
export const getCartByCustomer = (customerId) => api.get(`/carts/customer/${customerId}`);
export const getCartItems = (cartId) => api.get(`/carts/${cartId}/items`);
export const getCartTotal = (cartId) => api.get(`/carts/${cartId}/total`);
export const createCartForCustomer = (customerId) => api.post(`/carts/customer/${customerId}`);
export const addItemToCart = (cartId, productId, quantity) =>
  api.post(`/carts/${cartId}/items?productId=${productId}&quantity=${quantity}`);
export const updateCartItemQuantity = (itemId, quantity) =>
  api.put(`/carts/items/${itemId}?quantity=${quantity}`);
export const removeCartItem = (itemId) => api.delete(`/carts/items/${itemId}`);
export const clearCart = (cartId) => api.delete(`/carts/${cartId}/clear`);
export const deleteCart = (id) => api.delete(`/carts/${id}`);

export default api;
