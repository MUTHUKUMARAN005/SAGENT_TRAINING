import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiShoppingCart, FiUsers, FiShoppingBag, FiMapPin,
  FiDollarSign, FiTruck, FiAlertTriangle, FiPackage
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import PageWrapper from '../components/PageWrapper';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats, getOrders, getProducts } from '../api/api';
import { CHART_COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes, productsRes] = await Promise.all([
          getDashboardStats(),
          getOrders(),
          getProducts(),
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders || 0, icon: FiShoppingCart, color: 'purple' },
    { label: 'Customers', value: stats.totalCustomers || 0, icon: FiUsers, color: 'blue' },
    { label: 'Products', value: stats.totalProducts || 0, icon: FiShoppingBag, color: 'pink' },
    { label: 'Revenue', value: stats.totalRevenue || 0, icon: FiDollarSign, color: 'green', prefix: '₹', decimals: 2 },
    { label: 'Stores', value: stats.totalStores || 0, icon: FiMapPin, color: 'orange' },
    { label: 'Deliveries', value: stats.totalDeliveries || 0, icon: FiTruck, color: 'blue' },
    { label: 'Low Stock', value: stats.lowStockItems || 0, icon: FiAlertTriangle, color: 'orange' },
    { label: 'Pending', value: stats.pendingDeliveries || 0, icon: FiPackage, color: 'purple' },
  ];

  const orderStatusData = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    .map((status) => ({
      name: status,
      count: orders.filter((o) => o.status === status).length,
    }));

  const categoryData = products.reduce((acc, p) => {
    const cat = p.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  const revenueData = orders.map((o, i) => ({
    order: `#${o.orderId || i + 1}`,
    amount: parseFloat(o.totalAmount) || 0,
    discount: parseFloat(o.discountApplied) || 0,
  }));

  const tooltipStyle = {
    contentStyle: {
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 12,
      color: '#fff',
      fontSize: '0.82rem',
    },
  };

  return (
    <PageWrapper>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>📊 Dashboard</h1>
        <p>Welcome back! Here's what's happening with your stores.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="cards-grid cards-grid-4">
        {statCards.map((card, i) => (
          <StatsCard
            key={i}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            prefix={card.prefix || ''}
            decimals={card.decimals || 0}
            delay={i * 0.06}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h2>💰 Revenue by Order</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="order" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip {...tooltipStyle} formatter={(value) => formatCurrency(value)} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                fill="url(#colorRevenue)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2>📦 Product Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={45}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: '#64748b' }}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Order Status Chart */}
      <motion.div
        className="chart-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <h2>📋 Order Status Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderStatusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {orderStatusData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </PageWrapper>
  );
};

export default Dashboard;