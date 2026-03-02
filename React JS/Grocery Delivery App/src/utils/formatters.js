export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const truncateText = (text, len = 50) => {
  if (!text) return '';
  return text.length > len ? text.substring(0, len) + '...' : text;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export const getStatusColor = (status) => {
  const map = {
    DELIVERED: 'success', COMPLETED: 'success', ACTIVE: 'success', READ: 'success',
    PENDING: 'warning', PROCESSING: 'info', CONFIRMED: 'info',
    IN_TRANSIT: 'info', PICKED_UP: 'info', PROCESSED: 'info', SENT: 'info',
    SHIPPED: 'purple', CANCELLED: 'danger', FAILED: 'danger', REFUNDED: 'danger',
  };
  return map[status] || 'default';
};

export const getOrderStepIndex = (status) => {
  const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  return steps.indexOf(status);
};

export const getDiscountedPrice = (price, discount) => {
  return Math.max(0, parseFloat(price) - parseFloat(discount || 0));
};