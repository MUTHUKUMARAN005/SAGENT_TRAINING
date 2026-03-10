import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createOrder as createOrderApi,
  createPayment as createPaymentApi,
  getOrdersByCustomer,
  getPaymentsByOrder as getPaymentsByOrderApi,
  updateOrderStatus as updateOrderStatusApi,
} from '../api/api';
import { resolveCustomerId } from '../utils/customerIdentity';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useNotifications } from './NotificationContext';

const OrderContext = createContext(null);

const getOrdersStorageKey = (email) => `freshmart_orders_${email || 'guest'}`;
const getPaymentsStorageKey = (email) => `freshmart_payments_${email || 'guest'}`;

const readStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const nowIso = () => new Date().toISOString();

const createTransactionId = () => `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
const TRACKING_STEPS = ['ORDERED', 'PACKED', 'SHIPPED', 'DELIVERED'];
const statusAliases = {
  PENDING: 'ORDERED',
  CONFIRMED: 'ORDERED',
  PROCESSING: 'PACKED',
};

const normalizeStatus = (status) => statusAliases[status] || status;
const toBackendStatus = (status) => {
  const map = {
    ORDERED: 'CONFIRMED',
    PACKED: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  };
  return map[status] || status;
};

const createHistoryEntry = (status, note = '') => ({
  status,
  at: nowIso(),
  note,
});

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const { items: cartItems, subtotal, discount, deliveryFee, total, clearCart } = useCart();
  const { pushNotification } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const ordersKey = getOrdersStorageKey(user?.email);
  const paymentsKey = getPaymentsStorageKey(user?.email);
  const trackingTimersRef = useRef({});
  const customerIdRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const localOrders = readStorage(ordersKey);
    const localPayments = readStorage(paymentsKey);
    setOrders(localOrders);
    setPayments(localPayments);

    const syncFromBackend = async () => {
      const customerId = await resolveCustomerId(user);
      customerIdRef.current = customerId;
      if (!customerId || !mounted) return;

      try {
        const ordersResponse = await getOrdersByCustomer(customerId);
        const backendOrdersRaw = Array.isArray(ordersResponse?.data) ? ordersResponse.data : [];
        const backendOrders = backendOrdersRaw.map((order) => {
          const normalized = normalizeStatus(order?.status);
          const history = Array.isArray(order?.trackingHistory)
            ? order.trackingHistory
            : [createHistoryEntry('ORDERED', 'Imported from database')];
          if (!history.some((entry) => normalizeStatus(entry.status) === normalized)) {
            history.push(createHistoryEntry(normalized, 'Current backend status'));
          }
          return {
            ...order,
            orderId: order?.orderId ?? order?.id,
            backendOrderId: order?.orderId ?? order?.id,
            status: normalized,
            trackingHistory: history,
          };
        });

        const mergedOrdersMap = new Map(
          [...localOrders, ...backendOrders].map((order) => [String(order.orderId), order])
        );
        const mergedOrders = Array.from(mergedOrdersMap.values()).sort(
          (a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime()
        );
        if (mounted) setOrders(mergedOrders);

        const backendPaymentResults = await Promise.allSettled(
          backendOrders.map((order) =>
            getPaymentsByOrderApi(order.backendOrderId || order.orderId)
          )
        );

        const backendPayments = backendPaymentResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => (Array.isArray(result.value?.data) ? result.value.data : []))
          .map((payment) => ({
            ...payment,
            paymentId: payment?.paymentId ?? payment?.id,
            orderId: payment?.orderId ?? payment?.order?.orderId,
          }))
          .filter((payment) => payment.orderId != null);

        const mergedPaymentsMap = new Map(
          [...localPayments, ...backendPayments].map((payment) => [
            String(payment.paymentId ?? `${payment.orderId}_${payment.paymentStatus}_${payment.paymentDate}`),
            payment,
          ])
        );
        if (mounted) setPayments(Array.from(mergedPaymentsMap.values()));
      } catch {
        // Keep local data when backend is unavailable.
      }
    };

    syncFromBackend();

    return () => {
      mounted = false;
    };
  }, [ordersKey, paymentsKey, user]);

  useEffect(() => {
    localStorage.setItem(ordersKey, JSON.stringify(orders));
  }, [orders, ordersKey]);

  useEffect(() => {
    localStorage.setItem(paymentsKey, JSON.stringify(payments));
  }, [payments, paymentsKey]);

  useEffect(() => {
    return () => {
      Object.values(trackingTimersRef.current).forEach((timers) => {
        timers.forEach((timerId) => clearTimeout(timerId));
      });
      trackingTimersRef.current = {};
    };
  }, []);

  const clearTrackingTimers = (orderId) => {
    const key = String(orderId);
    const timers = trackingTimersRef.current[key] || [];
    timers.forEach((timerId) => clearTimeout(timerId));
    delete trackingTimersRef.current[key];
  };

  const updateOrderStatus = (orderId, nextStatus, options = {}) => {
    const normalizedNextStatus = normalizeStatus(nextStatus);
    const { notify = true, note = '' } = options;
    let changedOrder = null;

    setOrders((prev) =>
      prev.map((order) => {
        if (String(order.orderId) !== String(orderId)) return order;

        const currentStatus = normalizeStatus(order.status);
        if (currentStatus === 'CANCELLED' || currentStatus === 'DELIVERED') return order;
        if (currentStatus === normalizedNextStatus) return order;

        const history = Array.isArray(order.trackingHistory) ? order.trackingHistory : [];
        changedOrder = {
          ...order,
          status: normalizedNextStatus,
          trackingHistory: [...history, createHistoryEntry(normalizedNextStatus, note)],
        };
        return changedOrder;
      })
    );

    if (changedOrder && notify) {
      if (normalizedNextStatus === 'PACKED') {
        pushNotification({
          title: 'Order packed',
          message: `Order #${orderId} is packed and will be shipped soon.`,
          type: 'SHIPPING_UPDATE',
          orderId,
        });
      } else if (normalizedNextStatus === 'SHIPPED') {
        pushNotification({
          title: 'Shipping update',
          message: `Order #${orderId} has been shipped.`,
          type: 'SHIPPING_UPDATE',
          orderId,
        });
      } else if (normalizedNextStatus === 'DELIVERED') {
        pushNotification({
          title: 'Order delivered',
          message: `Order #${orderId} has been delivered.`,
          type: 'ORDER_DELIVERED',
          orderId,
        });
      }
    }

    if (changedOrder && (normalizedNextStatus === 'CANCELLED' || normalizedNextStatus === 'DELIVERED')) {
      clearTrackingTimers(orderId);
    }

    if (changedOrder) {
      const backendOrderId = changedOrder.backendOrderId || changedOrder.orderId;
      void updateOrderStatusApi(backendOrderId, toBackendStatus(normalizedNextStatus)).catch(() => {
        // Keep local status even when backend update fails.
      });
    }

    return changedOrder;
  };

  const scheduleTrackingProgress = (orderId) => {
    clearTrackingTimers(orderId);

    const timers = [
      setTimeout(() => updateOrderStatus(orderId, 'PACKED'), 15000),
      setTimeout(() => updateOrderStatus(orderId, 'SHIPPED'), 30000),
      setTimeout(() => updateOrderStatus(orderId, 'DELIVERED'), 45000),
    ];

    trackingTimersRef.current[String(orderId)] = timers;
  };

  const placeOrder = ({ address, paymentMethod = 'Cash on Delivery' }) => {
    if (!cartItems.length) return null;

    const createdAt = nowIso();
    const orderId = Date.now();
    const isCod = paymentMethod === 'Cash on Delivery';
    const paymentStatus = isCod ? 'PENDING' : 'COMPLETED';

    const orderItems = cartItems.map((item) => ({
      itemId: `${orderId}-${item.productId}`,
      productId: item.productId,
      productName: item.productName,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      imageUrl: item.imageUrl || '',
      lineTotal: Number(item.price || 0) * Number(item.quantity || 0),
    }));

    const order = {
      orderId,
      status: 'ORDERED',
      orderDate: createdAt,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        name: user?.name || 'Customer',
        email: user?.email || '',
      },
      shippingAddress: address || null,
      items: orderItems,
      subtotal,
      discountApplied: discount,
      deliveryFee,
      totalAmount: total,
      paymentMethod,
      paymentStatus,
      trackingHistory: [createHistoryEntry('ORDERED', 'Order received')],
    };

    const payment = {
      paymentId: Date.now() + 1,
      orderId,
      amount: total,
      paymentMethod,
      paymentStatus,
      transactionId: isCod ? 'COD-PENDING' : createTransactionId(),
      paymentDate: createdAt,
    };

    setOrders((prev) => [order, ...prev]);
    setPayments((prev) => [payment, ...prev]);
    clearCart();

    pushNotification({
      title: 'Order confirmation',
      message: `Order #${orderId} confirmed successfully.`,
      type: 'ORDER_CONFIRMATION',
      orderId,
    });

    scheduleTrackingProgress(orderId);

    const syncPlacedOrderToBackend = async () => {
      const customerId = customerIdRef.current || (await resolveCustomerId(user));
      if (!customerId) return;
      customerIdRef.current = customerId;

      const addressText = address
        ? `${address.line1 || ''} ${address.line2 || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`.trim()
        : '';

      const payload = {
        customer: { customerId },
        status: 'CONFIRMED',
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        discountApplied: order.discountApplied,
        deliveryAddress: addressText,
      };

      try {
        const response = await createOrderApi(payload);
        const backendOrderId = response?.data?.orderId ?? response?.data?.id;
        if (!backendOrderId) return;

        setOrders((prev) =>
          prev.map((item) =>
            String(item.orderId) === String(orderId)
              ? { ...item, backendOrderId }
              : item
          )
        );

        try {
          await createPaymentApi({
            order: { orderId: backendOrderId },
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paymentStatus: payment.paymentStatus,
            transactionId: payment.transactionId,
            paymentDate: payment.paymentDate,
          });
        } catch {
          // Payment sync is best effort.
        }
      } catch {
        // Keep local order when backend create fails.
      }
    };

    void syncPlacedOrderToBackend();
    return order;
  };

  const cancelOrder = (orderId) => {
    let cancelledOrder = null;
    clearTrackingTimers(orderId);
    setOrders((prev) =>
      prev.map((order) => {
        if (String(order.orderId) !== String(orderId)) return order;
        const currentStatus = normalizeStatus(order.status);
        if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') return order;
        const history = Array.isArray(order.trackingHistory) ? order.trackingHistory : [];
        cancelledOrder = {
          ...order,
          status: 'CANCELLED',
          cancelledAt: nowIso(),
          paymentStatus: order.paymentStatus === 'COMPLETED' ? 'REFUNDED' : order.paymentStatus,
          trackingHistory: [...history, createHistoryEntry('CANCELLED', 'Order cancelled')],
        };
        return cancelledOrder;
      })
    );

    if (cancelledOrder?.paymentStatus === 'REFUNDED') {
      setPayments((prev) => [
        {
          paymentId: Date.now() + 2,
          orderId: cancelledOrder.orderId,
          amount: cancelledOrder.totalAmount,
          paymentMethod: cancelledOrder.paymentMethod,
          paymentStatus: 'REFUNDED',
          transactionId: `RFND${Date.now()}`,
          paymentDate: nowIso(),
        },
        ...prev,
      ]);
    }

    if (cancelledOrder) {
      const backendOrderId = cancelledOrder.backendOrderId || cancelledOrder.orderId;
      void updateOrderStatusApi(backendOrderId, 'CANCELLED').catch(() => {
        // Keep local cancellation if backend update fails.
      });

      pushNotification({
        title: 'Order cancelled',
        message: `Order #${cancelledOrder.orderId} has been cancelled.`,
        type: 'ORDER_CANCELLED',
        orderId: cancelledOrder.orderId,
      });
    }

    return cancelledOrder;
  };

  const getOrderById = (orderId) =>
    orders.find((order) => String(order.orderId) === String(orderId)) || null;

  const getPaymentsByOrder = (orderId) =>
    payments.filter((payment) => String(payment.orderId) === String(orderId));

  const paymentSummary = useMemo(() => {
    const completedAmount = payments
      .filter((payment) => payment.paymentStatus === 'COMPLETED')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return {
      completedAmount,
      totalPayments: payments.length,
      pendingCount: payments.filter((payment) => payment.paymentStatus === 'PENDING').length,
    };
  }, [payments]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        payments,
        trackingSteps: TRACKING_STEPS,
        paymentSummary,
        placeOrder,
        cancelOrder,
        updateOrderStatus,
        getOrderById,
        getPaymentsByOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within OrderProvider');
  return context;
};

export default OrderContext;
