import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    discount,
    deliveryFee,
    total,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <div className="cart-page">
      <div className="cart-page-shell">
        <h1>
          <FiShoppingCart /> Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="cart-page-empty">
            <p>Your cart is empty.</p>
            <Link to="/products" className="cart-link-btn">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-card">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.article
                    key={item.productId}
                    className="cart-page-item"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    layout
                  >
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/100x100?text=Item'}
                      alt={item.productName}
                    />
                    <div className="cart-page-item-meta">
                      <h3>{item.productName}</h3>
                      <p>{formatCurrency(item.price)}</p>
                      <div className="cart-page-qty">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <FiMinus />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                    <div className="cart-page-item-right">
                      <strong>{formatCurrency(item.price * item.quantity)}</strong>
                      <button onClick={() => removeFromCart(item.productId)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            <aside className="cart-summary-card">
              <h2>Cart Total</h2>
              <div className="summary-line">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="summary-line">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="summary-line">
                <span>Delivery</span>
                <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'FREE'}</span>
              </div>
              <div className="summary-line total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
