import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const WishlistContext = createContext(null);

const getWishlistStorageKey = (email) => `freshmart_wishlist_${email || 'guest'}`;

const readStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getProductId = (item) => item?.productId ?? item?.id ?? null;

const normalizeWishlistItem = (product) => {
  const productId = getProductId(product);
  if (productId == null) return null;

  return {
    productId,
    productName: product?.productName || product?.name || 'Product',
    brand: product?.store?.storeName || 'FreshMart',
    price: Number(product?.price || 0),
    originalPrice: Math.round(Number(product?.price || 0) * 1.12),
    imageUrl:
      product?.imageUrl ||
      product?.imageUrls?.[0] ||
      product?.images?.[0]?.url ||
      product?.images?.[0] ||
      '',
    category: product?.category || 'General',
    rating: Number((3.8 + Math.random() * 1.1).toFixed(1)),
  };
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const storageKey = getWishlistStorageKey(user?.email);

  useEffect(() => {
    setItems(readStorage(storageKey));
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addToWishlist = (product) => {
    const normalized = normalizeWishlistItem(product);
    if (!normalized) return;

    setItems((prev) => {
      const exists = prev.some(
        (item) => String(item.productId) === String(normalized.productId)
      );
      if (exists) return prev;
      return [normalized, ...prev];
    });
  };

  const removeFromWishlist = (productId) => {
    setItems((prev) =>
      prev.filter((item) => String(item.productId) !== String(productId))
    );
  };

  const toggleWishlist = (product) => {
    const productId = getProductId(product);
    if (productId == null) return false;
    const exists = items.some((item) => String(item.productId) === String(productId));
    if (exists) {
      removeFromWishlist(productId);
      return false;
    }
    addToWishlist(product);
    return true;
  };

  const moveToCart = (productId, quantity = 1) => {
    const item = items.find((entry) => String(entry.productId) === String(productId));
    if (!item) return;
    addToCart(item, quantity);
    removeFromWishlist(productId);
  };

  const isInWishlist = (productId) =>
    items.some((item) => String(item.productId) === String(productId));

  const clearWishlist = () => setItems([]);

  const totalSaved = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Math.max(0, Number(item.originalPrice || 0) - Number(item.price || 0)),
        0
      ),
    [items]
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        totalSaved,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        moveToCart,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};

export default WishlistContext;
