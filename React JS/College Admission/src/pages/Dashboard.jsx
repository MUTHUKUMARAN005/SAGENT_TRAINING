import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers, FiFileText, FiBook, FiCreditCard,
  FiCheckCircle, FiClock, FiXCircle, FiTrendingUp
} from 'react-icons/fi';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import ParticleBackground from '../components/ParticleBackground';
import StatsCard from '../components/StatsCard';
import AnimatedTable from '../components/AnimatedTable';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    applications: 0,
    courses: 0,
    payments: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [students, applications, courses, payments] = await Promise.all([
        API.get('/students'),
        API.get('/applications'),
        API.get('/courses'),
        API.get('/payments'),
      ]);

      setStats({
        students: students.data.length,
        applications: applications.data.length,
        courses: courses.data.length,
        payments: payments.data.length,
      });

      setRecentApplications(applications.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase().replace(' ', '-');
    return (
      <span className={`status-badge ${statusClass}`}>
        <span className="status-dot" />
        {status}
      </span>
    );
  };

  const applicationColumns = [
    { key: 'applicationID', label: 'ID' },
    {
      key: 'student',
      label: 'Student',
      render: (row) => row.student?.name || 'N/A',
    },
    {
      key: 'course',
      label: 'Course',
      render: (row) => row.course?.courseName || 'N/A',
    },
    { key: 'submissionDate', label: 'Submitted' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition>
      <ParticleBackground />
      
      <div className="page-header">
        <motion.div
          className="page-header-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your admission overview.</p>
        </motion.div>
      </div>

      <div className="stats-grid">
        <StatsCard
          icon={<FiUsers size={22} />}
          label="Total Students"
          value={stats.students}
          gradient="gradient-1"
          change={12}
          delay={0.1}
        />
        <StatsCard
          icon={<FiFileText size={22} />}
          label="Applications"
          value={stats.applications}
          gradient="gradient-2"
          change={8}
          delay={0.2}
        />
        <StatsCard
          icon={<FiBook size={22} />}
          label="Courses"
          value={stats.courses}
          gradient="gradient-3"
          change={5}
          delay={0.3}
        />
        <StatsCard
          icon={<FiCreditCard size={22} />}
          label="Payments"
          value={stats.payments}
          gradient="gradient-4"
          change={-3}
          delay={0.4}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="stats-grid" style={{ marginBottom: 30 }}>
        <motion.div
          className="stat-card gradient-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiCheckCircle color="#10b981" size={24} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Approved</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {recentApplications.filter(a => a.status === 'Approved').length}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card gradient-1"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ y: -5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiClock color="#f59e0b" size={24} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {recentApplications.filter(a => a.status === 'Pending').length}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card gradient-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ y: -5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiXCircle color="#ef4444" size={24} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rejected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {recentApplications.filter(a => a.status === 'Rejected').length}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card gradient-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ y: -5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiTrendingUp color="#06b6d4" size={24} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Success Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {recentApplications.length > 0
                  ? Math.round(
                      (recentApplications.filter(a => a.status === 'Approved').length /
                        recentApplications.length) *
                        100
                    )
                  : 0}%
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatedTable
        title="Recent Applications"
        columns={applicationColumns}
        data={recentApplications}
      />
    </PageTransition>
  );
};

export default Dashboard;