import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowRight, FiTruck, FiShield, FiClock, FiPercent } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getProducts } from '../../api/api';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getProducts();
        setProducts(res.data);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const features = [
    { icon: FiTruck, title: 'Free Delivery', desc: 'On orders above ₹499', color: '#10b981' },
    { icon: FiShield, title: 'Secure Payment', desc: '100% secure checkout', color: '#3b82f6' },
    { icon: FiClock, title: 'Fast Delivery', desc: '30 min delivery', color: '#f59e0b' },
    { icon: FiPercent, title: 'Best Offers', desc: 'Up to 50% off', color: '#ec4899' },
  ];

  return (
    <div className="customer-home">
      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="hero-badge"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              🔥 New Season Sale
            </motion.span>
            <h1>
              Fresh Groceries
              <br />
              <span className="hero-highlight">Delivered Fast</span>
            </h1>
            <p>Shop the freshest fruits, vegetables, groceries and more. Delivered to your doorstep in 30 minutes.</p>
            <div className="hero-actions">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/products" className="hero-btn-primary">
                  Shop Now <FiArrowRight />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/products?category=Fruits" className="hero-btn-secondary">
                  Explore Categories
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="hero-image"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <motion.div
              className="hero-flow-orb hero-flow-orb-1"
              animate={
                prefersReducedMotion
                  ? {}
                  : { x: [0, 18, -8, 0], y: [0, -12, 10, 0], scale: [1, 1.08, 0.96, 1] }
              }
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="hero-flow-orb hero-flow-orb-2"
              animate={
                prefersReducedMotion
                  ? {}
                  : { x: [0, -14, 10, 0], y: [0, 10, -14, 0], scale: [1, 0.95, 1.06, 1] }
              }
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />

            <motion.div
              className="hero-image-float"
              animate={
                prefersReducedMotion
                  ? {}
                  : { y: [0, -10, 0, 8, 0], rotate: [0, -1, 0.8, 0] }
              }
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02, rotate: -1 }}
            >
              <motion.img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600"
                alt="Fresh Groceries"
                animate={prefersReducedMotion ? {} : { scale: [1, 1.015, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-container">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="feature-icon" style={{ background: `${feat.color}15`, color: feat.color }}>
                  <Icon size={24} />
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <Link to="/products" className="view-all-link">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="categories-grid">
            {PRODUCT_CATEGORIES.slice(0, 8).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/products?category=${cat.label}`} className="category-card-home">
                  <motion.div
                    className="category-icon-home"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    style={{ background: `${cat.color}12` }}
                  >
                    <span>{cat.icon}</span>
                  </motion.div>
                  <span className="category-label-home">{cat.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-section">
        <motion.div
          className="promo-banner"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="promo-content">
            <motion.span
              className="promo-discount"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              FLAT ₹120 OFF
            </motion.span>
            <h2>On orders above ₹1000</h2>
            <p>Use code: FRESH120</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="promo-btn">Shop Now</Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Products */}
      <section className="section">
        <div className="section-container">
          <div className="section-header">
            <h2>🔥 Trending Products</h2>
            <Link to="/products" className="view-all-link">
              View All <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading products..." />
          ) : (
            <div className="products-grid-home">
              {products.slice(0, 8).map((product, i) => (
                <ProductCard key={product.productId} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
