import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiHeart,
  FiMinus,
  FiPackage,
  FiPlus,
  FiShoppingCart,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getProduct, getProducts } from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatCurrency } from '../../utils/formatters';
import './ProductDetail.css';

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x600?text=Product+Image';

const getProductId = (product) => product?.productId ?? product?.id ?? null;
const getProductName = (product) => product?.productName ?? product?.name ?? 'Product';
const getProductPrice = (product) => Number(product?.price ?? product?.mrp ?? 0);
const getProductCategory = (product) => product?.category ?? 'General';
const getProductDescription = (product) =>
  product?.description || 'No description available for this product.';

const getProductImages = (product) => {
  const candidates = [];
  if (product?.imageUrl) candidates.push(product.imageUrl);
  if (Array.isArray(product?.images)) {
    product.images.forEach((item) => {
      if (typeof item === 'string') candidates.push(item);
      if (item?.url) candidates.push(item.url);
    });
  }
  if (Array.isArray(product?.imageUrls)) {
    product.imageUrls.forEach((url) => {
      if (url) candidates.push(url);
    });
  }
  const normalized = candidates.filter(Boolean);
  return normalized.length ? normalized : [FALLBACK_IMAGE];
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    let mounted = true;

    const fetchProduct = async () => {
      try {
        const res = await getProduct(id);
        if (!mounted) return;
        setProduct(res.data);
      } catch {
        try {
          const fallback = await getProducts();
          if (!mounted) return;
          const item = (fallback.data || []).find(
            (candidate) => String(getProductId(candidate)) === String(id)
          );
          if (item) {
            setProduct(item);
            return;
          }
          toast.error('Product not found');
        } catch {
          toast.error('Failed to load product');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  const price = getProductPrice(product);
  const productId = getProductId(product);
  const productName = getProductName(product);
  const images = useMemo(() => getProductImages(product), [product]);
  const maxQty = 20;
  const liked = isInWishlist(productId);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [id]);

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxQty) return maxQty;
      return next;
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-shell">
          <button className="pd-back-btn" onClick={() => navigate('/products')}>
            <FiArrowLeft /> Back to Products
          </button>
          <div className="pd-empty">
            <h2>Product not found</h2>
            <p>The product you requested is unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-shell">
        <motion.button
          className="pd-back-btn"
          onClick={() => navigate('/products')}
          whileHover={{ x: -2 }}
        >
          <FiArrowLeft /> Back to Products
        </motion.button>

        <div className="pd-content">
          <motion.div
            className="pd-gallery"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="pd-main-image-wrap">
              <img
                className="pd-main-image"
                src={images[activeImage] || FALLBACK_IMAGE}
                alt={getProductName(product)}
              />
            </div>
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    className={`pd-thumb ${index === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={image} alt={`${getProductName(product)} preview ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            className="pd-meta"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 }}
          >
            <span className="pd-category">{getProductCategory(product)}</span>
            <h1>{productName}</h1>
            <p className="pd-description">{getProductDescription(product)}</p>

            <div className="pd-price-row">
              <strong>{formatCurrency(price)}</strong>
              <span className="pd-mrp">{formatCurrency(price * 1.15)}</span>
              <span className="pd-offer">13% off</span>
            </div>

            <div className="pd-stock in-stock">
              <FiCheckCircle />
              Ready to dispatch
            </div>

            <div className="pd-row">
              <div className="pd-qty">
                <button onClick={() => handleQuantityChange(-1)}>
                  <FiMinus />
                </button>
                <span>{quantity}</span>
                <button onClick={() => handleQuantityChange(1)}>
                  <FiPlus />
                </button>
              </div>
              <motion.button
                className="pd-action pd-add"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  addToCart(product, quantity);
                  toast.success(`${quantity} x ${productName} added to cart`);
                }}
              >
                <FiShoppingCart /> Add to Cart
              </motion.button>
              <motion.button
              className={`pd-action pd-fav ${liked ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const added = toggleWishlist(product);
                  toast(added ? 'Added to wishlist' : 'Removed from wishlist', {
                    icon: added ? '❤️' : '💔',
                  });
                }}
              >
                <FiHeart />
              </motion.button>
            </div>

            <motion.button
              className="pd-action pd-buy"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                addToCart(product, quantity);
                toast.success('Proceeding to checkout');
                navigate('/checkout');
              }}
            >
              Buy Now
            </motion.button>

            <div className="pd-info-grid">
              <div>
                <FiPackage />
                <span>Delivery in 30-45 mins</span>
              </div>
              <div>
                <FiCheckCircle />
                <span>Freshness guaranteed</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
