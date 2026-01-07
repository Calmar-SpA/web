import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@calmar/types'

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  total: number;
  itemCount: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      addItem: (product, quantity = 1) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id)
        let newItems;

        if (existingItem) {
          newItems = items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        } else {
          newItems = [...items, { product, quantity }]
        }

        const total = newItems.reduce((acc, item) => acc + item.product.base_price * item.quantity, 0)
        const itemCount = newItems.reduce((acc, item) => acc + item.quantity, 0)
        
        set({ items: newItems, total, itemCount })
      },
      removeItem: (productId) => {
        const newItems = get().items.filter((item) => item.product.id !== productId)
        const total = newItems.reduce((acc, item) => acc + item.product.base_price * item.quantity, 0)
        const itemCount = newItems.reduce((acc, item) => acc + item.quantity, 0)
        
        set({ items: newItems, total, itemCount })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return
        const newItems = get().items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
        const total = newItems.reduce((acc, item) => acc + item.product.base_price * item.quantity, 0)
        const itemCount = newItems.reduce((acc, item) => acc + item.quantity, 0)
        
        set({ items: newItems, total, itemCount })
      },
      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'calmar-cart-storage',
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
      }),
    }
  )
)
