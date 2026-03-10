import React from 'react';
import { FiCheckCircle, FiEdit2, FiMapPin, FiPhone, FiTrash2, FiUser } from 'react-icons/fi';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
  return (
    <article className={`profile-address-card ${address.isDefault ? 'is-default' : ''}`}>
      <div className="profile-address-head">
        <div>
          <h4>
            <FiUser /> {address.fullName}
          </h4>
          <p>
            <FiPhone /> {address.phone}
          </p>
        </div>
        {address.isDefault ? (
          <span className="profile-default-pill">
            <FiCheckCircle /> Default
          </span>
        ) : (
          <button className="profile-link-btn" onClick={() => onSetDefault(address.id)}>
            Set default
          </button>
        )}
      </div>

      <p className="profile-address-line">
        <FiMapPin />
        <span>
          {address.line1}, {address.line2 ? `${address.line2}, ` : ''}
          {address.city}, {address.state} - {address.postalCode}
        </span>
      </p>

      <div className="profile-address-actions">
        <button onClick={() => onEdit(address)}>
          <FiEdit2 /> Edit
        </button>
        <button className="danger" onClick={() => onDelete(address.id)}>
          <FiTrash2 /> Delete
        </button>
      </div>
    </article>
  );
};

export default AddressCard;
