import React from 'react';
import { FiCheckCircle, FiClock, FiPackage, FiTruck } from 'react-icons/fi';

const STEPS = [
  { id: 'ORDERED', label: 'Ordered', icon: FiClock },
  { id: 'PACKED', label: 'Packed', icon: FiPackage },
  { id: 'SHIPPED', label: 'Shipped', icon: FiTruck },
  { id: 'DELIVERED', label: 'Delivered', icon: FiCheckCircle },
];

const statusAliases = {
  PENDING: 'ORDERED',
  CONFIRMED: 'ORDERED',
  PROCESSING: 'PACKED',
};

const normalizeStatus = (status) => statusAliases[status] || status;

const OrderTimeline = ({ status, history = [] }) => {
  const normalizedStatus = normalizeStatus(status);
  const activeIndex = STEPS.findIndex((step) => step.id === normalizedStatus);
  const historyByStatus = history.reduce((acc, item) => {
    acc[normalizeStatus(item.status)] = item.at;
    return acc;
  }, {});

  return (
    <div className="order-timeline">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const state =
          activeIndex > index ? 'done' : activeIndex === index ? 'current' : 'pending';
        return (
          <div key={step.id} className={`order-timeline-step ${state}`}>
            <div className="order-timeline-marker">
              <Icon size={15} />
            </div>
            <div className="order-timeline-meta">
              <p>{step.label}</p>
              {historyByStatus[step.id] && (
                <span>{new Date(historyByStatus[step.id]).toLocaleString()}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
