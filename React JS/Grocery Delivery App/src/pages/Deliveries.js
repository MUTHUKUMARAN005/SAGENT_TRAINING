import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTruck, FiUser, FiMapPin, FiClock } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { AnimatedRow, AnimatedTableContainer } from '../components/AnimatedTable';
import { getDeliveries, getDeliveryPersons, updateDeliveryStatus } from '../api/api';
import toast from 'react-hot-toast';

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [delRes, personRes] = await Promise.all([getDeliveries(), getDeliveryPersons()]);
      setDeliveries(delRes.data);
      setPersons(personRes.data);
    } catch (err) { toast.error('Failed to load deliveries'); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDeliveryStatus(id, status);
      toast.success('Delivery status updated!');
      fetchData();
    } catch (err) { toast.error('Update failed'); }
  };

  if (loading) return <LoadingSpinner />;

  const statusOptions = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>🚚 Deliveries</h1>
        <p>Track deliveries and delivery personnel</p>
      </div>

      {/* Delivery Persons */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>👤 Delivery Team</h2>
      <div className="cards-grid" style={{ marginBottom: 30 }}>
        {persons.map((person, i) => (
          <motion.div key={person.deliveryPersonId}
            className="stat-card blue"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <motion.div
                style={{ width: 48, height: 48, borderRadius: '50%',
                  background: person.availabilityStatus ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #ef4444, #f87171)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                animate={person.availabilityStatus ? { boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 20px rgba(16,185,129,0.4)', '0 0 0px rgba(16,185,129,0)'] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <FiUser size={20} color="white" />
              </motion.div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{person.name}</h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{person.phone}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="status-badge active">🏍️ {person.vehicleType}</span>
              <span className={`status-badge ${person.availabilityStatus ? 'delivered' : 'cancelled'}`}>
                {person.availabilityStatus ? '🟢 Available' : '🔴 Busy'}
              </span>
            </div>
            {person.currentLocation && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiMapPin size={12} /> {person.currentLocation}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Deliveries Table */}
      <AnimatedTableContainer title={`Active Deliveries (${deliveries.length})`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Order</th><th>Driver</th><th>Address</th>
              <th>Status</th><th>ETA</th><th>Delivered</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {deliveries.map((del, i) => (
                <AnimatedRow key={del.deliveryId} index={i}>
                  <td><strong>#{del.deliveryId}</strong></td>
                  <td>Order #{del.order?.orderId}</td>
                  <td>{del.deliveryPerson?.name || 'Unassigned'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {del.deliveryAddress}
                  </td>
                  <td>
                    <select
                      value={del.status}
                      onChange={e => handleStatusUpdate(del.deliveryId, e.target.value)}
                      className={`status-badge ${del.status?.toLowerCase()}`}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    <FiClock size={12} /> {del.estimatedTime?.substring(11, 16) || 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: del.actualDeliveryTime ? '#10b981' : '#64748b' }}>
                    {del.actualDeliveryTime?.substring(11, 16) || '—'}
                  </td>
                </AnimatedRow>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </AnimatedTableContainer>
    </PageWrapper>
  );
};

export default Deliveries;