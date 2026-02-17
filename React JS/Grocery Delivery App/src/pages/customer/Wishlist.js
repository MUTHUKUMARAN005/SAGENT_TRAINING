import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiStar } from 'react-icons/fi';
import './Wishlist.css';

const wishlistItems = [
  {
    id: 1,
    name: 'Organic Hass Avocado (Pack of 4)',
    brand: 'Farm Fresh',
    price: 249,
    originalPrice: 299,
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=640&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Cold Pressed Extra Virgin Olive Oil',
    brand: 'Oliva Gold',
    price: 699,
    originalPrice: 799,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=640&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Premium Trail Mix Nuts & Seeds',
    brand: 'Nutri Basket',
    price: 389,
    originalPrice: 459,
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=640&auto=format&fit=crop&q=80',
  },
];

const Wishlist = () => {
  const totalSaved = wishlistItems.reduce(
    (sum, item) => sum + (item.originalPrice - item.price),
    0
  );

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
              <strong>{wishlistItems.length}</strong>
              <span>Items</span>
            </div>
            <div>
              <strong>₹{totalSaved}</strong>
              <span>Potential Savings</span>
            </div>
          </div>
        </motion.div>

        <div className="wishlist-grid-cards">
          {wishlistItems.map((item, index) => (
            <motion.article
              key={item.id}
              className="wishlist-card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index, duration: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <div className="wishlist-image-wrap">
                <img src={item.image} alt={item.name} />
                <span className="wishlist-discount">
                  {Math.round(
                    ((item.originalPrice - item.price) / item.originalPrice) * 100
                  )}
                  % off
                </span>
              </div>

              <div className="wishlist-card-content">
                <p className="wishlist-brand">{item.brand}</p>
                <h3>{item.name}</h3>

                <div className="wishlist-rating">
                  <FiStar />
                  <span>{item.rating}</span>
                </div>

                <div className="wishlist-pricing">
                  <strong>₹{item.price}</strong>
                  <span>₹{item.originalPrice}</span>
                </div>

                <div className="wishlist-actions">
                  <button className="wishlist-btn wishlist-btn-primary" type="button">
                    <FiShoppingCart /> Add to Cart
                  </button>
                  <button className="wishlist-btn wishlist-btn-ghost" type="button">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
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
