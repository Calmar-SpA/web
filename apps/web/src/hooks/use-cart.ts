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
  newsletterDiscount: number | null;
  setNewsletterDiscount: (discount: number | null) => void;
  total: number;
  itemCount: number;
}

const calculateTotal = (items: CartItem[], discount: number | null) => {
  const subtotal = items.reduce((acc, item) => acc + item.product.base_price * item.quantity, 0)
  if (discount && discount > 0) {
    return Math.floor(subtotal * (1 - discount / 100))
  }
  return subtotal
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      newsletterDiscount: null,
      setNewsletterDiscount: (discount) => {
        set({ newsletterDiscount: discount, total: calculateTotal(get().items, discount) })
      },
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

        const total = calculateTotal(newItems, get().newsletterDiscount)
        const itemCount = newItems.reduce((acc, item) => acc + item.quantity, 0)
        
        set({ items: newItems, total, itemCount })
      },
      removeItem: (productId) => {
        const newItems = get().items.filter((item) => item.product.id !== productId)
        const total = calculateTotal(newItems, get().newsletterDiscount)
        const itemCount = newItems.reduce((acc, item) => acc + item.quantity, 0)
        
        set({ items: newItems, total, itemCount })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return
        const newItems = get().items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
        const total = calculateTotal(newItems, get().newsletterDiscount)
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
        newsletterDiscount: state.newsletterDiscount,
      }),
    }
  )
)
