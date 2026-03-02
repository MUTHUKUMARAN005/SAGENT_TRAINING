import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/api';
import { formatCurrency, truncateText } from '../utils/formatters';
import { PRODUCT_CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    productName: '', category: '', price: '',
    description: '', imageUrl: '',
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ productName: '', category: '', price: '', description: '', imageUrl: '' });
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.productId, form);
        toast.success('Product updated successfully!');
      } else {
        await createProduct(form);
        toast.success('Product created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      productName: product.productName,
      category: product.category,
      price: product.price,
      description: product.description,
      imageUrl: product.imageUrl,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      toast.success('Product deleted!');
      fetchProducts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>🛍️ Products</h1>
        <p>Manage your product catalog ({products.length} items)</p>
      </div>

      <div className="actions-bar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products by name or category..."
        />
        <motion.button
          className="btn btn-primary"
          onClick={() => { resetForm(); setShowModal(true); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus size={18} /> Add Product
        </motion.button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="No products found"
          message={search ? 'Try a different search term' : 'Start by adding your first product'}
          action={
            !search && (
              <motion.button className="btn btn-primary" onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.05 }}>
                <FiPlus /> Add Product
              </motion.button>
            )
          }
        />
      ) : (
        <div className="cards-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => (
              <motion.div
                key={product.productId}
                className="product-card"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                whileHover={{ y: -8 }}
                layout
              >
                <div className="product-image">
                  {product.imageUrl ? (
                    <motion.img
                      src={product.imageUrl}
                      alt={product.productName}
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <FiShoppingBag size={40} />
                    </div>
                  )}
                  <div className="product-price-tag">
                    {formatCurrency(product.price)}
                  </div>
                </div>

                <div className="product-info">
                  <h3>{product.productName}</h3>
                  <span className="status-badge active">{product.category}</span>
                  <p className="product-description">
                    {truncateText(product.description, 80)}
                  </p>
                  {product.store && (
                    <p className="product-store">📍 {product.store.storeName}</p>
                  )}
                  <div className="card-actions">
                    <motion.button className="btn btn-primary btn-sm" onClick={() => handleEdit(product)}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <FiEdit2 size={14} /> Edit
                    </motion.button>
                    <motion.button className="btn btn-danger btn-sm"
                      onClick={() => setDeleteId(product.productId)}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <FiTrash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <h2>{editingProduct ? '✏️ Edit Product' : '➕ New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name *</label>
            <input value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="Enter product name" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input type="number" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00" required />
            </div>
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the product..." />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary"
              onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </button>
            <motion.button type="submit" className="btn btn-primary"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {editingProduct ? 'Update Product' : 'Create Product'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Delete Product"
        message="This will permanently remove the product from the catalog."
      />
    </PageWrapper>
  );
};

export default Products;