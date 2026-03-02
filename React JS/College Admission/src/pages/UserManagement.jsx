import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiTrash2, FiToggleLeft, FiToggleRight, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import PermissionGate from '../components/PermissionGate';
import { PERMISSIONS } from '../config/permissions';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        API.get('/users'),
        API.get('/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (userId) => {
    try {
      await API.put(`/users/${userId}/toggle-active`);
      toast.success('User status updated!');
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  const handleChangeRole = async () => {
    try {
      await API.put(`/users/${selectedUser.userID}/role/${selectedRoleId}`);
      toast.success('Role updated! 🔐');
      fetchData();
      setRoleModalOpen(false);
    } catch { toast.error('Failed to update role'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user permanently?')) {
      try {
        await API.delete(`/users/${id}`);
        toast.success('User deleted!');
        fetchData();
      } catch { toast.error('Failed to delete'); }
    }
  };

  const getRoleBadge = (roleName) => {
    const colors = {
      SUPER_ADMIN: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
      ADMIN: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
      OFFICER: { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },
      STUDENT: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
      VIEWER: { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
    };
    const c = colors[roleName] || colors.VIEWER;
    return (
      <motion.span
        whileHover={{ scale: 1.05 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20,
          background: c.bg, color: c.color, border: `1px solid ${c.border}`,
          fontSize: '0.78rem', fontWeight: 700,
        }}
      >
        <FiShield size={12} /> {roleName}
      </motion.span>
    );
  };

  const columns = [
    { key: 'userID', label: 'ID' },
    {
      key: 'fullName',
      label: 'User',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--gradient-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem', color: 'white',
            }}
            whileHover={{ scale: 1.1 }}
          >
            {row.fullName?.charAt(0)}
          </motion.div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.fullName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{row.username}</div>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'roleName',
      label: 'Role',
      render: (row) => getRoleBadge(row.roleName),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.isActive ? 'approved' : 'rejected'}`}>
          <span className="status-dot" />
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {row.permissions?.size || row.permissions?.length || 0} granted
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition>
      <div className="page-header">
        <motion.div className="page-header-left"
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1>🔐 User Management</h1>
          <p>Manage users, roles, and permissions</p>
        </motion.div>
      </div>

      {/* Role Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {['SUPER_ADMIN', 'ADMIN', 'OFFICER', 'STUDENT', 'VIEWER'].map((role, idx) => (
          <motion.div
            key={role}
            className={`stat-card gradient-${(idx % 5) + 1}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiShield size={22} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{role}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {users.filter((u) => u.roleName === role).length}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatedTable
        title={`Users (${users.length})`}
        columns={columns}
        data={users}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <PermissionGate permission={PERMISSIONS.USER_MANAGE}>
              <motion.button
                className="btn btn-secondary btn-icon btn-sm"
                onClick={() => {
                  setSelectedUser(row);
                  setSelectedRoleId('');
                  setRoleModalOpen(true);
                }}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                title="Change Role"
              >
                <FiEdit2 size={14} />
              </motion.button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.USER_MANAGE}>
              <motion.button
                className={`btn btn-icon btn-sm ${row.isActive ? 'btn-success' : 'btn-warning'}`}
                onClick={() => handleToggleActive(row.userID)}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                title={row.isActive ? 'Deactivate' : 'Activate'}
              >
                {row.isActive ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
              </motion.button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.ROLE_MANAGE}>
              <motion.button
                className="btn btn-danger btn-icon btn-sm"
                onClick={() => handleDelete(row.userID)}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                title="Delete User"
              >
                <FiTrash2 size={14} />
              </motion.button>
            </PermissionGate>
          </div>
        )}
      />

      {/* Change Role Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Change Role - ${selectedUser?.fullName}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRoleModalOpen(false)}>Cancel</button>
            <motion.button className="btn btn-primary" onClick={handleChangeRole}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Update Role
            </motion.button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Current Role</label>
          <div style={{ marginBottom: 12 }}>
            {selectedUser && getRoleBadge(selectedUser.roleName)}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">New Role</label>
          <select
            className="form-select"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
          >
            <option value="">Select New Role</option>
            {roles.map((r) => (
              <option key={r.roleID} value={r.roleID}>
                {r.roleName} - {r.description}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default UserManagement;