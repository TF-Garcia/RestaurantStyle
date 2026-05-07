import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MenuItem } from '../types';

export type CartItem = { item: MenuItem; quantity: number };
type CartContextValue = {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  total: number;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    addItem: (item) => setItems((current) => {
      const existing = current.find((cartItem) => cartItem.item.id === item.id);
      return existing ? current.map((cartItem) => (cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)) : [...current, { item, quantity: 1 }];
    }),
    removeItem: (id) => setItems((current) => current.filter((cartItem) => cartItem.item.id !== id)),
    clear: () => setItems([]),
    total: items.reduce((sum, cartItem) => sum + cartItem.item.price * cartItem.quantity, 0),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};
