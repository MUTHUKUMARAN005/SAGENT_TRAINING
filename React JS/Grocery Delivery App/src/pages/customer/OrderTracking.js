import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiMapPin, FiPackage, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import OrderTimeline from '../../components/customer/OrderTimeline';
import { useOrders } from '../../context/OrderContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import './OrderTracking.css';

const OrderTracking = () => {
  const { id } = useParams();
  const { getOrderById, getPaymentsByOrder, cancelOrder } = useOrders();
  const order = getOrderById(id);
  const payments = getPaymentsByOrder(id);
  const history = Array.isArray(order?.trackingHistory) ? order.trackingHistory : [];

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-shell">
          <div className="order-empty">
            <h2>Order not found</h2>
            <Link to="/my-orders">Go to order history</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <div className="order-detail-shell">
        <div className="order-head">
          <div>
            <h1>Order #{order.orderId}</h1>
            <p>Placed on {formatDateTime(order.orderDate)}</p>
          </div>
          <StatusBadge status={order.status} icon="📦" />
        </div>

        <div className="order-grid">
          <section className="order-card order-card-full">
            <h2>
              <FiClock /> Order Tracking
            </h2>
            <OrderTimeline status={order.status} history={history} />
          </section>

          <section className="order-card">
            <h2>
              <FiPackage /> Order Items
            </h2>
            <div className="order-item-list">
              {(order.items || []).map((item) => (
                <article key={item.itemId} className="order-item">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/100x100?text=Item'}
                    alt={item.productName}
                  />
                  <div>
                    <h3>{item.productName}</h3>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <strong>{formatCurrency(item.lineTotal)}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="order-card">
            <h2>
              <FiMapPin /> Delivery Address
            </h2>
            {order.shippingAddress ? (
              <div className="order-address">
                <strong>{order.shippingAddress.fullName}</strong>
                <p>{order.shippingAddress.phone}</p>
                <p>
                  {order.shippingAddress.line1}, {order.shippingAddress.line2 ? `${order.shippingAddress.line2}, ` : ''}
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
              </div>
            ) : (
              <p className="muted">No address information available.</p>
            )}
          </section>

          <section className="order-card">
            <h2>
              <FiClock /> Payment Details
            </h2>
            <p className="order-line"><span>Method</span><strong>{order.paymentMethod}</strong></p>
            <p className="order-line"><span>Status</span><strong>{order.paymentStatus}</strong></p>
            <p className="order-line"><span>Total</span><strong>{formatCurrency(order.totalAmount)}</strong></p>
            {payments.length > 0 && (
              <div className="order-payment-history">
                {payments.map((payment) => (
                  <p key={payment.paymentId}>
                    {payment.paymentStatus} - {formatDateTime(payment.paymentDate)}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section className="order-card">
            <h2>Order Summary</h2>
            <p className="order-line"><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></p>
            <p className="order-line"><span>Discount</span><strong>-{formatCurrency(order.discountApplied)}</strong></p>
            <p className="order-line"><span>Delivery</span><strong>{order.deliveryFee ? formatCurrency(order.deliveryFee) : 'FREE'}</strong></p>
            <p className="order-line total"><span>Grand Total</span><strong>{formatCurrency(order.totalAmount)}</strong></p>

            {['ORDERED', 'PACKED', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && (
              <motion.button
                className="order-cancel-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const cancelled = cancelOrder(order.orderId);
                  if (cancelled) toast.success('Order cancelled successfully');
                }}
              >
                <FiXCircle /> Cancel Order
              </motion.button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
