import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCreditCard, FiMapPin, FiTruck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { formatCurrency } from '../../utils/formatters';
import './Checkout.css';

const getAddressStorageKey = (email) => `freshmart_customer_addresses_${email || 'guest'}`;

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, discount, deliveryFee, total } = useCart();
  const { placeOrder } = useOrders();
  const [paymentType, setPaymentType] = useState('ONLINE');
  const [onlineMethod, setOnlineMethod] = useState('UPI');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const addresses = useMemo(() => {
    try {
      const key = getAddressStorageKey(user?.email);
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(list)) return [];
      return list;
    } catch {
      return [];
    }
  }, [user?.email]);

  const selectedAddress = useMemo(() => {
    if (!addresses.length) return null;
    if (selectedAddressId) {
      return addresses.find((address) => String(address.id) === String(selectedAddressId)) || null;
    }
    return addresses.find((address) => address.isDefault) || addresses[0];
  }, [addresses, selectedAddressId]);

  const onPlaceOrder = () => {
    if (!items.length) {
      toast.error('Your cart is empty');
      return;
    }
    if (!selectedAddress) {
      toast.error('Please add/select a delivery address');
      return;
    }

    setPlacingOrder(true);
    const method = paymentType === 'ONLINE' ? onlineMethod : 'Cash on Delivery';
    const order = placeOrder({
      address: selectedAddress,
      paymentMethod: method,
    });
    setPlacingOrder(false);

    if (!order) {
      toast.error('Failed to place order');
      return;
    }

    toast.success('Order placed successfully');
    navigate(`/order/${order.orderId}`);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-shell">
        <h1>Checkout</h1>

        {!items.length ? (
          <div className="checkout-empty">
            <p>Your cart is empty.</p>
            <button onClick={() => navigate('/products')}>Continue shopping</button>
          </div>
        ) : (
          <div className="checkout-layout">
            <section className="checkout-main">
              <article className="checkout-card">
                <h2>
                  <FiMapPin /> Delivery Address
                </h2>
                {addresses.length === 0 ? (
                  <div className="checkout-inline-empty">
                    <p>No addresses found.</p>
                    <button onClick={() => navigate('/profile')}>Add address</button>
                  </div>
                ) : (
                  <div className="checkout-address-list">
                    {addresses.map((address) => (
                      <label key={address.id} className="checkout-address-item">
                        <input
                          type="radio"
                          name="address"
                          checked={String(selectedAddress?.id) === String(address.id)}
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                        <div>
                          <strong>{address.fullName}</strong>
                          <p>{address.phone}</p>
                          <p>
                            {address.line1}, {address.line2 ? `${address.line2}, ` : ''}
                            {address.city}, {address.state} - {address.postalCode}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </article>

              <article className="checkout-card">
                <h2>
                  <FiCreditCard /> Payment Method
                </h2>
                <div className="checkout-payment-options">
                  <label>
                    <input
                      type="radio"
                      checked={paymentType === 'ONLINE'}
                      onChange={() => setPaymentType('ONLINE')}
                    />
                    <span>Online Payment</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={paymentType === 'COD'}
                      onChange={() => setPaymentType('COD')}
                    />
                    <span>Cash on Delivery</span>
                  </label>
                </div>

                {paymentType === 'ONLINE' && (
                  <select
                    className="checkout-select"
                    value={onlineMethod}
                    onChange={(event) => setOnlineMethod(event.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                )}
              </article>
            </section>

            <aside className="checkout-card checkout-summary">
              <h2>
                <FiTruck /> Order Summary
              </h2>
              <div className="checkout-items">
                {items.map((item) => (
                  <div key={item.productId} className="checkout-item">
                    <span>{item.productName} x {item.quantity}</span>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="checkout-line">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="checkout-line">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="checkout-line">
                <span>Delivery</span>
                <span>{deliveryFee ? formatCurrency(deliveryFee) : 'FREE'}</span>
              </div>
              <div className="checkout-line total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <button className="checkout-place-btn" onClick={onPlaceOrder} disabled={placingOrder}>
                <FiCheckCircle /> {placingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
