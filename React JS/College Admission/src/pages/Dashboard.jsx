import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiBook,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiUsers,
} from 'react-icons/fi';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import ParticleBackground from '../components/ParticleBackground';
import StatsCard from '../components/StatsCard';
import AnimatedTable from '../components/AnimatedTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { filterRecordsForUser, filterStudentsForUser, isStudentRoleUser } from '../utils/ownership';

const normalizeStatus = (value) => {
  const status = String(value ?? '').trim().toLowerCase();
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    applicationsCount: 0,
    approvedStudents: 0,
    pendingApplications: 0,
    coursesAvailable: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isStudentUser = isStudentRoleUser(user);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [studentsRes, applicationsRes, coursesRes] = await Promise.all([
        API.get('/students'),
        API.get('/applications'),
        API.get('/courses'),
      ]);

      const allStudents = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const allApplications = Array.isArray(applicationsRes.data) ? applicationsRes.data : [];
      const allCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];

      const visibleStudents = filterStudentsForUser(allStudents, user);
      const visibleApplications = filterRecordsForUser(allApplications, user, (app) => app?.student);

      const approvedStudentIds = new Set(
        visibleApplications
          .filter((app) => normalizeStatus(app.status) === 'Approved')
          .map((app) => app?.student?.studentID || app?.student?.studentId || app?.student?.email)
          .filter(Boolean)
      );

      setStats({
        totalStudents: visibleStudents.length,
        applicationsCount: visibleApplications.length,
        approvedStudents: approvedStudentIds.size,
        pendingApplications: visibleApplications.filter((app) => normalizeStatus(app.status) === 'Pending').length,
        coursesAvailable: allCourses.length,
      });

      const sortedRecent = [...visibleApplications].sort((a, b) => {
        const dateA = new Date(a?.submissionDate || 0).getTime();
        const dateB = new Date(b?.submissionDate || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        const idA = parseInt(a?.applicationID || 0, 10) || 0;
        const idB = parseInt(b?.applicationID || 0, 10) || 0;
        return idB - idA;
      });
      setRecentApplications(sortedRecent.slice(0, 8));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const dashboardCards = useMemo(() => ([
    {
      icon: <FiUsers size={22} />,
      label: 'Total Students',
      value: stats.totalStudents,
      gradient: 'gradient-1',
      delay: 0.1,
    },
    {
      icon: <FiFileText size={22} />,
      label: 'Applications Count',
      value: stats.applicationsCount,
      gradient: 'gradient-2',
      delay: 0.2,
    },
    {
      icon: <FiCheckCircle size={22} />,
      label: 'Approved Students',
      value: stats.approvedStudents,
      gradient: 'gradient-5',
      delay: 0.3,
    },
    {
      icon: <FiClock size={22} />,
      label: 'Pending Applications',
      value: stats.pendingApplications,
      gradient: 'gradient-4',
      delay: 0.4,
    },
    {
      icon: <FiBook size={22} />,
      label: 'Courses Available',
      value: stats.coursesAvailable,
      gradient: 'gradient-3',
      delay: 0.5,
    },
  ]), [stats]);

  const getStatusBadge = (status) => {
    const normalizedStatus = normalizeStatus(status);
    return (
      <span className={`status-badge ${normalizedStatus.toLowerCase()}`}>
        <span className="status-dot" />
        {normalizedStatus}
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
          <p>
            {isStudentUser
              ? "Welcome back! Here's your admission overview."
              : "Welcome back! Here's your admin overview."}
          </p>
        </motion.div>
      </div>

      <div className="stats-grid">
        {dashboardCards.map((card) => (
          <StatsCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            gradient={card.gradient}
            change={0}
            delay={card.delay}
          />
        ))}
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

