// Follow same pattern, filtering data by store_id from user context
import React from 'react';
import PageWrapper from '../../components/common/PageWrapper';

const SellerProducts = () => (
  <PageWrapper>
    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>📦 My Products</h1>
    <p style={{ color: '#94a3b8' }}>Manage products for your store</p>
  </PageWrapper>
);
export default SellerProducts;