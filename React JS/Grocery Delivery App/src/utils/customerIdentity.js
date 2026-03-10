import { getCustomer, getCustomers } from '../api/api';

const toId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const getCacheKey = (email) => `freshmart_customer_id_${email || 'guest'}`;

export const getUserCustomerId = (user) => {
  return toId(user?.customerId ?? user?.id ?? user?.userId);
};

export const resolveCustomerRecord = async (user) => {
  if (!user) return null;

  const email = user?.email?.trim()?.toLowerCase();
  const directId = getUserCustomerId(user);
  const cacheKey = getCacheKey(email);
  const cachedId = toId(localStorage.getItem(cacheKey));

  const candidateIds = [directId, cachedId].filter(Boolean);

  for (const candidateId of candidateIds) {
    try {
      const response = await getCustomer(candidateId);
      const record = response?.data;
      if (record) {
        const resolvedId = toId(record?.customerId ?? record?.id ?? candidateId);
        if (resolvedId && email) localStorage.setItem(cacheKey, resolvedId);
        return record;
      }
    } catch {
      // Fall through to email lookup.
    }
  }

  if (!email) return null;

  try {
    const response = await getCustomers();
    const list = Array.isArray(response?.data) ? response.data : [];
    const match = list.find(
      (item) => item?.email?.trim()?.toLowerCase() === email
    );
    if (!match) return null;
    const resolvedId = toId(match?.customerId ?? match?.id);
    if (resolvedId) localStorage.setItem(cacheKey, resolvedId);
    return match;
  } catch {
    return null;
  }
};

export const resolveCustomerId = async (user) => {
  const record = await resolveCustomerRecord(user);
  return toId(record?.customerId ?? record?.id);
};
