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
import PageWrapper from '../../components/common/PageWrapper';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getDashboardStats, getOrders, getPayments, getProducts, getUsers } from '../../api/api';
import { CHART_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ensureList = (value) => (Array.isArray(value) ? value : []);

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, ordersRes, productsRes, usersRes, paymentsRes] = await Promise.allSettled([
        getDashboardStats(),
        getOrders(),
        getProducts(),
        getUsers(),
        getPayments(),
      ]);

      const statsValue = statsRes.status === 'fulfilled' ? statsRes.value?.data : {};
      const ordersValue = ordersRes.status === 'fulfilled' ? ordersRes.value?.data : [];
      const productsValue = productsRes.status === 'fulfilled' ? productsRes.value?.data : [];
      const usersValue = usersRes.status === 'fulfilled' ? usersRes.value?.data : [];
      const paymentsValue = paymentsRes.status === 'fulfilled' ? paymentsRes.value?.data : [];

      setStats(statsValue || {});
      setOrders(ensureList(ordersValue));
      setProducts(ensureList(productsValue));
      setUsers(ensureList(usersValue));
      setPayments(ensureList(paymentsValue));

      if (
        statsRes.status === 'rejected' &&
        ordersRes.status === 'rejected' &&
        productsRes.status === 'rejected' &&
        usersRes.status === 'rejected' &&
        paymentsRes.status === 'rejected'
      ) {
        toast.error('Failed to load dashboard data');
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const totalRevenue =
    Number(stats.totalRevenue) ||
    payments
      .filter((payment) => payment?.paymentStatus === 'COMPLETED')
      .reduce((sum, payment) => sum + Number(payment?.amount || 0), 0) ||
    orders.reduce((sum, order) => sum + Number(order?.totalAmount || 0), 0);

  const totalUsers = Number(stats.totalUsers) || users.length || Number(stats.totalCustomers) || 0;
  const totalOrders = Number(stats.totalOrders) || orders.length;
  const totalProducts = Number(stats.totalProducts) || products.length;

  const lowStockItems = Number(stats.lowStockItems) || products.filter((product) => {
    const stock = Number(
      product?.stock ??
      product?.stockQty ??
      product?.stockQuantity ??
      product?.availableStock ??
      product?.inventory?.stock ??
      product?.inventory?.stockQuantity ??
      0
    );
    return stock > 0 && stock <= 5;
  }).length;

  const statCards = [
    { label: 'Total Users', value: totalUsers, icon: FiUsers, color: 'blue' },
    { label: 'Total Orders', value: totalOrders, icon: FiShoppingCart, color: 'purple' },
    { label: 'Total Products', value: totalProducts, icon: FiShoppingBag, color: 'pink' },
    { label: 'Total Revenue', value: totalRevenue, icon: FiDollarSign, color: 'green', prefix: '₹', decimals: 2 },
    { label: 'Stores', value: stats.totalStores || 0, icon: FiMapPin, color: 'orange' },
    { label: 'Deliveries', value: stats.totalDeliveries || 0, icon: FiTruck, color: 'blue' },
    { label: 'Low Stock', value: lowStockItems, icon: FiAlertTriangle, color: 'orange' },
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
