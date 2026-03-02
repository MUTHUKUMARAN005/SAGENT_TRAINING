import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import CartDrawer from '../components/customer/CartDrawer';
import './CustomerLayout.css';

const CustomerLayout = () => {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="customer-layout">
      <CustomerNavbar onCartClick={() => setCartOpen(true)} />
      <main className="customer-main">
        <Outlet />
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Footer */}
      <footer className="customer-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>FreshMart</h4>
              <p>Your one-stop shop for fresh groceries delivered to your door.</p>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="/products">All Products</a></li>
                <li><a href="/my-orders">My Orders</a></li>
                <li><a href="/profile">My Account</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Customer Service</h4>
              <ul>
                <li>Help Center</li>
                <li>Returns & Refunds</li>
                <li>Shipping Info</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <ul>
                <li>📧 support@freshmart.com</li>
                <li>📞 1800-123-4567</li>
                <li>📍 Bengaluru, India</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 FreshMart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;