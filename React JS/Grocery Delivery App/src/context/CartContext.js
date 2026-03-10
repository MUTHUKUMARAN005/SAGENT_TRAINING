import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addItemToCart,
  clearCart as clearBackendCart,
  createCartForCustomer,
  getCartByCustomer,
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from '../api/api';
import { resolveCustomerId } from '../utils/customerIdentity';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const getCartStorageKey = (email) => `freshmart_cart_${email || 'guest'}`;

const readStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getProductId = (item) => item?.productId ?? item?.id ?? null;

const getProductStock = (item) => {
  const stock = Number(
    item?.stock ??
      item?.stockQty ??
      item?.stockQuantity ??
      item?.availableStock ??
      item?.inventory?.stock ??
      item?.inventory?.stockQuantity ??
      NaN
  );
  return Number.isFinite(stock) ? stock : null;
};

const normalizeCartItem = (product, quantity = 1) => {
  const productId = getProductId(product);
  if (productId == null) return null;

  return {
    productId,
    productName: product?.productName || product?.name || 'Product',
    price: Number(product?.price || 0),
    category: product?.category || 'General',
    imageUrl:
      product?.imageUrl ||
      product?.imageUrls?.[0] ||
      product?.images?.[0]?.url ||
      product?.images?.[0] ||
      '',
    stock: getProductStock(product),
    quantity: Math.max(1, Number(quantity) || 1),
  };
};

const clampByStock = (quantity, stock) => {
  if (stock == null || stock <= 0) return quantity;
  return Math.min(quantity, stock);
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const storageKey = getCartStorageKey(user?.email);
  const backendRef = useRef({ enabled: false, cartId: null, customerId: null });

  useEffect(() => {
    let mounted = true;

    const setLocal = () => {
      if (!mounted) return;
      setItems(readStorage(storageKey));
      backendRef.current = { enabled: false, cartId: null, customerId: null };
    };

    const hydrateFromBackend = async () => {
      setLocal();
      if (!user) return;

      const customerId = await resolveCustomerId(user);
      if (!customerId || !mounted) return;

      try {
        let cartResponse;
        try {
          cartResponse = await getCartByCustomer(customerId);
        } catch {
          cartResponse = await createCartForCustomer(customerId);
        }

        let cartId = cartResponse?.data?.cartId ?? cartResponse?.data?.id;
        if (!cartId) {
          const createdCart = await createCartForCustomer(customerId);
          cartId = createdCart?.data?.cartId ?? createdCart?.data?.id;
        }
        if (!cartId || !mounted) return;

        backendRef.current = { enabled: true, cartId, customerId };

        const localItems = readStorage(storageKey);
        if (localItems.length) {
          await Promise.allSettled(
            localItems.map((item) =>
              addItemToCart(cartId, item.productId, Math.max(1, Number(item.quantity || 1)))
            )
          );
        }
        await syncFromBackend(cartId, mounted);
      } catch {
        // Keep local mode when backend is unavailable.
      }
    };

    const syncFromBackend = async (cartId, canSetState = true) => {
      try {
        const itemsResponse = await getCartItems(cartId);
        const list = Array.isArray(itemsResponse?.data) ? itemsResponse.data : [];
        const normalized = list
          .map((entry) => {
            const product = entry?.product || entry;
            const item = normalizeCartItem(
              {
                ...product,
                price: entry?.unitPrice ?? entry?.price ?? product?.price,
              },
              entry?.quantity ?? entry?.qty ?? 1
            );
            if (!item) return null;
            return {
              ...item,
              cartItemId: entry?.cartItemId ?? entry?.itemId ?? entry?.id ?? null,
            };
          })
          .filter(Boolean);
        if (canSetState && mounted) setItems(normalized);
      } catch {
        // Ignore backend sync failures and keep current state.
      }
    };

    hydrateFromBackend();

    return () => {
      mounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addToCartLocal = (product, quantity = 1) => {
    const normalized = normalizeCartItem(product, quantity);
    if (!normalized) return;

    setItems((prev) => {
      const idx = prev.findIndex(
        (item) => String(item.productId) === String(normalized.productId)
      );

      if (idx === -1) {
        return [
          ...prev,
          {
            ...normalized,
            quantity: clampByStock(normalized.quantity, normalized.stock),
          },
        ];
      }

      const existing = prev[idx];
      const mergedQty = clampByStock(
        existing.quantity + normalized.quantity,
        existing.stock ?? normalized.stock
      );
      const next = [...prev];
      next[idx] = {
        ...existing,
        ...normalized,
        quantity: mergedQty,
      };
      return next;
    });
  };

  const removeFromCartLocal = (productId) => {
    setItems((prev) =>
      prev.filter((item) => String(item.productId) !== String(productId))
    );
  };

  const updateQuantityLocal = (productId, quantity) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (String(item.productId) !== String(productId)) return item;
          const nextQty = clampByStock(Math.max(0, Number(quantity) || 0), item.stock);
          return {
            ...item,
            quantity: nextQty,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCartLocal = () => setItems([]);

  const syncFromBackend = async (cartId) => {
    try {
      const itemsResponse = await getCartItems(cartId);
      const list = Array.isArray(itemsResponse?.data) ? itemsResponse.data : [];
      const normalized = list
        .map((entry) => {
          const product = entry?.product || entry;
          const item = normalizeCartItem(
            {
              ...product,
              price: entry?.unitPrice ?? entry?.price ?? product?.price,
            },
            entry?.quantity ?? entry?.qty ?? 1
          );
          if (!item) return null;
          return {
            ...item,
            cartItemId: entry?.cartItemId ?? entry?.itemId ?? entry?.id ?? null,
          };
        })
        .filter(Boolean);
      setItems(normalized);
      return normalized;
    } catch {
      return null;
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const normalized = normalizeCartItem(product, quantity);
    if (!normalized) return;

    const backendState = backendRef.current;
    if (backendState.enabled && backendState.cartId) {
      try {
        const existing = items.find(
          (item) => String(item.productId) === String(normalized.productId)
        );
        if (existing?.cartItemId) {
          const nextQty = clampByStock(
            Number(existing.quantity || 0) + Number(normalized.quantity || 1),
            existing.stock ?? normalized.stock
          );
          await updateCartItemQuantity(existing.cartItemId, nextQty);
        } else {
          await addItemToCart(backendState.cartId, normalized.productId, normalized.quantity);
        }
        await syncFromBackend(backendState.cartId);
        return;
      } catch {
        // Fall back to local if backend update fails.
      }
    }

    addToCartLocal(product, quantity);
  };

  const removeFromCart = async (productId) => {
    const backendState = backendRef.current;
    if (backendState.enabled && backendState.cartId) {
      const target = items.find((item) => String(item.productId) === String(productId));
      if (target?.cartItemId) {
        try {
          await removeCartItem(target.cartItemId);
          await syncFromBackend(backendState.cartId);
          return;
        } catch {
          // Fall through to local.
        }
      }
    }

    removeFromCartLocal(productId);
  };

  const updateQuantity = async (productId, quantity) => {
    const backendState = backendRef.current;
    const nextQty = Math.max(0, Number(quantity) || 0);

    if (backendState.enabled && backendState.cartId) {
      const target = items.find((item) => String(item.productId) === String(productId));
      if (target?.cartItemId) {
        try {
          if (nextQty <= 0) {
            await removeCartItem(target.cartItemId);
          } else {
            await updateCartItemQuantity(
              target.cartItemId,
              clampByStock(nextQty, target.stock)
            );
          }
          await syncFromBackend(backendState.cartId);
          return;
        } catch {
          // Fall through to local.
        }
      }
    }

    updateQuantityLocal(productId, quantity);
  };

  const clearCart = async () => {
    const backendState = backendRef.current;
    if (backendState.enabled && backendState.cartId) {
      try {
        await clearBackendCart(backendState.cartId);
        setItems([]);
        return;
      } catch {
        // Fall back to local clear.
      }
    }
    clearCartLocal();
  };

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [items]
  );
  const discount = useMemo(() => (subtotal >= 1000 ? 120 : subtotal >= 500 ? 50 : 0), [subtotal]);
  const deliveryFee = useMemo(() => (subtotal > 0 ? 0 : 0), [subtotal]);
  const total = useMemo(() => Math.max(0, subtotal - discount + deliveryFee), [subtotal, discount, deliveryFee]);
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        discount,
        deliveryFee,
        total,
        totalItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export default CartContext;
