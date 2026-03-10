import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useWishlist } from '../../context/WishlistContext';
import './Wishlist.css';

const Wishlist = () => {
  const { items, totalSaved, removeFromWishlist, moveToCart } = useWishlist();

  return (
    <div className="wishlist-page">
      <div className="wishlist-background" aria-hidden="true">
        <div className="wishlist-aurora" />
        <div className="wishlist-grid" />
        <div className="wishlist-orb orb-1" />
        <div className="wishlist-orb orb-2" />
        <div className="wishlist-orb orb-3" />
      </div>

      <div className="wishlist-container">
        <motion.div
          className="wishlist-hero"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div>
            <span className="wishlist-chip">
              <FiHeart /> Saved For Later
            </span>
            <h1>My Wishlist</h1>
            <p>Track favorite picks and grab them when prices drop.</p>
          </div>
          <div className="wishlist-hero-stats">
            <div>
              <strong>{items.length}</strong>
              <span>Items</span>
            </div>
            <div>
              <strong>₹{totalSaved}</strong>
              <span>Potential Savings</span>
            </div>
          </div>
        </motion.div>

        <div className="wishlist-grid-cards">
          {items.length === 0 ? (
            <motion.article
              className="wishlist-card wishlist-empty-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="wishlist-card-content">
                <h3>No wishlist items yet</h3>
                <p className="wishlist-brand">Save items to quickly move them to cart later.</p>
                <Link to="/products" className="wishlist-btn wishlist-btn-primary">
                  Browse Products
                </Link>
              </div>
            </motion.article>
          ) : (
            items.map((item, index) => (
              <motion.article
                key={item.productId}
                className="wishlist-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <div className="wishlist-image-wrap">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/640x380?text=Wishlist+Item'}
                    alt={item.productName}
                  />
                  <span className="wishlist-discount">
                    {Math.round(
                      ((item.originalPrice - item.price) / Math.max(item.originalPrice, 1)) * 100
                    )}
                    % off
                  </span>
                </div>

                <div className="wishlist-card-content">
                  <p className="wishlist-brand">{item.brand}</p>
                  <h3>{item.productName}</h3>

                  <div className="wishlist-rating">
                    <FiStar />
                    <span>{item.rating}</span>
                  </div>

                  <div className="wishlist-pricing">
                    <strong>₹{item.price}</strong>
                    <span>₹{item.originalPrice}</span>
                  </div>

                  <div className="wishlist-actions">
                    <button
                      className="wishlist-btn wishlist-btn-primary"
                      type="button"
                      onClick={() => {
                        moveToCart(item.productId);
                        toast.success('Moved to cart');
                      }}
                    >
                      <FiShoppingCart /> Move to Cart
                    </button>
                    <button
                      className="wishlist-btn wishlist-btn-ghost"
                      type="button"
                      onClick={() => {
                        removeFromWishlist(item.productId);
                        toast.success('Removed from wishlist');
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>

        <motion.div
          className="wishlist-footer-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          Looking for more? <Link to="/products">Browse all products</Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Wishlist;
