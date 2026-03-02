import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiGrid, FiList, FiX } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { getProducts } from '../../api/api';
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from '../../utils/constants';
import toast from 'react-hot-toast';
import './ProductListing.css';

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category') || '';
    const searchQuery = searchParams.get('search') || '';
    setSelectedCategory(category);
    setSearch(searchQuery);
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  let filtered = products.filter(p => {
    const matchSearch = !search || p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchSearch && matchCategory;
  });

  // Sort
  if (sortBy === 'price_low') filtered.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price_high') filtered.sort((a, b) => b.price - a.price);
  else if (sortBy === 'name_asc') filtered.sort((a, b) => a.productName?.localeCompare(b.productName));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="product-listing-page">
      <div className="plp-container">
        {/* Sidebar Filters */}
        <motion.aside
          className={`plp-sidebar ${showFilters ? 'show' : ''}`}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="plp-sidebar-header">
            <h3>Filters</h3>
            <button className="plp-filter-close" onClick={() => setShowFilters(false)}>
              <FiX size={20} />
            </button>
          </div>

          {/* Categories */}
          <div className="filter-section">
            <h4>Category</h4>
            <div className="filter-options">
              <motion.button
                className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                All
              </motion.button>
              {PRODUCT_CATEGORIES.map(cat => (
                <motion.button
                  key={cat.id}
                  className={`filter-chip ${selectedCategory.toLowerCase() === cat.label.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.label)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat.icon} {cat.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="plp-main">
          {/* Toolbar */}
          <motion.div
            className="plp-toolbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="plp-toolbar-left">
              <button className="plp-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                <FiFilter size={18} /> Filters
              </button>
              <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
            </div>

            <div className="plp-toolbar-right">
              <span className="plp-result-count">{filtered.length} products</span>
              <select className="plp-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="plp-view-toggle">
                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                  <FiGrid size={18} />
                </button>
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
                  <FiList size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Active Filters */}
          {(search || selectedCategory) && (
            <motion.div className="active-filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {selectedCategory && (
                <span className="active-filter-tag">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('')}><FiX size={14} /></button>
                </span>
              )}
              {search && (
                <span className="active-filter-tag">
                  Search: "{search}"
                  <button onClick={() => setSearch('')}><FiX size={14} /></button>
                </span>
              )}
            </motion.div>
          )}

          {/* Products Grid */}
          {filtered.length === 0 ? (
            <EmptyState icon="🔍" title="No products found"
              message="Try adjusting your filters or search query" />
          ) : (
            <div className={`plp-products ${viewMode}`}>
              <AnimatePresence mode="popLayout">
                {filtered.map((product, i) => (
                  <ProductCard key={product.productId} product={product} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListing;