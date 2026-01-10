"use client"

import { ProductCard } from "@calmar/ui"
import { useCart } from "@/hooks/use-cart"
import { Product } from "@calmar/types"

interface ProductCardWithCartProps {
  product: Product;
  priority?: boolean;
}

export function ProductCardWithCart({ product, priority }: ProductCardWithCartProps) {
  const { addItem, setIsOpen } = useCart()

  const handleAddToCart = () => {
    addItem(product, 1)
    setIsOpen(true)
  }

  return (
    <ProductCard 
      product={product} 
      onAdd={handleAddToCart}
      priority={priority}
    />
  )
}
