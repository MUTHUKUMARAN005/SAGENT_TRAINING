import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, subtotal, discount, total, totalItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="cart-drawer-header">
              <h2>
                <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  🛒
                </motion.span>
                {' '}My Cart ({totalItems})
              </h2>
              <motion.button
                className="cart-close-btn"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX size={20} />
              </motion.button>
            </div>

            {/* Items */}
            <div className="cart-items-list">
              <AnimatePresence>
                {items.length === 0 ? (
                  <motion.div
                    className="cart-empty"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <FiShoppingBag size={48} color="#cbd5e1" />
                    </motion.div>
                    <h3>Your cart is empty</h3>
                    <p>Add items to get started</p>
                  </motion.div>
                ) : (
                  items.map((item, i) => (
                    <motion.div
                      key={item.productId}
                      className="cart-item"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30, height: 0 }}
                      transition={{ delay: i * 0.05 }}
                      layout
                    >
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/100x100?text=Item'}
                        alt={item.productName}
                        className="cart-item-img"
                      />
                      <div className="cart-item-info">
                        <h4>{item.productName}</h4>
                        <p className="cart-item-price">{formatCurrency(item.price)}</p>
                        <div className="cart-item-qty">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <FiMinus size={14} />
                          </motion.button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <FiPlus size={14} />
                          </motion.button>
                        </div>
                      </div>
                      <div className="cart-item-right">
                        <p className="cart-item-subtotal">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <motion.button
                          className="cart-item-remove"
                          onClick={() => removeFromCart(item.productId)}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                        >
                          <FiTrash2 size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <motion.div
                className="cart-summary"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
              >
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {discount > 0 && (
                  <motion.div
                    className="cart-summary-row discount"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span>🎉 Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </motion.div>
                )}
                <div className="cart-summary-row delivery">
                  <span>Delivery</span>
                  <span className="free">FREE</span>
                </div>
                <div className="cart-divider" />
                <div className="cart-summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <motion.button
                  className="checkout-btn"
                  onClick={() => { onClose(); navigate('/checkout'); }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(99,102,241,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Checkout
                  <span className="checkout-total">{formatCurrency(total)}</span>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
