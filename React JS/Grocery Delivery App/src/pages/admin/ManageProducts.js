import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEdit2,
  FiImage,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTag,
  FiTrash2,
} from 'react-icons/fi';
import PageWrapper from '../../components/common/PageWrapper';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/api';
import { formatCurrency, truncateText } from '../../utils/formatters';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';
import './ManageProducts.css';

const CATEGORY_STORAGE_KEY = 'freshmart_admin_categories';
const DEFAULT_CATEGORIES = PRODUCT_CATEGORIES.map((category) => category.label);

const getProductId = (product) => product?.productId ?? product?.id;
const getProductName = (product) => product?.productName ?? product?.name ?? '';
const getProductCategory = (product) => product?.category ?? 'Uncategorized';
const getProductPrice = (product) => Number(product?.price || 0);
const getProductStock = (product) =>
  Number(
    product?.stockQuantity ??
      product?.stock ??
      product?.stockQty ??
      product?.availableStock ??
      product?.inventory?.stock ??
      product?.inventory?.stockQuantity ??
      0
  );

const toPayload = (source, overrides = {}) => ({
  productName: getProductName(source),
  category: getProductCategory(source),
  price: getProductPrice(source),
  description: source?.description || '',
  imageUrl: source?.imageUrl || source?.imageUrls?.[0] || '',
  stockQuantity: getProductStock(source),
  ...overrides,
});

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryForm, setCategoryForm] = useState({ label: '', editing: null });
  const [form, setForm] = useState({
    productName: '', category: '', price: '',
    description: '', imageUrl: '',
    stockQuantity: 0,
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) {
        setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...saved])));
      }
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      const list = Array.isArray(res?.data) ? res.data : [];
      setProducts(list);
      const discovered = list.map((product) => getProductCategory(product)).filter(Boolean);
      if (discovered.length) {
        setCategories((prev) => Array.from(new Set([...prev, ...discovered])));
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ productName: '', category: '', price: '', description: '', imageUrl: '', stockQuantity: 0 });
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price || 0),
      stockQuantity: Number(form.stockQuantity || 0),
    };
    try {
      if (editingProduct) {
        await updateProduct(getProductId(editingProduct), payload);
        toast.success('Product updated successfully!');
      } else {
        await createProduct(payload);
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
      productName: getProductName(product),
      category: getProductCategory(product),
      price: getProductPrice(product),
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      stockQuantity: getProductStock(product),
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
      getProductName(p).toLowerCase().includes(search.toLowerCase()) ||
      getProductCategory(p).toLowerCase().includes(search.toLowerCase())
  );

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, imageUrl: String(reader.result || '') }));
      toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleAdjustStock = async (product, delta) => {
    const nextStock = Math.max(0, getProductStock(product) + delta);
    const productId = getProductId(product);
    try {
      await updateProduct(productId, toPayload(product, { stockQuantity: nextStock }));
      setProducts((prev) =>
        prev.map((item) =>
          String(getProductId(item)) === String(productId)
            ? { ...item, stockQuantity: nextStock, stock: nextStock }
            : item
        )
      );
      toast.success(`Stock updated to ${nextStock}`);
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    const label = categoryForm.label.trim();
    if (!label) return;

    if (!categoryForm.editing) {
      if (categories.some((item) => item.toLowerCase() === label.toLowerCase())) {
        toast.error('Category already exists');
        return;
      }
      setCategories((prev) => [...prev, label]);
      setCategoryForm({ label: '', editing: null });
      toast.success('Category added');
      return;
    }

    const previousLabel = categoryForm.editing;
    setCategories((prev) =>
      prev.map((item) => (item === previousLabel ? label : item))
    );

    const affectedProducts = products.filter(
      (product) => getProductCategory(product).toLowerCase() === previousLabel.toLowerCase()
    );
    if (affectedProducts.length > 0) {
      const results = await Promise.allSettled(
        affectedProducts.map((product) =>
          updateProduct(getProductId(product), toPayload(product, { category: label }))
        )
      );
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        toast.error(`Renamed category, but ${failed} products failed to update`);
      }
      await fetchProducts();
    }

    setCategoryForm({ label: '', editing: null });
    toast.success('Category updated');
  };

  const handleDeleteCategory = async (label) => {
    const fallbackCategory = 'Uncategorized';
    const affectedProducts = products.filter(
      (product) => getProductCategory(product).toLowerCase() === label.toLowerCase()
    );

    if (affectedProducts.length > 0) {
      const confirmed = window.confirm(
        `Category "${label}" is used by ${affectedProducts.length} products. Move them to "${fallbackCategory}" and delete category?`
      );
      if (!confirmed) return;

      const results = await Promise.allSettled(
        affectedProducts.map((product) =>
          updateProduct(getProductId(product), toPayload(product, { category: fallbackCategory }))
        )
      );
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        toast.error(`Failed to reassign ${failed} products`);
        return;
      }
      setCategories((prev) =>
        prev.includes(fallbackCategory) ? prev : [...prev, fallbackCategory]
      );
      await fetchProducts();
    }

    setCategories((prev) => prev.filter((category) => category !== label));
    if (categoryForm.editing === label) setCategoryForm({ label: '', editing: null });
    toast.success('Category deleted');
  };

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>🛍️ Products</h1>
        <p>Manage your product catalog ({products.length} items)</p>
      </div>

      <div className="category-manager-card">
        <div className="category-manager-head">
          <h2><FiTag /> Category Management</h2>
          <span>{categories.length} categories</span>
        </div>
        <form className="category-manager-form" onSubmit={handleCategorySubmit}>
          <input
            value={categoryForm.label}
            onChange={(event) =>
              setCategoryForm((prev) => ({ ...prev, label: event.target.value }))
            }
            placeholder="Add or rename category"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            {categoryForm.editing ? 'Update Category' : 'Add Category'}
          </button>
          {categoryForm.editing && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCategoryForm({ label: '', editing: null })}
            >
              Cancel
            </button>
          )}
        </form>
        <div className="category-manager-list">
          {categories.map((category) => (
            <div key={category} className="category-chip-admin">
              <span>{category}</span>
              <button
                type="button"
                onClick={() => setCategoryForm({ label: category, editing: category })}
                aria-label={`Edit ${category}`}
              >
                <FiEdit2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(category)}
                aria-label={`Delete ${category}`}
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          ))}
        </div>
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
                    {formatCurrency(getProductPrice(product))}
                  </div>
                </div>

                <div className="product-info">
                  <h3>{getProductName(product)}</h3>
                  <span className="status-badge active">{getProductCategory(product)}</span>
                  <div className="product-stock-row">
                    <span className={`status-badge ${getProductStock(product) > 5 ? 'active' : 'pending'}`}>
                      Stock: {getProductStock(product)}
                    </span>
                    <div className="stock-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAdjustStock(product, -1)}
                      >
                        <FiMinus size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAdjustStock(product, 1)}
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                  </div>
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
                      onClick={() => setDeleteId(getProductId(product))}
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
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
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
            <label>Stock Quantity *</label>
            <input
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              placeholder="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Upload Product Image</label>
            <label className="upload-image-control">
              <FiImage size={16} />
              <span>{form.imageUrl ? 'Change image' : 'Choose image file'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>
            {form.imageUrl && (
              <img className="upload-image-preview" src={form.imageUrl} alt="Product preview" />
            )}
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
