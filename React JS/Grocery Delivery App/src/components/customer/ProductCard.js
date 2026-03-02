import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiStar, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import './ProductCard.css';

const ProductCard = ({ product, index = 0 }) => {
  const [liked, setLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const rating = (3.5 + Math.random() * 1.5).toFixed(1);
  const reviews = Math.floor(Math.random() * 500) + 50;
  const discount = Math.floor(Math.random() * 30) + 5;
  const originalPrice = (product.price * (100 / (100 - discount))).toFixed(0);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    toast.success(`${product.productName} added to cart! 🛒`);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
    toast(liked ? 'Removed from wishlist' : 'Added to wishlist ❤️', {
      icon: liked ? '💔' : '❤️',
    });
  };

  return (
    <motion.div
      className="product-card-customer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/products/${product.productId}`)}
      layout
    >
      {/* Image Section */}
      <div className="pcc-image-wrap">
        {!imageLoaded && <div className="pcc-image-skeleton skeleton" />}
        <motion.img
          src={product.imageUrl || 'https://via.placeholder.com/300x200?text=Product'}
          alt={product.productName}
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        />

        {/* Discount Badge */}
        <motion.div
          className="pcc-discount-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {discount}% OFF
        </motion.div>

        {/* Wishlist */}
        <motion.button
          className={`pcc-wishlist-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          animate={liked ? { scale: [1, 1.3, 1] } : {}}
        >
          <FiHeart size={18} fill={liked ? '#ef4444' : 'none'} />
        </motion.button>

        {/* Quick View */}
        <motion.div
          className="pcc-quick-actions"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.button
            className="pcc-quick-view"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiEye size={16} /> Quick View
          </motion.button>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="pcc-info">
        {/* Brand/Store */}
        <p className="pcc-brand">{product.store?.storeName || 'FreshMart'}</p>

        {/* Name */}
        <h3 className="pcc-name">{product.productName}</h3>

        {/* Rating */}
        <div className="pcc-rating">
          <span className="pcc-rating-badge">
            {rating} <FiStar size={11} fill="#fff" />
          </span>
          <span className="pcc-reviews">({reviews})</span>
        </div>

        {/* Price */}
        <div className="pcc-price-row">
          <span className="pcc-price">{formatCurrency(product.price)}</span>
          <span className="pcc-original-price">{formatCurrency(originalPrice)}</span>
          <span className="pcc-discount-text">{discount}% off</span>
        </div>

        {/* Free Delivery */}
        <p className="pcc-delivery">🚚 Free delivery</p>

        {/* Add to Cart */}
        <motion.button
          className="pcc-add-cart-btn"
          onClick={handleAddToCart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiShoppingCart size={16} /> Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;