import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiPlus, FiSave, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { updateCustomer } from '../../api/api';
import AddressCard from '../../components/customer/AddressCard';
import { useAuth } from '../../context/AuthContext';
import { resolveCustomerRecord } from '../../utils/customerIdentity';
import './Profile.css';

const getAddressKey = (email) => `freshmart_customer_addresses_${email || 'guest'}`;

const blankAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const addressKey = useMemo(() => getAddressKey(user?.email), [user?.email]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(blankAddress);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fromLocal = () => {
      try {
        const saved = localStorage.getItem(addressKey);
        setAddresses(saved ? JSON.parse(saved) : []);
      } catch {
        setAddresses([]);
      }
    };

    const hydrate = async () => {
      fromLocal();
      if (!user) return;
      const record = await resolveCustomerRecord(user);
      if (!record || !mounted) return;
      const resolvedId = record?.customerId ?? record?.id ?? null;
      if (resolvedId) setCustomerId(resolvedId);
      setProfileForm((prev) => ({
        ...prev,
        name: record?.name || prev.name,
        email: record?.email || prev.email,
        phone: record?.phone || prev.phone,
      }));
      if (Array.isArray(record?.addresses)) {
        setAddresses(record.addresses);
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [addressKey]);

  useEffect(() => {
    localStorage.setItem(addressKey, JSON.stringify(addresses));
  }, [addresses, addressKey]);

  const syncCustomerToBackend = async (nextProfile = profileForm, nextAddresses = addresses) => {
    if (!customerId) return;
    try {
      await updateCustomer(customerId, {
        name: nextProfile.name?.trim(),
        email: nextProfile.email?.trim(),
        phone: nextProfile.phone?.trim(),
        addresses: nextAddresses,
      });
    } catch {
      // Keep local changes even when backend sync fails.
    }
  };

  const onProfileSubmit = async (event) => {
    event.preventDefault();
    const nextProfile = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
    };
    updateProfile(nextProfile);
    await syncCustomerToBackend(nextProfile, addresses);
    toast.success('Profile updated');
  };

  const onAddressSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...addressForm,
      id: editingAddressId || Date.now(),
      isDefault: editingAddressId
        ? addresses.find((item) => item.id === editingAddressId)?.isDefault || false
        : addresses.length === 0,
    };

    let nextAddresses = [];
    if (editingAddressId) {
      nextAddresses = addresses.map((item) => (item.id === editingAddressId ? payload : item));
      setAddresses(nextAddresses);
      toast.success('Address updated');
    } else {
      nextAddresses = [...addresses, payload];
      setAddresses(nextAddresses);
      toast.success('Address added');
    }

    await syncCustomerToBackend(profileForm, nextAddresses);

    setAddressForm(blankAddress);
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const onEditAddress = (address) => {
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    });
    setEditingAddressId(address.id);
    setShowAddressForm(true);
  };

  const onDeleteAddress = async (addressId) => {
    const next = addresses.filter((item) => item.id !== addressId);
    if (next.length > 0 && !next.some((item) => item.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    setAddresses(next);
    await syncCustomerToBackend(profileForm, next);
    toast.success('Address removed');
  };

  const onSetDefaultAddress = async (addressId) => {
    const next = addresses.map((item) => ({
      ...item,
      isDefault: item.id === addressId,
    }));
    setAddresses(next);
    await syncCustomerToBackend(profileForm, next);
    toast.success('Default address changed');
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <motion.section
          className="profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-title-row">
            <h2>
              <FiUser /> Profile Management
            </h2>
          </div>

          <form className="profile-form" onSubmit={onProfileSubmit}>
            <label>
              Full Name
              <input
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Phone
              <input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="+91 98765 43210"
              />
            </label>
            <motion.button className="profile-primary-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <FiSave /> Save Changes
            </motion.button>
          </form>
        </motion.section>

        <motion.section
          className="profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="profile-title-row">
            <h2>
              <FiMapPin /> Address Management
            </h2>
            <button
              className="profile-primary-btn small"
              onClick={() => {
                setAddressForm(blankAddress);
                setEditingAddressId(null);
                setShowAddressForm((prev) => !prev);
              }}
            >
              <FiPlus /> {showAddressForm ? 'Cancel' : 'Add Address'}
            </button>
          </div>

          {showAddressForm && (
            <form className="profile-form address-form" onSubmit={onAddressSubmit}>
              <label>
                Full Name
                <input
                  value={addressForm.fullName}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Phone
                <input
                  value={addressForm.phone}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Address Line 1
                <input
                  value={addressForm.line1}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, line1: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Address Line 2
                <input
                  value={addressForm.line2}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, line2: event.target.value }))
                  }
                />
              </label>
              <label>
                City
                <input
                  value={addressForm.city}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, city: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                State
                <input
                  value={addressForm.state}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, state: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Postal Code
                <input
                  value={addressForm.postalCode}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, postalCode: event.target.value }))
                  }
                  required
                />
              </label>
              <motion.button className="profile-primary-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <FiSave /> {editingAddressId ? 'Update Address' : 'Save Address'}
              </motion.button>
            </form>
          )}

          <div className="profile-address-grid">
            {addresses.length === 0 ? (
              <div className="profile-empty">
                <p>No saved addresses yet.</p>
              </div>
            ) : (
              addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={onEditAddress}
                  onDelete={onDeleteAddress}
                  onSetDefault={onSetDefaultAddress}
                />
              ))
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Profile;
