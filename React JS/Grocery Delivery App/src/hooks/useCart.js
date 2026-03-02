import { useMemo, useState } from 'react';

const useCart = () => {
  const [items, setItems] = useState([]);

  const addToCart = (product) => {
    setItems((prev) => [...prev, product]);
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(() => items.length, [items]);

  return {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    totalItems,
  };
};

export default useCart;
